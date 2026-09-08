---
title: RMI
date: 2026-09-02 21:51:27
categories:
  - java代码审计
tags:
  - Java
  - RMI
  - 反序列化
---

## RMI

RMI 当中的攻击手法只在 jdk8u121 之前才可以进行攻击，因为在 8u121 之后，bind rebind unbind 这三个方法只能对 localhost 进行攻击，后续我们会提到。

## 0x02 RMI 基础

### 1. RMI 介绍

RMI 全称 Remote Method Invocation（远程方法调用），即在一个 JVM 中 Java 程序调用在另一个远程 JVM 中运行的 Java 程序，这个远程 JVM 既可以在同一台实体机上，也可以在不同的实体机上，两者之间通过网络进行通信。

RMI 依赖的通信协议为 JRMP(Java Remote Message Protocol，Java 远程消息交换协议)，该协议为 Java 定制，要求服务端与客户端都为 Java 编写。

- 这个协议就像 HTTP 协议一样，规定了客户端和服务端通信要满足的规范。

![img](/images/java-code-audit/11-rmi/20260828204419888.png)

> Server ———— 服务端：服务端通过绑定远程对象，这个对象可以封装很多网络操作，也就是 Socket
> Client ———— 客户端：客户端调用服务端的方法

因为有了 C/S 的交互，而且 Socket 是对应端口的，这个端口是动态的，所以这里引进了第三个 RMI 的部分 ———— Registry 部分。

- Registry ———— 注册端；提供服务注册与服务获取。即 Server 端向 Registry 注册服务，比如地址、端口等一些信息，Client 端从 Registry 获取远程对象的一些信息，如地址、端口等，然后进行远程调用。

### 2. RMI 的实现

- 这里最好把服务端与客户端拆分成两个工程来做，会更有助于理解。

先来写服务端 ———— Server

**1. 先编写一个远程接口，其中定义了一个 sayHello() 的方法**

JAVA

```java
public interface RemoteObj extends Remote {  
  
    public String sayHello(String keywords) throws RemoteException;  
}
```

此远程接口要求作用域为 public；
继承 Remote 接口；
让其中的接口方法抛出异常

**2. 定义该接口的实现类 Impl**

JAVA

```java
public class RemoteObjImpl extends UnicastRemoteObject implements RemoteObj { 
  
    public RemoteObjImpl() throws RemoteException {  
    //    UnicastRemoteObject.exportObject(this, 0); // 如果不能继承 UnicastRemoteObject 就需要手工导出  
 }  
  
    @Override  
 public String sayHello(String keywords) throws RemoteException {  
        String upKeywords = keywords.toUpperCase();  
 System.out.println(upKeywords);  
 return upKeywords;  
 }  
}
```

- 实现远程接口
- 继承 UnicastRemoteObject 类，用于生成 Stub（存根）和 Skeleton（骨架）。 这个在后续的通信原理当中会讲到
- 构造函数需要抛出一个RemoteException错误
- 实现类中使用的对象必须都可序列化，即都继承`java.io.Serializable`

**3. 注册远程对象**

```java
public class RMIServer {  
    public static void main(String[] args) throws RemoteException, AlreadyBoundException, MalformedURLException {  
        // 实例化远程对象  
 RemoteObj remoteObj = new RemoteObjImpl();  
 // 创建注册中心  
 Registry registry = LocateRegistry.createRegistry(1099);  
 // 绑定对象示例到注册中心  
 registry.bind("remoteObj", remoteObj);  
 }  
}
```

- port 默认是 1099，不写会自动补上，其他端口必须写
- bind 的绑定这里，只要和客户端去查找的 registry 一致即可。

如此，服务端就写好了

#### 客户端

客户端只需从从注册器中获取远程对象，然后调用方法即可。当然客户端还需要一个远程对象的接口，不然不知道获取回来的对象是什么类型的。

所以在客户端这里，也需要定义一个远程对象的接口：

```java
public interface RemoteObj extends Remote {  
  
    public String sayHello(String keywords) throws RemoteException;  
}
```

然后编写客户端的代码，获取远程对象，并调用方法

```java
public class RMIClient {  
    public static void main(String[] args) throws Exception {  
        Registry registry = LocateRegistry.getRegistry("127.0.0.1", 1099);  
 RemoteObj remoteObj = (RemoteObj) registry.lookup("remoteObj");  
 remoteObj.sayHello("hello");  
 }  
}
```

这样就能够从远端的服务端中调用 RemoteHelloWorld 对象的 `sayHello()` 方法了。

## 0x03 从 Wireshark 抓包分析 RMI 通信原理

- 这里文章大部分是引用其他师傅的，我们可以先通过 Wireshark 的抓包心里有个底。

### 数据端与注册中心（1099 端口）建立通讯

![image-20260829100803981](/images/java-code-audit/11-rmi/20260829100804201.png)

此时1812是客户端的端口 1099是注册中心

数据端与注册中心（1099 端口）建立通讯完成后，RMI Server 向远端发送了⼀个 “Call” 消息，远端回复了⼀个 “ReturnData” 消息，然后 RMI Server 端新建了⼀个 TCP 连接，连到远端的 33769 端⼝

![image-20260829101330303](/images/java-code-audit/11-rmi/20260829101330443.png)

### 客户端新起一个端口与服务端建立 TCP 通讯

客户端发送远程引用给服务端，服务端返回函数唯一标识符，来确认可以被调用

![image-20260829101950490](/images/java-code-audit/11-rmi/20260829101950719.png)

同样使用序列化的传输形式

以上两个过程对应的代码是这两句

```java
Registry registry = LocateRegistry.getRegistry("127.0.0.1", 1099);  
RemoteObj remoteObj = (RemoteObj) registry.lookup("remoteObj"); // 查找远程对象
```

这里会返回一个 Proxy 类型函数，这个 Proxy 类型函数会在我们后续的攻击中用到。

### 客户端序列化传输调用函数的输入参数至服务端

- 这一步的同时：服务端返回序列化的执行结果至客户端

![image-20260829101924009](/images/java-code-audit/11-rmi/20260829101924170.png)

以上调用通讯过程对应的代码是这一句

```java
remoteObj.sayHello("hello");
```

可以看出所有的数据流都是使用序列化传输的，那必然在客户端和服务带都存在反序列化的语句。

### 总结一下 RMI 的通信原理

实际建⽴了两次 TCP 连接，第一次是去连 1099 端口的；第二次是由服务端发送给客户端的。

在第一次连接当中，是客户端连 Registry 的，在其中寻找 Name 为 hello 的对象，这个对应数据流中的 Call 消息；然后 Registry 返回⼀个序列化的数据，这个就是找到的 `Name=Hello` 的对象，这个对应数据流中的ReturnData消息。

到了第二次连接，服务端发送给客户端 Call 的消息。客户端反序列化该对象，发现该对象是⼀个远程对象，地址在 172.17.88.209:24429，于是再与这个地址建⽴ TCP 连接；在这个新的连接中，才执⾏真正远程⽅法调⽤，也就是 `sayHello()`

RMI Registry 就像⼀个⽹关，他⾃⼰是不会执⾏远程⽅法的，但 RMI Server 可以在上⾯注册⼀个 Name 到对象的绑定关系；RMI Client 通过 Name 向 RMI Registry 查询，得到这个绑定关系，然后再连接 RMI Server；最后，远程⽅法实际上在 RMI Server 上调⽤。

## 0x04 从 IDEA 断点分析 RMI 通信原理

- RMI 的这个流程是相当复杂的，需要师傅们有一定的耐心看下去。

### 1. 流程分析总览

首先 RMI 有三部分：

- RMI Registry
- RMI Server
- RMI Client

如果两两通信就是 3+2+1 = 6 个交互流程，还有三个创建的过程，一共是九个过程。

![img](/images/java-code-audit/11-rmi/20260829114725196.png)

### 2. 创建远程服务

\> 先行说明，创建远程服务这一块是不存在漏洞的。

断点打在 RMIServer 的创建远程对象这里，如图

![image-20260829115449503](/images/java-code-audit/11-rmi/20260829115449746.png)

#### 发布远程对象

开始调试，首先是到远程对象的构造函数 `RemoteObjImpl`，现在我们要把它发布到网络上去，我们要分析的是**它如何被发布到网络上去的**

**`RemoteObjImpl`** 这个类是继承于 `UnicastRemoteObject` 的，所以先会到父类的构造函数，父类的构造函数这里的 port 传入了 0，它代表一个随机端口。

![image-20260829115649573](/images/java-code-audit/11-rmi/20260829115649702.png)

> 这个过程不同于注册中心的 1099 端口，这是远程服务的。有很多文章在这个地方都交代的不清楚，误导了一些师傅。

远程服务这里如果传入的是 0，它会被发布到网络上的一个随机端口，我们可以继续往下看一看。先 f8 到 `exportObject()`，再 f7 跳进去看。

`exportObject()` 是一个静态函数，它就是主要负责**将远程服务发布到网络上**，如何更好理解 `exportObject()` 的作用呢？我们可以看到 `RemoteObjImpl` 这个实现类的构造函数里面，我注销了一句代码

```java
public RemoteObjImpl() throws RemoteException {  
//     UnicastRemoteObject.exportObject(this, 0); // 如果不能继承 UnicastRemoteObject 就需要手工导出  
 }
```

如果不继承 `UnicastRemoteObject` 这个类的话，我们就需要手动调用这个函数。

我们来看这个静态函数，第一个参数是 obj 对象，第二个参数是 `new UnicastServerRef(port)`，第二个参数是用来处理网络请求的。继续往下面跟，去到了 `UnicastServerRef` 的构造函数。这里跟的操作先 f7，然后点击 `UnicastServerRef` 跟进，这是 IDEA 的小技巧。

![image-20260829121834489](/images/java-code-audit/11-rmi/20260829121834790.png)

跟进去之后 UnicastServerRef 的构造函数，我们看到它 new 了一个 LiveRef(port)，这个非常重要，它算是一个网络引用的类，跟进看一看。

![image-20260902095534428](/images/java-code-audit/11-rmi/20260902095534591.png)

跟进去之后，先是一个构造函数，先跳进 this 看一看

![image-20260902095623612](/images/java-code-audit/11-rmi/20260902095623667.png)

```java
 public LiveRef(ObjID objID, int port) {
        this(objID, TCPEndpoint.getLocalEndpoint(port), true);
    }
```

第一个参数 ID，第三个参数为 true，所以我们重点关注一下第二个参数。

TCPEndpoint 是一个网络请求的类，我们可以去看一下它的构造函数，传参进去一个 IP 与一个端口，也就是说传进去一个 IP 和一个端口，就可以进行网络请求。

![image-20260902095901107](/images/java-code-audit/11-rmi/20260902095901156.png)

继续 f7 进到 LiveRef 的构造函数 this 里面

这时候我们可以看一下一些赋值，发现 host 和 port 是赋值到了 endpoint 里面，而 endpoint 又是被封装在 LiveRef 里面的，所以记住数据是在 LiveRef 里面即可，并且这一 LiveRef 至始至终只会存在一个。

![image-20260902100432107](/images/java-code-audit/11-rmi/20260902100432172.png)

上述是 LiveRef 创建的过程，然后我们再回到之前出现 `LiveRef(port)` 的地方

------

回到上文那个地方，继续 f7 进入 super 看一看它的父类 `UnicastRef`，这里就证明整个**创建远程服务**的过程只会存在一个 LiveRef。一路 f7 到一个静态函数 `exportObject()`，我们后续的操作过程都与 `exportObject()` 有关，基本都是在调用它，这一段不是很重要，一路 f7 就好了。直到此处出现 Stub

![image-20260902100844589](/images/java-code-audit/11-rmi/20260902100844653.png)

- RMI 先在 Service 的地方，也就是服务端创建一个 Stub，再把 Stub 传到 RMI Registry 中，最后让 RMI Client 去获取 Stub。

> 接着我们研究 Stub 产生的这一步，先进到 createProxy 这个方法里面

先进行了基本的赋值，然后我们继续 f8 往下看，去到判断的地方。

- RMI 先在 Service 的地方，也就是服务端创建一个 Stub，再把 Stub 传到 RMI Registry 中，最后让 RMI Client 去获取 Stub。

> 接着我们研究 Stub 产生的这一步，先进到 createProxy 这个方法里面

先进行了基本的赋值，然后我们继续 f8 往下看，去到判断的地方。

![image-20260902101453603](/images/java-code-audit/11-rmi/20260902101453679.png)

这个判断暂时不用管，后续我们会碰到，那个时候再讲。

再往下走，我们可以看到这是很明显的类加载的地方

![image-20260902101914559](/images/java-code-audit/11-rmi/20260902101914623.png)

第一个参数是 AppClassLoader，第二个参数是一个远程接口，第三个参数是调用处理器，调用处理器里面只有一个 ref，它也是和之前我们看到的 ref 是同一个，创建远程服务当中永远只有一个 ref。

此处就把动态代理创建好了，如图 Stub

![image-20260902103236326](/images/java-code-audit/11-rmi/20260902103236401.png)

继续 f8，到 Target 这里，Target 这里相当于一个总的封装，将所有用的东西放到 Target 里面，我们可以进去看一看 Target 里面都放了什么。

![image-20260902103445498](/images/java-code-audit/11-rmi/20260902103445553.png)

![image-20260902103629997](/images/java-code-audit/11-rmi/20260902103630074.png)

并且这里的几个 ref 都是同一个，通过 ID 就可以查看到它们是同一个。比如比较 disp 和 stub 的。一个是服务端 ，一个是客户端的，ID 是一样的，

一路 f8，回到之前的 Target，下一条语句是 `ref.exportObject(target)`，也就是把 target 这个封装好了的对象发布出去。

![image-20260902104056771](/images/java-code-audit/11-rmi/20260902104056843.png)

我们跟进去看一下它的发布逻辑是怎么一回事，一路 f7 到这里

![image-20260902104815553](/images/java-code-audit/11-rmi/20260902104815628.png)

从这里开始，第一句语句 listen，真正处理网络请求了跟进去

![image-20260902105057947](/images/java-code-audit/11-rmi/20260902105058013.png)

先获取 TCPEndpoint，然后我们继续 f8 往后看，直到 `server = ep.newServerSocket();` 这里。

![image-20260902105143540](/images/java-code-audit/11-rmi/20260902105143602.png)

它创建了一个新的 socket，已经准备好了，等别人来连接，所以之后在 Thread 里面去做完成连接之后的事儿

![image-20260902105839575](/images/java-code-audit/11-rmi/20260902105839629.png)

#### 发布完成之后的记录

- 也就是记录一下**远程服务**被发到哪里去了。

第一个语句 `target.setExportedTransport(this);` 是一个简单的赋值，我们就不看了，看下面的 `ObjectTable.putTarget(target);`，跟进去，一路 f8，因为都是一些赋值的语句，直到此处。

![image-20260902110158290](/images/java-code-audit/11-rmi/20260902110158368.png)

RMI 这里会把所有的信息保存到**两个 table**里面

个人理解这段东西有点像日志。

#### 小结一下创建远程服务

从思路来说是不难的，也就是发布远程对象，用 `exportObject()` 指定到发布的 IP 与端口，端口的话是一个随机值。至始至终复杂的地方其实都是在赋值，创建类，进行各种各样的封装，实际上并不复杂。

还有一个过程就是发布完成之后的记录，理解的话，类似于日志就可以了，这些记录是保存到静态的 HashMap 当中。

这一块是服务端自己创建远程服务的这么一个操作，所以这一块是不存在漏洞的。

### 3. 创建注册中心 + 绑定

- 创建注册中心与服务端是独立的，所以谁先谁后无所谓，本质上是一整个东西。

断点打在此处，开始调试

![image-20260902110713006](/images/java-code-audit/11-rmi/20260902110713073.png)

#### 创建注册中心

首先会经过一个静态方法 ———— `createRegistry`，继续往下，走到了 `RegistryImpl` 这个对象下，f8 进去，会发现新建了一个 `RegistryImpl` 对象。这里 122 行，判断 port 是否为注册中心的 port，以及是否开启了 SecurityManager，也就是一系列的安全检查，这部分不是很重要，继续 f8

![image-20260902111015758](/images/java-code-audit/11-rmi/20260902111015828.png)

再往下走，它创建了一个 `LiveRef`，以及创建了一个新的 `UnicastServerRef`，这段代码就和我们上面讲的[ **创建远程对象** ](https://drun1baby.top/2022/07/19/Java反序列化之RMI专题01-RMI基础/创建远程服务)是很类似的，我们可以跟进 `setup` 看一下。

![image-20260902111216589](/images/java-code-audit/11-rmi/20260902111216664.png)

跟进之后发现和之前是一样的，也是先赋值，然后进行 `exportObject()` 方法的调用。

![image-20260902111255228](/images/java-code-audit/11-rmi/20260902111255287.png)

![image-20260902111622338](/images/java-code-audit/11-rmi/20260902111622426.png)

这代表我们创建注册中心这个对象，是一个永久对象，而之前远程对象是一个临时对象。

f7 进到 exportObject，就和发布远程对象一样，到了创建 Stub 的阶段。

![image-20260902111701784](/images/java-code-audit/11-rmi/20260902111701879.png)

我们还是跟进 `createProxy()` 中，首先这里要做一个判断。看看stub是如何创建的

![image-20260902112122259](/images/java-code-audit/11-rmi/20260902112122372.png)

可以跟进 `stubClassExists` 进行判断，我们看到这个地方，是判断是否能获取到 `RegistryImpl_Stub` 这个类，换句话说，也就是若 `RegistryImpl_Stub` 这个类存在，则返回 True，反之 False。我们可以找到 `RegistryImpl_Stub` 这个类是存在的。

![image-20260902112449621](/images/java-code-audit/11-rmi/20260902112449717.png)

- 对比**发布远程对象**那个步骤，创建注册中心是走进到 `createStub(remoteClass, clientRef);` 进去的，而**发布远程对象**则是直接创建动态代理的。

  ![image-20260902112642286](/images/java-code-audit/11-rmi/20260902112642396.png)

执行的这个方法也很简单，就是直接通过反射创建这个对象，里面放的就是 ref

![image-20260902112824482](/images/java-code-audit/11-rmi/20260902112824578.png)

相比于之前**发布远程对象**中的 Stub，是一个动态代理，里面放的是一个 ref。
现在**发布远程对象**是用 forName 创建的，里面放的也是 ref，是一致的。

继续往下，如果是服务端定义好的，就调用 `setSkeleton()` 方法，跟进去。然后这里有一个 `createSkeleton()` 方法，一看名字就知道是用来创建 Skeleton 的，而 Skeleton 在我们的那幅图中，作为服务端的代理。

![image-20260902113057242](/images/java-code-audit/11-rmi/20260902113057339.png)

![image-20260902113131082](/images/java-code-audit/11-rmi/20260902113131192.png)

Skeleton 是用 `forName()` 的方式创建的，如图。

- 再往后走，又到了 Target 的地方，Target 部分的作用也与之前一样，用于储存封装的数据

![image-20260902113325724](/images/java-code-audit/11-rmi/20260902113325826.png)

其他迅速跳过，到达这个位置

![image-20260902113626543](/images/java-code-audit/11-rmi/20260902113626619.png)

继续走，直到 `super.exportObject(target);` 这里，f7 跟进，到里面有一个 `putTarget()` 方法，它会把封装的数据放进去。

![image-20260902113829649](/images/java-code-audit/11-rmi/20260902113829719.png)

![image-20260902113849367](/images/java-code-audit/11-rmi/20260902113849457.png)

看看都存放了哪些数据

#### 查看封装了哪些数据进去

查看 static 中的数据，点开 `objTable` 中查看三个 Target，我们逐个分析一下，分析的话主要还是看 ref ~

先点开这个 Target@1098 的 value，主要关注几个参数：disp 中的 skel，以及 stub。它们的端口都是 1099，也就是说 1099 注册中心的一些端口数据都有了。这两个 ref 是同一个，可以对比着看一下。

![image-20260902114207336](/images/java-code-audit/11-rmi/20260902114207420.png)

先点开这个 Target@1098 的 value，存储里面需要我们关注的有 stub 是 `$Proxy` 对象的，如图查看它们的 ref

![image-20260902114244853](/images/java-code-audit/11-rmi/20260902114244933.png)

所以这里就是起了几个远程服务，一个端口是固定了，另外两个端口是不固定的，随机产生的。至于为什么这里有三个 Target 呢？

#### 绑定

- 绑定也就是最后一步，bind 操作

断点下在 bind 语句那里。我们开始调试

![image-20260902115058934](/images/java-code-audit/11-rmi/20260902115059017.png)

下一句检查一下 bindings 这里面是否有东西，其实 bindings 就是一个 HashTable。如果里面有数据的话就抛出异常。

![image-20260902115403546](/images/java-code-audit/11-rmi/20260902115403632.png)

继续往前走，就是 `bindings.put(name, obj);`，也挺好理解的，就是把 IP 和端口放进去，到此处，绑定过程就结束了hhhh，是最简单的一个过程

![image-20260902120209750](/images/java-code-audit/11-rmi/20260902120209940.png)

#### 小结一下创建注册中心 + 绑定

- 总结一下比较简单，注册中心这里其实和发布远程对象很类似，不过多了一个持久的对象，这个持久的对象就成为了注册中心。

绑定的话就更简单了，一句话形容一下就是 `hashTable.put(IP, port)`

### 3. 客户端请求，客户端调用注册中心

- 这一部分是存在漏洞的点，原因很简单，因为前文我们在 Wireshark 的抓包里头说到：”RMI 是一个基于序列化的 Java 远程方法调用机制”，这里有一些个有问题的反序列化 ~
- 且听我娓娓道来

客户端的请求分为三个阶段，获取注册中心，查找对象，

#### 获取注册中心

这一块不存在漏洞，我们可以调试看一下，很简单。

断点的话，三句代码都先下断点，接着开始调试。

![image-20260902120417119](/images/java-code-audit/11-rmi/20260902120417196.png)

进到 `getRegistry()` 方法里面，继续往下走，这里调试部分大家可以自己看一下，都不难的，无非是一些赋值与判断，大致流程其实和之前是很像的，有 `new LiveRef` 的操作，有 `Util.createProxy()` 的操作，感兴趣的师傅们可以跟进去看一下，是一样的流程。也是通过 `forName` 的方式创建的。

![image-20260902120642992](/images/java-code-audit/11-rmi/20260902120643092.png)

就和之前一样，新建了一个 Ref，然后把该封装的都封装到 Ref 里面进去。这里封装的是 `127.0.01:1099` 的，这里我们就获取到了注册中心的 Stub，下一步就是去查找远程对象。

#### 查找远程对象

- 这里调试的话，因为对应的 Java 编译过的 class 文件是 1.1 的版本，无法进行打断点，所以会直接跳到其他地方去，比如此处。

  

  ![image-20260902121123027](/images/java-code-audit/11-rmi/20260902121123105.png)

  代码是可以按照正常的逻辑走的，就是打不了断点，问题不大，我们主要分析一下代码运行的逻辑。

  先看我们变量里面多了一个 `param_1="remoteObj"`，这个东西就是传参的 String var1，这个 var1 最后是作为序列化的数据传进去的。注册中心后续会通过反序列化读取。

![image-20260902121223687](/images/java-code-audit/11-rmi/20260902121223777.png)

接着下一步，我们看到 `super.ref.invoke(var2);`，super 就是父类，也就是我们之前说的 `UnicastRef` 这个类。这里的 `invoke()` 方法是类似于激活的方法，`invoke()` 方法里面会调用 `call.executeCall()`，它是真正处理网络请求的方法，也就是客户端的网络请求都是通过这个方法实现的。

![image-20260902121937330](/images/java-code-audit/11-rmi/20260902121937447.png)

- 这个方法后续再细讲，先看整个代码运行的逻辑。

我们的逻辑现在是从 `invoke()` —> `call.executeCall()` —> `out.getDGCAckHandler()`，到 `out.getDGCAckHandler()` 这个地方的时候，是 try 打头的，这里它有一个异常存在潜在攻击的可能性，如图，中间省略了部分代码。

![image-20260902122534391](/images/java-code-audit/11-rmi/20260902122534527.png)

![image-20260902122842251](/images/java-code-audit/11-rmi/20260902122842517.png)

我们先看一下 `in` 这个变量是什么

![image-20260902123011168](/images/java-code-audit/11-rmi/20260902123011239.png)

不难理解，in 就是数据流里面的东西。这里获取异常的本意应该是在报错的时候把一整个信息都拿出来，这样会更清晰一点，但是这里就出问题了 ———— 如果一个注册中心返回一个恶意的对象，客户端进行反序列化，这就会导致漏洞。这里的漏洞相比于其他漏洞更为隐蔽。

- 也就是说，只要调用 `invoke()`，就会导致漏洞。RMI 在设计之初就并未考虑到这个问题，导致客户端都是易受攻击的。

上述就是注册中心与客户端进行交互时会产生的攻击。

我们这里继续 f8，看一下到最后一步的时候获取到了什么数据。简单来说就是获取到了 RemoteObj 这个动态代理，其中包含一个 ref。

![image-20260902123817777](/images/java-code-audit/11-rmi/20260902123817868.png)

### 4. 客户端请求，客户端请求服务端

> 存在漏洞

这里就是客户端请求的第三句代码 ———— `remoteObj.sayHello("hello");` 的运行逻辑

![image-20260902124100742](/images/java-code-audit/11-rmi/20260902124100813.png)

下面是一堆 if 的判断，都是关于抛出异常的，这里就不再细看了，直接跳过。直到尾部这个地方，我们跟进去看一下。

![image-20260902140440489](/images/java-code-audit/11-rmi/20260902140440672.png)

跟进到此处，`ref.invoke()`，这是一个重载的方法，跟进到重载的 `invoke()` 方法里面。这个重载的 `invoke` 方法作用是创建了一个连接，和之前也比较类似。我们可以看一下它具体的逻辑实现。

![image-20260902140531263](/images/java-code-audit/11-rmi/20260902140531339.png)

通过重载的invoke建立连接

继续往里走，在循环里面有一个 `marshalValue()` 方法。

![image-20260902140910710](/images/java-code-audit/11-rmi/20260902140910786.png)

它会序列化一个值，这个值其实就是我们传进的参数 `roxcia，它的逻辑如图。判断一堆类型，之后再进行序列化

继续往前走，我们看到一个注释 `// unmarshal return`，后面接的是 `call.executeCall()`，之前我们也看到了这个方法，也就是说只要 RMI 处理网络请求，就一定会执行到这个方法，这里是存在危险的，原理上面已经代码跟过一遍了 ~

所以我们直接往后看。

- 这里有一个 `unmarshalValueSee` 的方法，因为现在我们传进去的类型是 String，不符合上面的一系列类型，这里会进行反序列化的操作，把这个数据读回来，这里是存在入口类的攻击点的。

![image-20260902141029818](/images/java-code-audit/11-rmi/20260902141029913.png)

![image-20260902141050380](/images/java-code-audit/11-rmi/20260902141050450.png)

这个数据会被读回来

#### 关于客户端一系列主动请求的小结

- 先说说存在攻击的点吧，在注册中心 –> 服务端这里，查找远程对象的时候是存在攻击的。

具体表现形式是服务端打客户端，入口类在 `call.executeCall()`，里面抛出异常的时候会进行反序列化。
这里可以利用 URLClassLoader 来打，具体的攻击在后续文章会写。

在服务端 —> 客户端这里，也是存在攻击的，一共是两个点：一个是 `call.executeCall()`，另一个点是 `unmarshalValueSee` 这里。

- 再总结一下代码的流程

分为三步走，先获取注册中心，再查找远程对象，查找远程对象这里获取到了一个 ref，最后客户端发出请求，与服务端建立连接，进行通信

### 5. 客户端发起请求，注册中心如何处理

先说说断点怎么打，因为客户端那里，我们操作的是 Stub，服务端这边操作的是 Skel。在有了 Skel 之后应当是存在 Target 里面的，所以我们的断点打到处理 Target 的地方。

断点位置如图

![image-20260902202950000](/images/java-code-audit/11-rmi/20260902202957198.png)

先点 Server 的 Debug，再跑 Client 就可以了

往下走，我们先看一看 Target 里面包含了什么

![image-20260902203050829](/images/java-code-audit/11-rmi/20260902203050945.png)

里面包含一个 stub，stub 中是一个 ref，这个 ref 对应的是 1099 端口。

![image-20260902203253612](/images/java-code-audit/11-rmi/20260902203253730.png)

再往下走 `final Dispatcher disp = target.getDispatcher();` 是将 `skel` 的值放到 disp 里面。

继续往下走，它会调用 disp 的 dispatch 方法，我们跳进去看一下 `disp.dispatch()`

![image-20260902204233937](/images/java-code-audit/11-rmi/20260902204234013.png)

继续走，我们目前的 `skel` 不为 null，会到 `oldDispatch()` 这里，跟进。

![image-20260902204956422](/images/java-code-audit/11-rmi/20260902204956509.png)

下面就是 `skel.dispatch()` 的过程了，这里才是重点，这里就是很多师傅文章里面会提到的 **客户端打注册中心** 的攻击方式。

- 先介绍一下这段源码吧，很长，基本都是在做 case 的工作。

我们与注册中心进行交互可以使用如下几种方式：

- list
- bind
- rebind
- unbind
- lookup

这几种方法位于 `RegistryImpl_Skel#dispatch` 中，也就是我们现在 dispatch 这个方法的地方。

如果存在对传入的对象调用 `readObject` 方法，则可以利用，`dispatch` 里面对应关系如下：

- 0->bind
- 1->list
- 2->lookup
- 3->rebind
- 4->unbind

只要中间是有反序列化就是可以攻击的，而且我们是从客户端打到注册中心，这其实是黑客们最喜欢的攻击方式。我们来看一看谁可以攻击。

![image-20260902205631836](/images/java-code-audit/11-rmi/20260902205631915.png)

![image-20260902205623318](/images/java-code-audit/11-rmi/20260902205623422.png)

通过尝试也就是除了list，其他都可以

#### 小结一下客户端发起请求，注册中心做了什么

简单，注册中心就是处理 Target，进行 Skel 的生成与处理。

漏洞点是在 dispatch 这里，存在反序列化的入口类。这里可以结合 CC 链子打的。

### 6. 客户端发起请求，服务端做了什么

- 这个流程是比较简单的，同第四点一样，此处得到的 Skel 是动态代理 `$Proxy0` 这个类的，之前我们提到过其实是封装了三个 Target 的，这就是其中之一。

这里的断点位置打两个，如图：

![image-20260902212227458](/images/java-code-audit/11-rmi/20260902212227604.png)

也就是当前请求到的是服务端的 Target，我们开始调试。

- 调试这里有一点小坑，打完两个断点之后，我们得到的第一个 Target 中的 Stub 是 DGCImpl 的，我们要的不是这个，前文我们提到过，这个类是用来处理内存垃圾的。

#### 动态代理的 stub

这里要摁两下一下 f9，直至有 Proxy 动态代理的 stub 为止，如图：

![image-20260902212835818](/images/java-code-audit/11-rmi/20260902212835953.png)

在这种情况下，我们到 `dispatch()` 方法下，跟进。

![image-20260902213210625](/images/java-code-audit/11-rmi/20260902213210780.png)

这里的 skel 为 null，所以不会执行 oldDispatch 方法，如图

![image-20260902213303266](/images/java-code-audit/11-rmi/20260902213303384.png)

继续往下走，获取到输入流，以及 Method，Method 就是我们之前写的 `sayHello()` 方法。

继续往下走，重点部分来了 ———— 循环当中的 `unmarshalValue()` 方法，这里和我们之前说的一样，是存在漏洞的。

![image-20260902213754378](/images/java-code-audit/11-rmi/20260902213754434.png)

![image-20260902213826618](/images/java-code-audit/11-rmi/20260902213826673.png)

这里的流程和之前是一致的，也就是我们的 `"roxci"` 传参传进去，序列化读进去，反序列化读出来，和之前是一致的。

#### DGC 的 stub

三个 Target 当中的一个

断点需要下在 `ObjectTable` 类的 `putTarget()` 方法里面。并且将前面两个断点去掉，直接调试即可。

![image-20260902214626487](/images/java-code-audit/11-rmi/20260902214626544.png)

- 首先我们去看一看 DGC 的运行原理是什么

还是比较简单的，将 Target 放到一个静态表里面，这里静态表就是我在第三点说的，ObjectTable 里面封装了三个 Target。

![image-20260902214816503](/images/java-code-audit/11-rmi/20260902214816563.png)

然后这里我们会发现，放进去的是 Proxy 这个动态代理的 Target 而非 DGC 的 Target。

这个 DGC 的 Target 挺奇妙的，是已经被封装到了 static 里面，我们去看 static 里面，发现它已经被封装进去了。

- 那它到底是怎么创建的呢？我们一步步看。

> 在 DGC 这个类在调用静态变量的时候，就会完成类的初始化。

类的初始化是由 DGCImpl 这个类完成的，我们跟到 DGCImpl 中去看，发现里面有一个 static 方法，作用是 class initializer

具体的先不看了

#### 小结一下 DGC 的过程

- 是自动创建的一个过程，用于清理内存。

漏洞点在客户端与服务端都存在，存在于 `Skel` 与 `Stub` 当中。这也就是所谓的 JRMP 绕过

## 0x05 总结

- 如果是漏洞利用的话，单纯攻击 RMI 意义是不大的，不论是 codespace 的那种利用，难度很高，还是说三者互相打这种，意义都不是很大，因为在 jdk8u121 之后都基本修复完毕了。

RMI 多数的利用还是在后续的 fastjson，strust2 这种类型的攻击组合拳比较多，希望这篇文章能对正在学习 RMI 的师傅们提供一点帮助。