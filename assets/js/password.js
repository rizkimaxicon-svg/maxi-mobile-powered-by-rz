(function () {
  'use strict';
  var M = Maxi, s = M.auth.require(), f = document.getElementById('form'), box = document.getElementById('alert'), btn = document.getElementById('go');
  if (!s.must_change_password) document.getElementById('back').hidden = false;
  else document.getElementById('intro').textContent = 'Demi keamanan, ganti password sementara Anda sebelum melanjutkan.';
  function show(msg) { box.textContent = msg; box.hidden = false; }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); box.hidden = true;
    var cur = f.current.value, nw = f.next.value;
    if (nw.length < 8 || !/[A-Za-z]/.test(nw) || !/\d/.test(nw)) return show('Password baru minimal 8 karakter dan mengandung huruf dan angka.');
    if (nw !== f.confirm.value) return show('Konfirmasi password tidak sama.');
    btn.disabled = true; btn.textContent = 'Menyimpan…';
    M.api('auth.changePassword', { current_password: cur, new_password: nw }).then(function () {
      M.auth.update({ must_change_password: false }); location.replace('dashboard.html');
    }).catch(function (err) { show(err.message); btn.disabled = false; btn.textContent = 'Simpan password'; });
  });
})();
