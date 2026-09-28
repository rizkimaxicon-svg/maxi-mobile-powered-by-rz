/**
 * Uji cepat backend MAXI MOBILE yang SUDAH DI-DEPLOY (bukan simulasi). Dijalankan dari komputer Anda
 * (Node.js 18+, punya fetch bawaan), BUKAN dari environment ini — di sini tidak ada akses ke script.google.com.
 *
 * Pakai akun uji sungguhan (mis. hasil createFirstAdmin), JANGAN akun produksi yang sedang dipakai orang lain,
 * karena skrip ini akan logout sesi di akhir.
 *
 * Cara pakai:
 *   node test/live-check.js <API_URL> <email> <password>
 * Contoh:
 *   node test/live-check.js https://script.google.com/macros/s/XXXX/exec admin@example.com PasswordSaya123
 */
const [API, EMAIL, PASSWORD] = process.argv.slice(2);
if (!API || !EMAIL || !PASSWORD) {
  console.error('Pemakaian: node test/live-check.js <API_URL> <email> <password>');
  process.exit(1);
}

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  OK   ', name); }
  else { fail++; console.log('  GAGAL', name, extra !== undefined ? JSON.stringify(extra) : ''); }
}

async function call(action, payload, token) {
  const started = Date.now();
  let res;
  try {
    res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, payload: payload || {} })
    });
  } catch (e) {
    return { success: false, code: 'NETWORK', message: e.message, ms: Date.now() - started };
  }
  const ms = Date.now() - started;
  let json;
  try { json = await res.json(); } catch (e) { return { success: false, code: 'BAD_RESPONSE', message: 'Respons bukan JSON valid (status HTTP ' + res.status + ').', ms }; }
  json.ms = ms;
  return json;
}

(async () => {
  console.log('Menguji: ' + API + '\n');

  let r = await call('system.ping', {});
  ok(r.success, 'system.ping (API hidup)', r);
  if (r.success) console.log('  → versi ' + r.data.version + ', waktu server ' + r.data.time + ', respons ' + r.ms + ' ms');

  r = await call('auth.login', { email: EMAIL, password: 'password-yang-pasti-salah-123' });
  ok(!r.success && r.code === 'INVALID_CREDENTIALS', 'login dengan password salah ditolak', r);

  r = await call('auth.login', { email: EMAIL, password: PASSWORD });
  ok(r.success, 'login dengan kredensial yang diberikan', r);
  if (!r.success) { report(); return; }
  const token = r.data.token;
  console.log('  → masuk sebagai ' + r.data.user.full_name + ' (' + r.data.user.role + '), must_change_password=' + r.data.must_change_password);
  if (r.data.must_change_password) console.log('  → PERHATIAN: akun ini masih memakai password sementara. Ganti dulu lewat aplikasi sebelum diuji lebih lanjut.');

  r = await call('auth.me', {}, token);
  ok(r.success, 'auth.me (validasi token)', r);

  if (!(await call('dashboard.get', {}, token)).success && r.data && !r.data.must_change_password) {
    ok(false, 'dashboard.get seharusnya berhasil untuk akun yang sudah aktif', r);
  } else {
    const d = await call('dashboard.get', {}, token);
    ok(d.success || d.code === 'PASSWORD_CHANGE_REQUIRED', 'dashboard.get', d);
  }

  r = await call('dashboard.get', {}, 'token-acak-tidak-valid-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  ok(!r.success && r.code === 'UNAUTHENTICATED', 'token acak ditolak', r);

  r = await call('tindakan.tidak.ada', {}, token);
  ok(!r.success && r.code === 'UNKNOWN_ACTION', 'action tak dikenal ditolak', r);

  r = await call('auth.logout', {}, token);
  ok(r.success, 'auth.logout', r);

  r = await call('dashboard.get', {}, token);
  ok(!r.success && r.code === 'UNAUTHENTICATED', 'token ditolak setelah logout', r);

  report();
})();

function report() {
  console.log('\nHASIL: ' + pass + ' lulus, ' + fail + ' gagal');
  process.exit(fail ? 1 : 0);
}
