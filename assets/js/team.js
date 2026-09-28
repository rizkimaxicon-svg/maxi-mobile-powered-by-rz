(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require(), isAdmin = s.user.role === 'Admin';
  if (s.user.role === 'Employee') { location.replace('dashboard.html'); return; }
  var content = M.shell('team', 'Presensi tim', s.user), LBL = { Present: 'Tepat waktu', Late: 'Terlambat', Absent: 'Tidak hadir' }, today = new Date().toLocaleDateString('sv-SE');
  var box = el('div', { class: 'alert info', role: 'status', hidden: true }), list = el('div', {});
  var from = el('input', { type: 'date', value: today, 'aria-label': 'Dari tanggal' }), to = el('input', { type: 'date', value: today, 'aria-label': 'Sampai tanggal' });
  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; }

  function load() {
    list.replaceChildren(el('div', { class: 'skel' }));
    M.api('attendance.team', { date_from: from.value, date_to: to.value }).then(function (d) {
      list.replaceChildren(d.items.length ? el('ul', { class: 'feed' }, d.items.map(function (r) {
        return el('li', { class: 'hrow' }, [el('b', { text: r.employee_name }), el('span', { text: f.date(r.date) + ', ' + r.clock_in.slice(0, 5) + ' – ' + (r.clock_out ? r.clock_out.slice(0, 5) : 'belum Clock Out') }), el('span', { class: 'badge ' + r.status, text: LBL[r.status] || r.status })]);
      })) : el('p', { class: 'muted', text: 'Tidak ada data presensi pada rentang ini.' }));
    }).catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message })); });
  }
  var kids = [box, el('section', { class: 'card' }, [el('div', { class: 'hh' }, [el('h3', { text: 'Presensi ' + (isAdmin ? 'semua karyawan' : 'bawahan') }), el('div', { class: 'bar' }, [from, to, el('button', { class: 'btn sm', type: 'button', text: 'Tampilkan', onclick: load })])]), list])];

  if (isAdmin) {
    var who = el('select', { id: 'c_e' }), d = el('input', { id: 'c_d', type: 'date', value: today }), ci = el('input', { id: 'c_i', type: 'time' }), co = el('input', { id: 'c_o', type: 'time' });
    var st = el('select', { id: 'c_s' }, [['', 'Tidak diubah'], ['Present', 'Tepat waktu'], ['Late', 'Terlambat'], ['Absent', 'Tidak hadir']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
    var why = el('input', { id: 'c_w', type: 'text', maxlength: 200 }), go = el('button', { class: 'btn block', type: 'submit', text: 'Simpan koreksi' });
    function g(id, l, i, full) { return el('div', { class: full ? 'full' : '' }, [el('label', { for: id, text: l }), i]); }
    M.api('admin.employees.list', { status: 'Active' }).then(function (r) { r.items.forEach(function (e) { who.appendChild(el('option', { value: e.employee_id, text: e.full_name + ' (' + e.employee_id + ')' })); }); });
    kids.push(el('section', { class: 'card' }, [el('h3', { text: 'Koreksi presensi' }), el('p', { class: 'muted', text: 'Untuk lupa Clock Out atau presensi yang belum tercatat. Alasan wajib dan tercatat di aktivitas karyawan.' }),
      el('form', { class: 'fgrid', novalidate: true, onsubmit: function (e) {
        e.preventDefault(); var p = { employee_id: who.value, date: d.value, reason: why.value.trim() };
        if (ci.value) p.clock_in = ci.value; if (co.value) p.clock_out = co.value; if (st.value) p.status = st.value;
        if (!p.date || p.reason.length < 3) return show('Tanggal dan alasan (minimal 3 karakter) wajib diisi.', true);
        go.disabled = true;
        M.api('admin.attendance.update', p).then(function () { show('Presensi dikoreksi.'); why.value = ''; load(); }).catch(function (err) { show(err.message, true); }).then(function () { go.disabled = false; });
      } }, [g('c_e', 'Karyawan', who, 1), g('c_d', 'Tanggal', d), g('c_s', 'Status', st), g('c_i', 'Jam masuk', ci), g('c_o', 'Jam pulang', co), g('c_w', 'Alasan koreksi', why, 1), el('div', { class: 'full' }, [go])])]));
  }
  content.replaceChildren.apply(content, kids); load();
})();
