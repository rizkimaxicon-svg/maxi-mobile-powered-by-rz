(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require();
  if (s.user.role !== 'Admin') { location.replace('dashboard.html'); return; }
  var content = M.shell('employees', 'Karyawan', s.user), emps = [], editing = null;
  var box = el('div', { class: 'alert info', role: 'status', hidden: true }), panel = el('section', { class: 'card', hidden: true }), list = el('div', {});
  var q = el('input', { type: 'text', placeholder: 'Cari nama atau ID', 'aria-label': 'Cari karyawan', oninput: renderList });

  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; window.scrollTo(0, 0); }
  function opt(v, t) { return el('option', { value: v, text: t || v }); }
  function group(id, label, input, full) { return el('div', { class: full ? 'full' : '' }, [el('label', { for: id, text: label }), input]); }

  function openForm(e) {
    editing = e; var v = e || {}, F = {};
    function inp(name, type, val) { return (F[name] = el('input', { id: 'e_' + name, type: type, value: val == null ? '' : val, required: null })); }
    function pick(name, opts, val) { var sl = el('select', { id: 'e_' + name }, opts); sl.value = val == null ? '' : val; return (F[name] = sl); }
    var sups = [opt('', 'Tidak ada')].concat(emps.filter(function (x) { return x.status === 'Active' && (!e || x.employee_id !== e.employee_id); }).map(function (x) { return opt(x.employee_id, x.full_name + ' (' + x.employee_id + ')'); }));
    var fields = [group('e_full_name', 'Nama lengkap', inp('full_name', 'text', v.full_name)), group('e_email', 'Email', inp('email', 'email', v.email)),
      group('e_phone', 'Telepon (opsional)', inp('phone', 'text', v.phone)), group('e_department', 'Department', inp('department', 'text', v.department)),
      group('e_position', 'Position', inp('position', 'text', v.position)), group('e_join_date', 'Tanggal bergabung', inp('join_date', 'date', v.join_date)),
      group('e_role', 'Role', pick('role', ['Employee', 'Manager', 'Admin'].map(function (r) { return opt(r, r === 'Admin' ? 'Admin/HR' : r); }), v.role || 'Employee')),
      group('e_supervisor_id', 'Atasan langsung', pick('supervisor_id', sups, v.supervisor_id))];
    fields.push(e ? group('e_status', 'Status', pick('status', [opt('Active', 'Aktif'), opt('Inactive', 'Nonaktif')], v.status)) : group('e_leave_balance', 'Saldo cuti awal (kosong = jatah default)', inp('leave_balance', 'number', '')));
    var go = el('button', { class: 'btn block', type: 'submit', text: e ? 'Simpan perubahan' : 'Buat akun' });
    var form = el('form', { class: 'fgrid', novalidate: true, onsubmit: function (ev) {
      ev.preventDefault(); var p = {};
      Object.keys(F).forEach(function (k) { var val = F[k].value.trim(); if (e || val) p[k] = val; });
      if (e) p.employee_id = e.employee_id; else if (!p.full_name || !p.email || !p.department || !p.position || !p.join_date) return show('Lengkapi nama, email, department, position, dan tanggal bergabung.', true);
      go.disabled = true;
      M.api(e ? 'admin.employees.update' : 'admin.employees.create', p).then(function (d) {
        show(e ? 'Data karyawan disimpan.' : 'Akun ' + d.employee.employee_id + ' dibuat. Password sementara: ' + d.temporary_password + ' (tampil sekali, sampaikan secara aman; wajib diganti saat login pertama).'); panel.hidden = true; load();
      }).catch(function (err) { show(err.message, true); go.disabled = false; });
    } }, fields.concat(el('div', { class: 'full' }, [go])));
    var kids = [el('h3', { text: e ? 'Ubah ' + e.full_name : 'Tambah karyawan' }), form];
    if (e) kids.push(tools(e));
    panel.replaceChildren.apply(panel, kids.concat(el('button', { class: 'btn ghost', type: 'button', text: 'Tutup', onclick: function () { panel.hidden = true; } })));
    panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth' });
  }

  function tools(e) {
    var mode = el('select', { 'aria-label': 'Jenis perubahan saldo' }, [opt('add', 'Tambah/kurangi'), opt('set', 'Set saldo')]);
    var amt = el('input', { type: 'number', step: '0.5', placeholder: 'Jumlah hari', 'aria-label': 'Jumlah hari' }), why = el('input', { type: 'text', placeholder: 'Alasan (wajib)', 'aria-label': 'Alasan perubahan saldo' });
    return el('div', { class: 'today' }, [
      el('div', { class: 'grow' }, [el('b', { text: 'Saldo cuti: ' + f.num(e.leave_balance) + ' hari' }), el('div', { class: 'bar' }, [mode, amt, why,
        el('button', { class: 'btn sm', type: 'button', text: 'Simpan saldo', onclick: function () {
          M.api('admin.leave.adjustBalance', { employee_id: e.employee_id, mode: mode.value, amount: amt.value, reason: why.value }).then(function (d) {
            show('Saldo ' + e.full_name + ': ' + f.num(d.old_balance) + ' → ' + f.num(d.new_balance) + ' hari.'); panel.hidden = true; load();
          }).catch(function (err) { show(err.message, true); }); } })])]),
      el('button', { class: 'btn sm ghost', type: 'button', text: 'Reset password', onclick: function () {
        if (!confirm('Reset password ' + e.full_name + '? Semua sesi login karyawan ini akan diakhiri.')) return;
        M.api('admin.users.resetPassword', { employee_id: e.employee_id }).then(function (d) { show('Password sementara ' + e.full_name + ': ' + d.temporary_password + ' (tampil sekali).'); panel.hidden = true; })
          .catch(function (err) { show(err.message, true); }); } })]);
  }

  function renderList() {
    var t = q.value.trim().toLowerCase();
    var rows = emps.filter(function (e) { return !t || (e.full_name + ' ' + e.employee_id).toLowerCase().indexOf(t) >= 0; });
    list.replaceChildren(rows.length ? el('ul', { class: 'feed' }, rows.map(function (e) {
      return el('li', { class: 'req' }, [
        el('div', { class: 'rh' }, [el('b', { text: e.full_name }), el('span', { class: 'badge ' + (e.status === 'Active' ? 'Approved' : 'Rejected'), text: e.status === 'Active' ? e.role === 'Admin' ? 'Admin/HR' : e.role : 'Nonaktif' })]),
        el('small', { text: e.employee_id + ', ' + e.department + ', ' + e.position }), el('small', { text: 'Atasan: ' + (e.supervisor_name || '-') + ', saldo cuti ' + f.num(e.leave_balance) + ' hari' }),
        el('div', { class: 'bar' }, [el('button', { class: 'btn sm ghost', type: 'button', text: 'Ubah', onclick: function () { openForm(e); } })])]);
    })) : el('p', { class: 'muted', text: 'Tidak ada karyawan.' }));
  }

  function load() {
    return M.api('admin.employees.list', {}).then(function (d) { emps = d.items; renderList(); })
      .catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message }), el('button', { class: 'btn', type: 'button', text: 'Coba lagi', onclick: load })); });
  }
  content.replaceChildren(box, panel, el('section', { class: 'card' }, [el('div', { class: 'hh' }, [el('h3', { text: 'Daftar karyawan' }), el('button', { class: 'btn sm', type: 'button', text: 'Tambah karyawan', onclick: function () { openForm(null); } })]), q, list]));
  load();
})();
