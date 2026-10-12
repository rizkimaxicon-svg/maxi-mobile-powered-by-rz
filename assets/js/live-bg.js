/* MAXICON — logika latar hidup. Cari semua elemen class="lb-root" di halaman dan jalankan di situ.
   Tidak butuh config apa pun; otomatis mengikuti jam PERANGKAT pengguna. Aman dihapus: cabut file ini. */
(function () {
  'use strict';
  var STOPS = [
    { h: 0, top: '#17306B', bot: '#0B1C44', glow: '#2A4A8F', star: 1, beam: .25 },
    { h: 8.5, top: '#FCF3DD', bot: '#F5C44D', glow: '#FFE9B0', star: 0, beam: .55 },
    { h: 13, top: '#EAF4FC', bot: '#8FC6EE', glow: '#FFFFFF', star: 0, beam: .35 },
    { h: 16.5, top: '#F2A65A', bot: '#D8502A', glow: '#FFD98A', star: 0, beam: .7 },
    { h: 22, top: '#17306B', bot: '#0B1C44', glow: '#2A4A8F', star: 1, beam: .25 },
    { h: 24, top: '#17306B', bot: '#0B1C44', glow: '#2A4A8F', star: 1, beam: .25 }
  ];
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(a, b, t) {
    var ai = parseInt(a.slice(1), 16), bi = parseInt(b.slice(1), 16);
    var ar = ai >> 16 & 255, ag = ai >> 8 & 255, ab = ai & 255, br = bi >> 16 & 255, bg = bi >> 8 & 255, bb = bi & 255;
    var r = Math.round(lerp(ar, br, t)), g = Math.round(lerp(ag, bg, t)), bl = Math.round(lerp(ab, bb, t));
    return '#' + [r, g, bl].map(function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
  }
  function paletteAt(hour) {
    for (var i = 0; i < STOPS.length - 1; i++) {
      if (hour >= STOPS[i].h && hour <= STOPS[i + 1].h) {
        var t = (hour - STOPS[i].h) / (STOPS[i + 1].h - STOPS[i].h), a = STOPS[i], b = STOPS[i + 1];
        return { top: hex(a.top, b.top, t), bot: hex(a.bot, b.bot, t), glow: hex(a.glow, b.glow, t), star: lerp(a.star, b.star, t), beam: lerp(a.beam, b.beam, t) };
      }
    }
    return STOPS[0];
  }

  function setup(root) {
    var sky = root.querySelector('.lb-skyline'), stars = root.querySelector('.lb-stars');
    if (sky && !sky.childElementCount) {
      var html = '', n = 16;
      for (var i = 0; i < n; i++) { var w = 3 + Math.random() * 5, h = 10 + Math.random() * 30; html += '<b style="width:' + w + 'px;height:' + h + '%"></b>'; }
      sky.innerHTML = html;
    }
    if (stars && !stars.childElementCount) {
      var sh = '', m = 50;
      for (var j = 0; j < m; j++) { sh += '<i style="left:' + (Math.random() * 100) + '%;top:' + (Math.random() * 70) + '%;animation-delay:' + (Math.random() * 3.4) + 's"></i>'; }
      stars.innerHTML = sh;
    }
    function tick() {
      var d = new Date(), hour = d.getHours() + d.getMinutes() / 60, pal = paletteAt(hour), s = root.style;
      s.setProperty('--lb-top', pal.top); s.setProperty('--lb-bot', pal.bot); s.setProperty('--lb-glow', pal.glow);
      s.setProperty('--lb-star', pal.star); s.setProperty('--lb-beam', pal.beam);
    }
    tick(); setInterval(tick, 60000);
  }

  function init() { [].slice.call(document.querySelectorAll('.lb-root')).forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();