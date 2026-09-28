/* MAXI MOBILE — inti frontend: helper DOM, API, sesi, dan kerangka halaman (sidebar + header). Data pengguna selalu ditampilkan lewat textContent (aman dari XSS). */
(function () {
  'use strict';
  var C = window.MAXI_CONFIG, M = window.Maxi = {}, KEY = 'maxi.session';

  /* Keamanan: jika halaman dipulihkan dari bfcache (mis. tombol Back setelah logout), muat ulang
     supaya pemeriksaan sesi (M.auth.require) berjalan lagi alih-alih menampilkan DOM lama dari memori. */
  window.addEventListener('pageshow', function (e) { if (e.persisted) location.reload(); });

  M.el = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  };
  var el = M.el, ICONS = {
    home: ['M3 11l9-8 9 8', 'M5 10v10h14V10'], clock: ['c12,12,9', 'M12 7v5l3 2'], calendar: ['M4 6h16v14H4z', 'M4 10h16M8 3v4M16 3v4'],
    file: ['M6 3h9l4 4v14H6z', 'M14 3v5h5'], zap: ['M13 2L4 14h7l-1 8 9-12h-7z'], activity: ['M3 12h4l3-8 4 16 3-8h4'],
    shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'], menu: ['M4 6h16M4 12h16M4 18h16'], sliders: ['M4 7h9M17 7h3M4 17h3M11 17h9', 'c15,7,2', 'c9,17,2'], users: ['c9,8,3', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M16 5.5a3 3 0 010 5M18 14.5c1.9.8 3 2.6 3 5.5'],
    out: ['M9 4H5v16h4', 'M16 8l4 4-4 4M20 12H9'], key: ['M6 11h12v9H6z', 'M8 11V8a4 4 0 018 0v3'],
    eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z', 'c12,12,3'], eyeoff: ['M3 3l18 18', 'M6.5 6.6C3.7 8.5 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M10.6 5.1A9.7 9.7 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.7']
  };
  M.icon = function (name) {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i'); s.setAttribute('aria-hidden', 'true');
    (ICONS[name] || []).forEach(function (d) {
      var p;
      if (d.charAt(0) === 'c') { var a = d.slice(1).split(','); p = document.createElementNS(ns, 'circle'); p.setAttribute('cx', a[0]); p.setAttribute('cy', a[1]); p.setAttribute('r', a[2]); }
      else { p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); }
      s.appendChild(p);
    });
    return s;
  };

  // ---- sesi: sessionStorage (default) atau localStorage bila "tetap masuk"
  M.auth = {
    get: function () {
      var raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY), s;
      try { s = raw && JSON.parse(raw); } catch (e) { s = null; }
      if (!s || !s.token || Date.parse(s.expires_at) <= Date.now()) { M.auth.clear(); return null; }
      return s;
    },
    save: function (s, remember) { M.auth.clear(); (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s)); },
    update: function (patch) {
      var st = sessionStorage.getItem(KEY) ? sessionStorage : localStorage, s = M.auth.get();
      if (s) st.setItem(KEY, JSON.stringify(Object.assign(s, patch)));
    },
    clear: function () { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); },
    require: function () {
      var s = M.auth.get();
      if (!s) { location.replace('login.html'); throw new Error('redirect'); }
      if (s.must_change_password && !/change-password/.test(location.pathname)) { location.replace('change-password.html'); throw new Error('redirect'); }
      return s;
    },
    logout: function () {
      M.api('auth.logout').catch(function () {}).then(function () { M.auth.clear(); location.replace('login.html'); });
    }
  };

  // ---- API (POST text/plain → tidak memicu preflight CORS di Apps Script)
  function fail(code, message) { var e = new Error(message); e.code = code; return e; }
  M.api = function (action, payload, opts) {
    opts = opts || {};
    if (window.MaxiMock && window.MaxiMock.active) {
      var ms = opts.public ? null : M.auth.get();
      return window.MaxiMock.handle(action, payload || {}, ms ? ms.token : null).catch(function (e) {
        if (!opts.public && (e.code === 'UNAUTHENTICATED' || e.code === 'SESSION_EXPIRED')) { M.auth.clear(); location.replace('login.html?reason=expired'); }
        if (!opts.public && e.code === 'PASSWORD_CHANGE_REQUIRED') location.replace('change-password.html');
        throw e;
      });
    }
    if (!C.API_URL) return Promise.reject(fail('CONFIG', 'API_URL belum diisi di assets/js/config.js.'));
    var s = opts.public ? null : M.auth.get(), ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, C.TIMEOUT_MS || 30000);
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, token: s ? s.token : undefined, payload: payload || {} }), signal: ctl.signal })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        throw e.name === 'AbortError' ? fail('TIMEOUT', 'Server terlalu lama merespons. Coba lagi.')
          : e instanceof SyntaxError ? fail('BAD_RESPONSE', 'Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".')
          : fail('NETWORK', 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      })
      .then(function (j) {
        clearTimeout(timer);
        if (j.success) return j.data;
        if (!opts.public && (j.code === 'UNAUTHENTICATED' || j.code === 'SESSION_EXPIRED')) { M.auth.clear(); location.replace('login.html?reason=expired'); }
        if (!opts.public && j.code === 'PASSWORD_CHANGE_REQUIRED') location.replace('change-password.html');
        throw fail(j.code, j.message);
      });
  };

  // ---- format
  M.fmt = {
    num: function (n) { return Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 }); },
    date: function (iso) { var p = String(iso).split('-'); return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); },
    long: function (iso) { var p = iso.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); },
    ago: function (ts) {
      var t = Date.parse(ts), m = Math.round((Date.now() - t) / 60000);
      if (isNaN(t)) return '';
      if (m < 1) return 'Baru saja'; if (m < 60) return m + ' menit lalu'; if (m < 1440) return Math.floor(m / 60) + ' jam lalu';
      return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  // ---- kerangka halaman: sidebar (desktop) / drawer (mobile) + header. Mengembalikan elemen <main>.
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', href: 'dashboard.html' }, { id: 'attendance', label: 'Presensi', icon: 'clock', href: 'attendance.html' },
    { id: 'leave', label: 'Cuti', icon: 'calendar', href: 'leave.html' }, { id: 'permission', label: 'Izin', icon: 'file', href: 'permission.html' },
    { id: 'overtime', label: 'Lembur', icon: 'zap', href: 'overtime.html' }, { id: 'activity', label: 'Aktivitas', icon: 'activity', href: 'activity.html' }
  ], MGMT = [{ id: 'approval', label: 'Approval', icon: 'shield', href: 'approval.html' }, { id: 'team', label: 'Presensi tim', icon: 'clock', href: 'team.html' }, { id: 'employees', label: 'Karyawan', icon: 'users', href: 'employees.html', admin: true }, { id: 'holidays', label: 'Hari libur', icon: 'calendar', href: 'holidays.html', admin: true }, { id: 'settings', label: 'Pengaturan', icon: 'sliders', href: 'settings.html', admin: true }];
  M.ready = function (id) { return id === 'dashboard' || (C.FEATURES && C.FEATURES[id] === true); };
  M.navItem = function (n, active) {
    if (!M.ready(n.id)) return el('span', { class: 'nav soon', 'aria-disabled': 'true' }, [M.icon(n.icon), n.label, el('em', { text: 'Segera' })]);
    return el('a', { class: 'nav' + (n.id === active ? ' on' : ''), href: n.href, 'aria-current': n.id === active ? 'page' : null }, [M.icon(n.icon), n.label]);
  };
  M.shell = function (active, title, user) {
    var app = document.getElementById('app'), isMgr = user.role === 'Manager' || user.role === 'Admin';
    var scrim = el('div', { class: 'scrim', hidden: true }), side, content = el('main', { class: 'content', id: 'main' });
    function toggle(open) { side.classList.toggle('open', open); scrim.hidden = !open; }
    side = el('aside', { class: 'side', 'aria-label': 'Navigasi utama' }, [
      el('img', { class: 'logo', src: '../assets/img/logo.png', alt: 'MAXICON' }),
      el('nav', {}, [el('div', { class: 'grp', text: 'Menu' })].concat(NAV.map(function (n) { return M.navItem(n, active); }),
        isMgr ? [el('div', { class: 'grp', text: 'Management' })].concat(MGMT.filter(function (n) { return !n.admin || user.role === 'Admin'; }).map(function (n) { return M.navItem(n, active); })) : [],
        [el('div', { class: 'grp', text: 'Client Portal' }), el('span', { class: 'nav soon', 'aria-disabled': 'true' }, [M.icon('key'), 'Client', el('em', { text: 'Segera' })])])),
      el('div', { class: 'me' }, [
        el('div', { class: 'who' }, [el('div', { class: 'av', text: (user.full_name || '?').charAt(0).toUpperCase() }), el('div', {}, [el('b', { text: user.full_name }), el('small', { text: user.role === 'Admin' ? 'Admin/HR' : user.role })])]),
        el('a', { class: 'nav', href: 'change-password.html' }, [M.icon('key'), 'Ganti password']),
        el('button', { class: 'nav', type: 'button', onclick: M.auth.logout }, [M.icon('out'), 'Keluar'])])
    ]);
    scrim.addEventListener('click', function () { toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
    var top = el('header', { class: 'top' }, [
      el('button', { class: 'burger', type: 'button', 'aria-label': 'Buka menu', onclick: function () { toggle(true); } }, [M.icon('menu')]),
      el('img', { class: 'logo', src: '../assets/img/logo.png', alt: 'MAXICON' }), el('h1', { text: title }), (window.MaxiMock && window.MaxiMock.active) ? el('span', { class: 'tag', text: 'Mode demo' }) : null, el('span', { class: 'date', id: 'today', text: '' })]);
    app.replaceChildren(el('a', { class: 'skip', href: '#main', text: 'Lewati ke konten' }), side, scrim, el('div', { class: 'wrap' }, [top, content]));
    M.setToday = function (iso) { document.getElementById('today').textContent = M.fmt.long(iso || new Date().toLocaleDateString('sv-SE')); };
    M.setToday();
    return content;
  };
})();
