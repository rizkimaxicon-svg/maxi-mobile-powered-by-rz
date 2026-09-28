(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require();
  if (s.user.role !== 'Admin') { location.replace('dashboard.html'); return; }
  var content = M.shell('settings', 'Pengaturan', s.user), box = el('div', { class: 'alert info', role: 'status', hidden: true }), list = el('div', {}), rows = [];
  var q = el('input', { type: 'text', placeholder: 'Cari pengaturan', 'aria-label': 'Cari pengaturan', oninput: render });
  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; }

  function render() {
    var t = q.value.trim().toLowerCase();
    list.replaceChildren(el('ul', { class: 'feed' }, rows.filter(function (r) { return !t || (r.setting_key + ' ' + r.description).toLowerCase().indexOf(t) >= 0; }).map(function (r) {
      var inp = r.value_type === 'Boolean' ? el('select', { 'aria-label': r.setting_key }, ['TRUE', 'FALSE'].map(function (v) { return el('option', { value: v, text: v === 'TRUE' ? 'Ya' : 'Tidak' }); })) : el('input', { type: 'text', 'aria-label': r.setting_key });
      inp.value = String(r.setting_value).toUpperCase() === 'TRUE' || String(r.setting_value).toUpperCase() === 'FALSE' ? String(r.setting_value).toUpperCase() : r.setting_value;
      var ro = r.setting_key === 'leave_last_reset_year'; if (ro) inp.disabled = true;
      return el('li', { class: 'req' }, [el('b', { text: r.description || r.setting_key }), el('small', { text: r.setting_key }),
        el('div', { class: 'bar' }, [inp, ro ? null : el('button', { class: 'btn sm', type: 'button', text: 'Simpan', onclick: function () {
          M.api('admin.settings.update', { key: r.setting_key, value: inp.value }).then(function (d) { r.setting_value = d.value; show('Tersimpan: ' + r.setting_key + ' = ' + d.value); }).catch(function (e) { show(e.message, true); }); } })])]);
    })));
  }

  var yr = el('input', { type: 'number', value: new Date().getFullYear() + 1, 'aria-label': 'Tahun tujuan' }), out = el('div', {}), go;
  function preview(apply) {
    M.api('admin.leave.yearEnd', { target_year: +yr.value, apply: apply === true }).then(function (d) {
      var p = d.policy;
      out.replaceChildren(el('p', { class: 'row', text: (d.applied ? 'Diterapkan. ' : 'Pratinjau. ') + 'Jatah ' + f.num(p.entitlement) + ' hari, carry-over ' + (p.carry_over_enabled ? 'aktif (maks. ' + f.num(p.carry_over_max_days) + ' hari)' : 'nonaktif') + '.' }),
        el('ul', { class: 'feed' }, d.items.map(function (i) { return el('li', { class: 'req' }, [el('b', { text: i.full_name }), el('small', { text: 'Saldo ' + f.num(i.old_balance) + ' → ' + f.num(i.new_balance) + ' hari' + (i.carried ? ' (dibawa ' + f.num(i.carried) + ')' : '') })]); })),
        d.applied ? null : el('button', { class: 'btn', type: 'button', text: 'Terapkan ke semua karyawan aktif', onclick: function () { if (confirm('Terapkan pergantian tahun cuti ' + yr.value + '? Tindakan ini hanya bisa dilakukan sekali per tahun.')) preview(true); } }));
      if (d.applied) show('Pergantian tahun cuti ' + d.target_year + ' diterapkan.');
    }).catch(function (e) { out.replaceChildren(); show(e.message, true); });
  }
  content.replaceChildren(box,
    el('section', { class: 'card' }, [el('h3', { text: 'Pergantian tahun cuti' }), el('p', { class: 'muted', text: 'Saldo baru = jatah tahunan + sisa cuti yang boleh dibawa (sesuai pengaturan carry-over di bawah). Lihat pratinjau sebelum menerapkan.' }),
      el('div', { class: 'bar' }, [yr, el('button', { class: 'btn sm', type: 'button', text: 'Pratinjau', onclick: function () { preview(false); } })]), out]),
    el('section', { class: 'card' }, [el('h3', { text: 'Semua pengaturan' }), q, list]));
  M.api('admin.settings.list', {}).then(function (d) { rows = d.items; render(); }).catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message })); });
})();
