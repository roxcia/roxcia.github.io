(function () {
  function loadNekoScroll () {
    if (document.body.clientWidth <= 992 || !window.jQuery) return

    var $ = window.jQuery

    if (!document.getElementById('myscoll')) {
      document.body.insertAdjacentHTML('beforeend', '<div id="myscoll"></div>')
    }

    function getBasicInfo () {
      var viewH = $(window).height()
      var docH = $('body')[0].scrollHeight
      var scrollTop = $(window).scrollTop()
      var scrollValue = docH - viewH
      var bandH = scrollValue > 0 ? scrollTop / scrollValue * 100 : 0
      return {
        ViewH: viewH,
        DocH: docH,
        ScrollTop: scrollTop,
        Band_H: bandH,
        S_V: scrollValue
      }
    }

    function show (basicInfo) {
      if (basicInfo.ScrollTop > 0.001) {
        $('.neko').css('display', 'block')
      } else {
        $('.neko').css('display', 'none')
      }
    }

    if (!$.fn.nekoScroll) {
      $.fn.nekoScroll = function (option) {
        var defaultSetting = {
          top: '0',
          scroWidth: '6px',
          z_index: 9999,
          zoom: 0.9,
          borderRadius: '5px',
          right: '60px',
          nekoname: 'neko',
          nekoImg: 'https://bu.dusays.com/2022/07/20/62d812db74be9.png',
          hoverMsg: '喵喵喵~',
          color: '#6f42c1',
          during: 500,
          blog_body: 'body',
          bgcolor: 'rgb(0 0 0 / .5)',
          scImg: ''
        }
        var setting = $.extend(defaultSetting, option)
        var getThis = this.prop('className') !== '' ? '.' + this.prop('className') : this.prop('id') !== '' ? '#' + this.prop('id') : this.prop('nodeName')

        $('.neko').remove()
        this.after('<div class="neko" id="' + setting.nekoname + '" data-msg="' + setting.hoverMsg + '"></div>')

        function renderNeko () {
          var basicInfo = getBasicInfo()
          var progressHeight = basicInfo.Band_H * setting.zoom * basicInfo.ViewH * 0.01

          $(getThis).css({
            position: 'fixed',
            width: setting.scroWidth,
            top: setting.top,
            height: progressHeight + 'px',
            zIndex: setting.z_index,
            backgroundColor: setting.bgcolor,
            borderRadius: '2em',
            right: setting.right,
            backgroundImage: '-webkit-linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.1) 75%, transparent 75%, transparent)',
            backgroundSize: 'contain',
            cursor: 'pointer'
          })

          $('#' + setting.nekoname).css({
            position: 'fixed',
            top: progressHeight - 50 + 'px',
            zIndex: setting.z_index * 10,
            right: setting.right,
            backgroundImage: 'url(' + setting.nekoImg + ')'
          })

          show(basicInfo)

          if (basicInfo.ScrollTop >= basicInfo.S_V - 1) {
            $('#' + setting.nekoname).addClass('showMsg')
          } else {
            $('#' + setting.nekoname).removeClass('showMsg')
            $('#' + setting.nekoname).attr('data-msg', setting.hoverMsg)
          }
        }

        $(window).off('scroll.nekoScroll resize.nekoScroll')
        $(window).on('scroll.nekoScroll resize.nekoScroll', renderNeko)

        this.off('click.nekoScroll').on('click.nekoScroll', function () {
          btf.scrollToDest(0, setting.during)
        })

        $('#' + setting.nekoname).off('click.nekoScroll').on('click.nekoScroll', function () {
          btf.scrollToDest(0, setting.during)
        })

        renderNeko()
        return this
      }
    }

    $('#myscoll').nekoScroll({
      bgcolor: 'rgb(0 0 0 / .5)',
      borderRadius: '2em',
      zoom: 0.9,
      nekoname: 'neko',
      hoverMsg: '回到顶部喵~'
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNekoScroll)
  } else {
    loadNekoScroll()
  }

  document.addEventListener('pjax:complete', loadNekoScroll)
})()
