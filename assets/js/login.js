(function () {
  'use strict';
  var M = Maxi, f = document.getElementById('form'), box = document.getElementById('alert'), btn = document.getElementById('go');
  if (M.auth.get()) { location.replace('dashboard.html'); return; }
  function show(msg, info) { box.textContent = msg; box.className = 'alert' + (info ? ' info' : ''); box.hidden = false; }
  if (/reason=expired/.test(location.search)) show('Sesi Anda berakhir. Silakan masuk kembali.', true);
  if (window.MaxiMock && window.MaxiMock.active) {
    var dm = document.getElementById('demo');
    dm.textContent = 'Mode demo. Password semua akun: Demo12345. Employee: demo.andi@example.com. Manager: demo.dewi@example.com. Admin/HR: demo.citra@example.com. Login pertama (wajib ganti password): demo.eko@example.com, password Sementara123.';
    dm.hidden = false;
  }
  var pw = document.getElementById('password'), eye = document.getElementById('eye');
  eye.appendChild(M.icon('eye'));
  eye.addEventListener('click', function () {
    var on = pw.type === 'password'; pw.type = on ? 'text' : 'password';
    eye.replaceChildren(M.icon(on ? 'eyeoff' : 'eye')); eye.setAttribute('aria-label', on ? 'Sembunyikan password' : 'Tampilkan password');
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault(); box.hidden = true;
    var email = f.email.value.trim(), password = pw.value;
    if (!email || !password) return show('Email dan password wajib diisi.');
    btn.disabled = true; btn.textContent = 'Memproses…';
    M.api('auth.login', { email: email, password: password }, { public: true }).then(function (d) {
      M.auth.save({ token: d.token, expires_at: d.expires_at, user: d.user, must_change_password: d.must_change_password }, f.remember.checked);
      location.replace(d.must_change_password ? 'change-password.html' : 'dashboard.html');
    }).catch(function (err) {
      show(err.message); btn.disabled = false; btn.textContent = 'Masuk'; pw.value = ''; pw.focus();
    });
  });
})();
