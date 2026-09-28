/* MODE DEMO: API tiruan di browser (data di localStorage, tidak menyentuh server). Aktif hanya jika USE_MOCK = true DAN API_URL kosong. */
(function () {
  'use strict';
  var C = window.MAXI_CONFIG || {}, KEY = 'maxi.mockdb', db;
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function add(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); }
  function dow(s) { return new Date(s + 'T12:00:00').getDay(); }
  function hrs(s) { var w = dow(s); return w === 0 ? null : w === 6 ? ['09:00', '13:00'] : ['09:00', '17:00']; }
  function err(c, m) { var e = new Error(m); e.code = c; return e; }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join(''); }
  function days(a, b) { var n = 0; for (var d = a; d <= b; d = add(d, 1)) if (hrs(d)) n++; return n; }
  function tmp() { return 'Tmp' + rnd(4).toUpperCase() + '7'; }

  function seed() {
    var t = ymd(new Date()), now = new Date().toISOString();
    function E(id, n, dep, pos, role, sup, bal) { return { employee_id: id, full_name: n, email: 'demo.' + n.split(' ')[0].toLowerCase() + '@example.com', phone: '', department: dep, position: pos, supervisor_id: sup, join_date: '2024-03-01', leave_balance: bal, role: role, status: 'Active' }; }
    var d = { emps: [E('DEMO003', 'Citra (Demo)', 'HR', 'Manager', 'Admin', '', 12), E('DEMO004', 'Dewi (Demo)', 'Operations', 'Manager', 'Manager', 'DEMO003', 12), E('DEMO001', 'Andi (Demo)', 'Finance', 'Staff', 'Employee', 'DEMO004', 12),
      E('DEMO002', 'Budi (Demo)', 'Project', 'Staff', 'Employee', 'DEMO004', 10), E('DEMO005', 'Eko (Demo)', 'Finance', 'Staff', 'Employee', 'DEMO004', 12)],
      users: { 'demo.eko@example.com': { pw: 'Sementara123', must: true, ref: 'DEMO005' } }, sess: {}, att: [], log: [], seq: 10, req: { leave: [], permission: [], overtime: [] } };
    ['citra', 'dewi', 'andi', 'budi'].forEach(function (n) { d.users['demo.' + n + '@example.com'] = { pw: 'Demo12345', must: false, ref: { citra: 'DEMO003', dewi: 'DEMO004', andi: 'DEMO001', budi: 'DEMO002' }[n] }; });
    var y = add(t, -1);
    d.att.push({ attendance_id: 'A1', employee_id: 'DEMO001', date: y, clock_in: '08:55:10', clock_out: '17:02:00', status: 'Present' }, { attendance_id: 'A2', employee_id: 'DEMO002', date: y, clock_in: '09:22:41', clock_out: '17:30:00', status: 'Late' });
    d.req.leave.push({ id: 'LV-2026-0001', employee_id: 'DEMO001', leave_type: 'Cuti Tahunan', start_date: add(t, 14), end_date: add(t, 16), total_days: 3, reason: 'Keperluan keluarga', status: 'Pending', approver_id: '', approver_note: '', created_at: now });
    d.req.permission.push({ id: 'PRM-2026-0001', employee_id: 'DEMO001', permission_type: 'Izin Pribadi', start_date: add(t, -3), end_date: add(t, -3), start_time: '', end_time: '', reason: 'Urusan administrasi', status: 'Approved', approver_id: 'DEMO004', approver_note: '', created_at: add(t, -4) + 'T08:00:00Z' });
    d.req.overtime.push({ id: 'OT-2026-0001', employee_id: 'DEMO002', date: add(t, -1), start_time: '17:30', end_time: '20:00', total_hours: 2.5, reason: 'Penyelesaian laporan proyek', status: 'Pending', approver_id: '', approver_note: '', created_at: now });
    d.log.push({ employee_id: 'DEMO001', description: 'Mengajukan Cuti Tahunan (3 hari)', timestamp: now });
    return d;
  }
  function load() { if (!db) { try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; } if (!db) db = seed(); } return db; }
  function log(id, txt) { db.log.push({ employee_id: id, description: txt, timestamp: new Date().toISOString() }); }
  function emp(id) { return db.emps.filter(function (e) { return e.employee_id === id; })[0]; }
  function prof(e) { var s = e.supervisor_id && emp(e.supervisor_id); return Object.assign({}, e, { supervisor_name: s ? s.full_name : '' }); }
  function pub(k, r) { return Object.assign({ type: k }, r); }
  function now() { var d = new Date(); return { date: ymd(d), time: p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()) }; }
  function toM(t) { return +t.slice(0, 2) * 60 + +t.slice(3, 5); }

  function att(e) {
    var n = now(), h = hrs(n.date), r = db.att.filter(function (a) { return a.employee_id === e.employee_id && a.date === n.date; })[0] || null;
    return { date: n.date, server_time: n.time, schedule: { start: h ? h[0] : null, end: h ? h[1] : null, off: !h, holiday: null }, record: r, can_clock_in: !r && !!h, can_clock_out: !!(r && !r.clock_out),
      message: r ? 'Anda sudah Clock In hari ini.' : !h ? 'Hari ini bukan hari kerja.' : '' };
  }
  function mine(k, e) { return db.req[k].filter(function (r) { return r.employee_id === e.employee_id; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }); }
  function pend(e) { return mine('leave', e).filter(function (r) { return r.status === 'Pending'; }).reduce(function (s, r) { return s + r.total_days; }, 0); }
  function scope(e) { return db.emps.filter(function (x) { return e.role === 'Admin' || x.supervisor_id === e.employee_id; }).map(function (x) { return x.employee_id; }); }
  function queue(e, st) {
    var ids = scope(e), out = [];
    ['leave', 'permission', 'overtime'].forEach(function (k) { db.req[k].forEach(function (r) { if (ids.indexOf(r.employee_id) >= 0 && (st === 'All' || r.status === st)) { var x = emp(r.employee_id); out.push(Object.assign(pub(k, r), { employee_name: x.full_name, department: x.department, can_decide: r.status === 'Pending' && r.employee_id !== e.employee_id })); } }); });
    return out.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
  }
  function submit(k, e, p) {
    var r = { id: { leave: 'LV', permission: 'PRM', overtime: 'OT' }[k] + '-2026-' + String(++db.seq).padStart(4, '0'), employee_id: e.employee_id, reason: (p.reason || '').trim(), status: 'Pending', approver_id: '', approver_note: '', created_at: new Date().toISOString() };
    if (!r.reason) throw err('VALIDATION', 'Alasan wajib diisi.');
    if (k === 'overtime') { if (!p.date || !p.start_time || !p.end_time || p.end_time <= p.start_time) throw err('VALIDATION', 'Tanggal dan jam lembur tidak valid.'); Object.assign(r, { date: p.date, start_time: p.start_time, end_time: p.end_time, total_hours: (toM(p.end_time) - toM(p.start_time)) / 60 }); }
    else {
      if (!p.start_date) throw err('VALIDATION', 'Tanggal mulai wajib diisi.');
      r.start_date = p.start_date; r.end_date = p.end_date || p.start_date; if (r.end_date < r.start_date) throw err('VALIDATION', 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
      if (k === 'leave') { r.leave_type = p.leave_type; r.total_days = days(r.start_date, r.end_date); if (!r.total_days) throw err('VALIDATION', 'Rentang tanggal tidak mengandung hari kerja.'); if (r.total_days + pend(e) > e.leave_balance) throw err('INSUFFICIENT_BALANCE', 'Saldo cuti tidak cukup.'); }
      else { r.permission_type = p.permission_type; r.start_time = p.start_time || ''; r.end_time = p.end_time || ''; }
    }
    db.req[k].push(r); log(e.employee_id, 'Mengajukan ' + { leave: 'cuti', permission: 'izin', overtime: 'lembur' }[k]); return { request: pub(k, r) };
  }
  function list(k, e, p) {
    var all = mine(k, e), o = +p.offset || 0, l = +p.limit || 20, out = { items: all.slice(o, o + l).map(function (r) { return pub(k, r); }), has_more: all.length > o + l };
    if (k === 'leave') Object.assign(out, { balance: e.leave_balance, pending_days: pend(e), available: e.leave_balance - pend(e), types: ['Cuti Tahunan', 'Cuti Khusus'] });
    if (k === 'permission') out.types = ['Izin Pribadi', 'Izin Sakit', 'Izin Keperluan Keluarga', 'Izin Dinas', 'Izin Lainnya'];
    return out;
  }

  var H = {
    'dashboard.get': function (e) {
      var m = now().date.slice(0, 7), a = att(e), all = [];
      ['leave', 'permission', 'overtime'].forEach(function (k) { mine(k, e).forEach(function (r) { all.push(pub(k, r)); }); });
      all.sort(function (x, y) { return x.created_at < y.created_at ? 1 : -1; });
      var d = { profile: prof(e), attendance: a, last_request: all[0] || null,
        stats: { leave_balance: e.leave_balance, permission_this_month: mine('permission', e).filter(function (r) { return r.status === 'Approved' && r.start_date.slice(0, 7) === m; }).length, overtime_hours_this_month: mine('overtime', e).filter(function (r) { return r.status === 'Approved' && r.date.slice(0, 7) === m; }).reduce(function (s, r) { return s + r.total_hours; }, 0) },
        recent_activity: db.log.filter(function (l) { return l.employee_id === e.employee_id; }).reverse().slice(0, 5) };
      if (e.role !== 'Employee') d.pending_approvals = queue(e, 'Pending').filter(function (i) { return i.can_decide; }).length;
      return d;
    },
    'attendance.today': att,
    'attendance.clockIn': function (e) {
      var a = att(e); if (a.record) throw err('ALREADY_CLOCKED_IN', a.message); if (!a.can_clock_in) throw err('NOT_WORKING_DAY', a.message);
      var late = toM(a.server_time) > toM(a.schedule.start) + 10, r = { attendance_id: 'A' + rnd(3), employee_id: e.employee_id, date: a.date, clock_in: a.server_time, clock_out: '', status: late ? 'Late' : 'Present' };
      db.att.push(r); log(e.employee_id, 'Clock In pukul ' + r.clock_in.slice(0, 5)); return { record: r, status: r.status };
    },
    'attendance.clockOut': function (e) {
      var a = att(e); if (!a.record) throw err('NO_CLOCK_IN', 'Anda belum Clock In hari ini.'); if (a.record.clock_out) throw err('ALREADY_CLOCKED_OUT', 'Anda sudah Clock Out hari ini.');
      a.record.clock_out = now().time; log(e.employee_id, 'Clock Out pukul ' + a.record.clock_out.slice(0, 5)); return { record: a.record };
    },
    'attendance.history': function (e, p) {
      var m = p.month || now().date.slice(0, 7), it = db.att.filter(function (a) { return a.employee_id === e.employee_id && a.date.slice(0, 7) === m; }).sort(function (x, y) { return x.date < y.date ? 1 : -1; });
      return { month: m, items: it, summary: { present: it.filter(function (r) { return r.status === 'Present'; }).length, late: it.filter(function (r) { return r.status === 'Late'; }).length, absent: 0 } };
    },
    'approval.list': function (e, p) { if (e.role === 'Employee') throw err('FORBIDDEN', 'Anda tidak memiliki akses ke fitur ini.'); var i = queue(e, p.status || 'Pending'); return { items: i, total: i.length }; },
    'approval.decide': function (e, p) {
      if (e.role === 'Employee') throw err('FORBIDDEN', 'Anda tidak memiliki akses ke fitur ini.');
      var r = db.req[p.type].filter(function (x) { return x.id === p.id; })[0]; if (!r) throw err('NOT_FOUND', 'Pengajuan tidak ditemukan.');
      if (r.status !== 'Pending') throw err('ALREADY_DECIDED', 'Pengajuan ini sudah berstatus ' + r.status + '.');
      if (r.employee_id === e.employee_id) throw err('FORBIDDEN', 'Anda tidak dapat memproses pengajuan Anda sendiri.');
      if (scope(e).indexOf(r.employee_id) < 0) throw err('FORBIDDEN', 'Pengajuan ini bukan dari bawahan langsung Anda.');
      if (p.decision === 'Rejected' && (p.note || '').trim().length < 3) throw err('VALIDATION', 'Catatan penolakan wajib diisi.');
      var x = emp(r.employee_id); if (p.type === 'leave' && p.decision === 'Approved') { if (x.leave_balance < r.total_days) throw err('INSUFFICIENT_BALANCE', 'Saldo cuti tidak cukup.'); x.leave_balance -= r.total_days; }
      r.status = p.decision; r.approver_id = e.employee_id; r.approver_note = p.note || ''; log(r.employee_id, 'Pengajuan ' + r.id + (p.decision === 'Approved' ? ' disetujui' : ' ditolak') + ' oleh ' + e.full_name); return { request: pub(p.type, r) };
    },
    'admin.employees.list': function (e) { adm(e); return { items: db.emps.map(prof) }; },
    'admin.employees.create': function (e, p) {
      adm(e); if (!p.full_name || !p.email) throw err('VALIDATION', 'Nama dan email wajib diisi.'); if (db.users[p.email.toLowerCase()]) throw err('DUPLICATE', 'Email sudah terdaftar.');
      var id = 'EMP' + String(++db.seq).padStart(3, '0'), n = Object.assign({ phone: '', supervisor_id: '', role: 'Employee', status: 'Active', leave_balance: 12 }, p, { employee_id: id, email: p.email.toLowerCase(), leave_balance: p.leave_balance === undefined ? 12 : +p.leave_balance });
      var pw = tmp(); db.emps.push(n); db.users[n.email] = { pw: pw, must: true, ref: id }; return { employee: prof(n), temporary_password: pw };
    },
    'admin.employees.update': function (e, p) {
      adm(e); var x = emp(p.employee_id); if (!x) throw err('NOT_FOUND', 'Karyawan tidak ditemukan.');
      ['full_name', 'phone', 'department', 'position', 'join_date', 'role', 'supervisor_id', 'status'].forEach(function (k) { if (p[k] !== undefined) x[k] = p[k]; }); return { employee: prof(x), changed: [] };
    },
    'admin.leave.adjustBalance': function (e, p) {
      adm(e); var x = emp(p.employee_id), o = x.leave_balance, n = p.mode === 'set' ? +p.amount : o + +p.amount; if (!(p.reason || '').trim()) throw err('VALIDATION', 'Alasan wajib diisi.'); if (isNaN(n) || n < 0) throw err('VALIDATION', 'Saldo hasil perubahan tidak valid.');
      x.leave_balance = n; log(x.employee_id, 'Saldo cuti diubah Admin/HR: ' + o + ' → ' + n); return { employee_id: x.employee_id, old_balance: o, new_balance: n };
    },
    'admin.users.resetPassword': function (e, p) { adm(e); var x = emp(p.employee_id), pw = tmp(); db.users[x.email] = { pw: pw, must: true, ref: x.employee_id }; return { employee_id: x.employee_id, temporary_password: pw }; }
  };
  var SET = [['late_tolerance_minutes', '10', 'Number', 'Toleransi keterlambatan (menit)'], ['work_hours_mon', '09:00-17:00', 'Text', 'Jam kerja Senin'], ['work_hours_sat', '09:00-13:00', 'Text', 'Jam kerja Sabtu'], ['work_hours_sun', 'OFF', 'Text', 'Jam kerja Minggu (OFF = libur)'],
    ['leave_annual_entitlement', '12', 'Number', 'Jatah cuti tahunan (hari)'], ['leave_carry_over_enabled', 'FALSE', 'Boolean', 'Sisa cuti boleh dibawa ke tahun berikutnya'], ['leave_carry_over_max_days', '0', 'Number', 'Batas maksimal hari cuti yang dibawa'],
    ['leave_last_reset_year', '', 'Text', 'Tahun terakhir pergantian tahun cuti (diisi sistem)'], ['leave_types', 'Cuti Tahunan,Cuti Khusus', 'List', 'Daftar jenis cuti'], ['session_duration_hours', '12', 'Number', 'Lama sesi login (jam)']];
  function cfg(e, k) { db.set = db.set || SET.map(function (r) { return { setting_key: r[0], setting_value: r[1], value_type: r[2], description: r[3] }; }); return db.set.filter(function (r) { return r.setting_key === k; })[0]; }
  H['activity.list'] = function (e, p) {
    var all = db.log.filter(function (l) { return l.employee_id === e.employee_id; }).reverse(), o = +p.offset || 0, l = +p.limit || 20;
    return { items: all.slice(o, o + l), has_more: all.length > o + l };
  };
  H['holidays.list'] = function (e, p) { db.hol = db.hol || []; return { items: db.hol.filter(function (h) { return (!p.year || h.date.slice(0, 4) === String(p.year)) && (e.role === 'Admin' || h.status === 'Active'); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }) }; };
  H['admin.holidays.upsert'] = function (e, p) {
    adm(e); db.hol = db.hol || []; if (!p.date || !(p.holiday_name || '').trim()) throw err('VALIDATION', 'Tanggal dan nama wajib diisi.');
    if (db.hol.some(function (h) { return h.date === p.date && h.status === 'Active' && h.holiday_id !== p.holiday_id && p.status !== 'Inactive'; })) throw err('DUPLICATE', 'Sudah ada hari libur aktif pada tanggal ' + p.date + '.');
    var h = db.hol.filter(function (x) { return x.holiday_id === p.holiday_id; })[0]; if (!h) { h = { holiday_id: 'HOL-' + String(++db.seq).padStart(4, '0') }; db.hol.push(h); }
    Object.assign(h, { date: p.date, holiday_name: p.holiday_name.trim(), type: p.type || 'National', status: p.status || 'Active' }); return { holiday: h };
  };
  H['admin.settings.list'] = function (e) { adm(e); cfg(e, 'x'); return { items: db.set }; };
  H['admin.settings.update'] = function (e, p) { adm(e); var r = cfg(e, p.key); if (!r || p.key === 'leave_last_reset_year') throw err('VALIDATION', 'Pengaturan tidak dikenal atau tidak dapat diubah.'); if (r.value_type === 'Number' && isNaN(+p.value)) throw err('VALIDATION', p.key + ' harus berupa angka.'); r.setting_value = String(p.value); return { key: p.key, value: r.setting_value }; };
  H['admin.leave.yearEnd'] = function (e, p) {
    adm(e); var ent = +cfg(e, 'leave_annual_entitlement').setting_value, on = cfg(e, 'leave_carry_over_enabled').setting_value === 'TRUE', mx = +cfg(e, 'leave_carry_over_max_days').setting_value, r = cfg(e, 'leave_last_reset_year');
    if (r.setting_value === String(p.target_year)) throw err('ALREADY_PROCESSED', 'Pergantian tahun ' + p.target_year + ' sudah pernah dijalankan.');
    var items = db.emps.filter(function (x) { return x.status === 'Active'; }).map(function (x) { var c = on ? Math.min(Math.max(x.leave_balance, 0), mx) : 0; return { employee_id: x.employee_id, full_name: x.full_name, old_balance: x.leave_balance, carried: c, new_balance: ent + c }; });
    if (p.apply === true) { items.forEach(function (i) { emp(i.employee_id).leave_balance = i.new_balance; }); r.setting_value = String(p.target_year); }
    return { applied: p.apply === true, target_year: +p.target_year, policy: { entitlement: ent, carry_over_enabled: on, carry_over_max_days: mx }, items: items };
  };
  H['attendance.team'] = function (e, p) {
    if (e.role === 'Employee') throw err('FORBIDDEN', 'Anda tidak memiliki akses ke fitur ini.'); var ids = scope(e), n = now().date, a = p.date_from || n, b = p.date_to || a;
    return { date_from: a, date_to: b, items: db.att.filter(function (r) { return ids.indexOf(r.employee_id) >= 0 && r.date >= a && r.date <= b; }).sort(function (x, y) { return x.date < y.date ? 1 : -1; }).map(function (r) { return Object.assign({ employee_name: emp(r.employee_id).full_name }, r); }) };
  };
  H['admin.attendance.update'] = function (e, p) {
    adm(e); if (!emp(p.employee_id)) throw err('NOT_FOUND', 'Karyawan tidak ditemukan.'); if ((p.reason || '').trim().length < 3) throw err('VALIDATION', 'Alasan koreksi wajib diisi.');
    var r = db.att.filter(function (a) { return a.employee_id === p.employee_id && a.date === p.date; })[0];
    if (!r) { if (!p.clock_in) throw err('VALIDATION', 'clock_in wajib diisi untuk membuat presensi baru.'); r = { attendance_id: 'A' + rnd(3), employee_id: p.employee_id, date: p.date, clock_in: '', clock_out: '', status: 'Present' }; db.att.push(r); }
    if (p.clock_in) r.clock_in = p.clock_in + ':00'; if (p.clock_out) r.clock_out = p.clock_out + ':00'; if (p.status) r.status = p.status;
    log(p.employee_id, 'Presensi ' + p.date + ' dikoreksi Admin/HR. Alasan: ' + p.reason); return { record: r };
  };
  function adm(e) { if (e.role !== 'Admin') throw err('FORBIDDEN', 'Anda tidak memiliki akses ke fitur ini.'); }
  ['leave', 'permission', 'overtime'].forEach(function (k) { H[k + '.list'] = function (e, p) { return list(k, e, p); }; H[k + '.submit'] = function (e, p) { return submit(k, e, p); }; });

  function run(action, p, token) {
    load();
    if (action === 'auth.login') {
      var u = db.users[String(p.email || '').trim().toLowerCase()];
      if (!u || u.pw !== p.password) throw err('INVALID_CREDENTIALS', 'Email atau password salah.');
      var t = rnd(32); db.sess[t] = u.ref; return { token: t, expires_at: new Date(Date.now() + 12 * 3600000).toISOString(), must_change_password: u.must, user: prof(emp(u.ref)) };
    }
    var e = db.sess[token] && emp(db.sess[token]); if (!e) throw err('UNAUTHENTICATED', 'Sesi tidak valid. Silakan login kembali.');
    var us = db.users[e.email];
    if (action === 'auth.logout') { delete db.sess[token]; return { logged_out: true }; }
    if (action === 'auth.changePassword') {
      if (us.pw !== p.current_password) throw err('INVALID_CREDENTIALS', 'Password saat ini salah.');
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(p.new_password || '')) throw err('WEAK_PASSWORD', 'Password minimal 8 karakter dan mengandung huruf dan angka.');
      us.pw = p.new_password; us.must = false; return { changed: true };
    }
    if (us.must) throw err('PASSWORD_CHANGE_REQUIRED', 'Anda harus mengganti password terlebih dahulu.');
    if (!H[action]) throw err('UNKNOWN_ACTION', 'Action tidak dikenal.');
    return H[action](e, p);
  }
  window.MaxiMock = {
    active: !!C.USE_MOCK && !C.API_URL,
    handle: function (action, payload, token) {
      return new Promise(function (ok, no) { setTimeout(function () { try { var r = run(action, payload, token); localStorage.setItem(KEY, JSON.stringify(db)); ok(JSON.parse(JSON.stringify(r))); } catch (x) { no(x); } }, 220); });
    },
    reset: function () { localStorage.removeItem(KEY); location.reload(); }
  };
})();
