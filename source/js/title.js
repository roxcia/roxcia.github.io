// Dynamic title.
var OriginTitile = document.title;
var titleTime;

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    document.title = '👀 跑哪里去啦';
    clearTimeout(titleTime);
  } else {
    document.title = '🐾 抓到你啦~';
    titleTime = setTimeout(function () {
      document.title = OriginTitile;
    }, 2000);
  }
});