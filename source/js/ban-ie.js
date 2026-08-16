(function () {
  var ua = window.navigator.userAgent
  var isIE = ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1
  if (!isIE) return

  var message = '当前浏览器版本较旧，建议使用 Chrome、Edge 或 Firefox 浏览 roxcia的博客。'
  document.documentElement.className += ' ban-ie-mode'
  document.body.innerHTML = '<div id="ban-ie-screen"><div class="ban-ie-card"><h1>浏览器版本过旧</h1><p>' + message + '</p></div></div>'

  var style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = [
    '#ban-ie-screen{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#30cfd0 0%,#330867 100%);font-family:Arial,"Microsoft YaHei",sans-serif;color:#fff;}',
    '.ban-ie-card{width:min(520px,86vw);padding:36px 32px;border-radius:18px;background:rgba(255,255,255,.14);box-shadow:0 20px 60px rgba(0,0,0,.28);text-align:center;backdrop-filter:blur(12px);}',
    '.ban-ie-card h1{margin:0 0 16px;font-size:28px;}',
    '.ban-ie-card p{margin:0;font-size:16px;line-height:1.8;}'
  ].join('')
  document.head.appendChild(style)
})()
