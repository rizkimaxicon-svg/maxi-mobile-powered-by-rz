(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require();
  if (s.user.role !== 'Admin') { location.replace('dashboard.html'); return; }
  var content = M.shell('holidays', 'Hari libur', s.user), TYPE = { National: 'Nasional', Collective: 'Cuti bersama', Company: 'Perusahaan' };
  var box = el('div', { class: 'alert info', role: 'status', hidden: true }), panel = el('section', { class: 'card', hidden: true }), list = el('div', {});
  var year = el('input', { type: 'number', value: new Date().getFullYear(), 'aria-label': 'Tahun', onchange: load });
  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; }
  function g(id, label, inp) { return el('div', {}, [el('label', { for: id, text: label }), inp]); }
  function sel(id, opts, v) { var x = el('select', { id: id }, opts.map(function (o) { return el('option', { value: o[0], text: o[1] }); })); x.value = v; return x; }

  function openForm(h) {
    h = h || {};
    var d = el('input', { id: 'h_d', type: 'date', value: h.date || '' }), n = el('input', { id: 'h_n', type: 'text', value: h.holiday_name || '', maxlength: 100 });
    var t = sel('h_t', Object.keys(TYPE).map(function (k) { return [k, TYPE[k]]; }), h.type || 'National'), st = sel('h_s', [['Active', 'Aktif'], ['Inactive', 'Nonaktif']], h.status || 'Active');
    var go = el('button', { class: 'btn block', type: 'submit', text: 'Simpan' });
    var form = el('form', { class: 'fgrid', novalidate: true, onsubmit: function (e) {
      e.preventDefault(); if (!d.value || !n.value.trim()) return show('Tanggal dan nama hari libur wajib diisi.', true);
      go.disabled = true;
      M.api('admin.holidays.upsert', { holiday_id: h.holiday_id, date: d.value, holiday_name: n.value.trim(), type: t.value, status: st.value }).then(function () { show('Hari libur disimpan.'); panel.hidden = true; load(); })
        .catch(function (err) { show(err.message, true); go.disabled = false; });
    } }, [g('h_d', 'Tanggal', d), g('h_n', 'Nama hari libur', n), g('h_t', 'Jenis', t), g('h_s', 'Status', st), el('div', { class: 'full' }, [go])]);
    panel.replaceChildren(el('h3', { text: h.holiday_id ? 'Ubah hari libur' : 'Tambah hari libur' }), form, el('button', { class: 'btn ghost', type: 'button', text: 'Tutup', onclick: function () { panel.hidden = true; } }));
    panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth' });
  }

  function load() {
    list.replaceChildren(el('div', { class: 'skel' }));
    M.api('holidays.list', { year: +year.value }).then(function (d) {
      list.replaceChildren(d.items.length ? el('ul', { class: 'feed' }, d.items.map(function (h) {
        return el('li', { class: 'req' }, [el('div', { class: 'rh' }, [el('b', { text: f.date(h.date) + ', ' + h.holiday_name }), el('span', { class: 'badge ' + (h.status === 'Active' ? 'Approved' : 'Rejected'), text: h.status === 'Active' ? 'Aktif' : 'Nonaktif' })]),
          el('small', { text: TYPE[h.type] || h.type }), el('div', { class: 'bar' }, [el('button', { class: 'btn sm ghost', type: 'button', text: 'Ubah', onclick: function () { openForm(h); } })])]);
      })) : el('p', { class: 'muted', text: 'Belum ada hari libur pada tahun ini. Hari libur nasional dan cuti bersama perlu diisi setiap tahun.' }));
    }).catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message })); });
  }
  content.replaceChildren(box, panel, el('section', { class: 'card' }, [el('div', { class: 'hh' }, [el('h3', { text: 'Daftar hari libur' }), el('div', { class: 'bar' }, [year, el('button', { class: 'btn sm', type: 'button', text: 'Tambah', onclick: function () { openForm(null); } })])]), list]));
  load();
})();
