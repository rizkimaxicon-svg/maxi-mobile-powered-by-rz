/* Halaman Cuti / Izin / Lembur: satu skrip, dipilih lewat <body data-kind="leave|permission|overtime">. */
(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require(), kind = document.body.dataset.kind;
  var T = {
    leave: { title: 'Cuti', fields: [['leave_type', 'Jenis cuti', 'select'], ['start_date', 'Tanggal mulai', 'date'], ['end_date', 'Tanggal selesai', 'date', 1], ['reason', 'Alasan', 'textarea']] },
    permission: { title: 'Izin', fields: [['permission_type', 'Jenis izin', 'select'], ['start_date', 'Tanggal mulai', 'date'], ['end_date', 'Tanggal selesai', 'date', 1],
      ['start_time', 'Jam mulai (opsional, izin per jam)', 'time', 1], ['end_time', 'Jam selesai (opsional)', 'time', 1], ['reason', 'Alasan', 'textarea']] },
    overtime: { title: 'Lembur', fields: [['date', 'Tanggal lembur', 'date'], ['start_time', 'Jam mulai', 'time'], ['end_time', 'Jam selesai', 'time'], ['reason', 'Alasan', 'textarea']] }
  }[kind];
  var content = M.shell(kind, T.title, s.user), offset = 0, types = [], form, box, btn, list = el('div', {}), more, head = el('div', {});
  box = el('div', { class: 'alert', role: 'status', hidden: true });

  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; }
  function range(r) { return f.date(r.start_date) + (r.end_date !== r.start_date ? ' – ' + f.date(r.end_date) : ''); }
  function summary(r) {
    if (kind === 'leave') return r.leave_type + ', ' + range(r) + ' (' + f.num(r.total_days) + ' hari)';
    if (kind === 'permission') return r.permission_type + ', ' + range(r) + (r.start_time ? ', ' + r.start_time + '–' + r.end_time : '');
    return f.date(r.date) + ', ' + r.start_time + '–' + r.end_time + ' (' + f.num(r.total_hours) + ' jam)';
  }

  function buildForm() {
    var kids = T.fields.map(function (d) {
      var id = 'f_' + d[0], inp;
      if (d[2] === 'select') inp = el('select', { id: id, name: d[0], required: true }, types.map(function (t) { return el('option', { value: t, text: t }); }));
      else if (d[2] === 'textarea') inp = el('textarea', { id: id, name: d[0], rows: 3, maxlength: 300, required: true });
      else inp = el('input', { id: id, name: d[0], type: d[2], required: !d[3] });
      return el('div', { class: d[2] === 'textarea' || d[2] === 'select' ? 'full' : '' }, [el('label', { for: id, text: d[1] }), inp]);
    });
    btn = el('button', { class: 'btn block', type: 'submit', text: 'Kirim pengajuan' });
    form = el('form', { class: 'fgrid', novalidate: true, onsubmit: submit }, kids.concat(el('div', { class: 'full' }, [btn])));
  }

  function submit(e) {
    e.preventDefault(); box.hidden = true;
    var p = {}, bad = false;
    T.fields.forEach(function (d) { var v = form.elements[d[0]].value.trim(); if (v) p[d[0]] = v; else if (!d[3]) bad = true; });
    if (bad) return show('Lengkapi semua kolom yang wajib diisi.', true);
    if (p.end_date && p.start_date && p.end_date < p.start_date) return show('Tanggal selesai tidak boleh sebelum tanggal mulai.', true);
    btn.disabled = true; btn.textContent = 'Mengirim…';
    M.api(kind + '.submit', p).then(function () {
      show('Pengajuan terkirim. Status: Pending, menunggu persetujuan atasan.'); form.reset(); load(true);
    }).catch(function (err) { show(err.message, true); }).then(function () { btn.disabled = false; btn.textContent = 'Kirim pengajuan'; });
  }

  function row(r) {
    return el('li', { class: 'req' }, [
      el('div', { class: 'rh' }, [el('b', { text: summary(r) }), el('span', { class: 'badge ' + r.status, text: r.status })]),
      el('small', { text: r.reason }),
      r.approver_note ? el('small', { text: 'Catatan atasan: ' + r.approver_note }) : null,
      el('small', { text: r.id + ' · diajukan ' + f.ago(r.created_at) })]);
  }

  function load(reset) {
    if (reset) { offset = 0; list.replaceChildren(el('div', { class: 'skel' })); }
    return M.api(kind + '.list', { limit: 10, offset: offset }).then(function (d) {
      if (!form) {
        types = d.types || []; buildForm();
        if (kind === 'leave') head.replaceChildren(el('section', { class: 'card' }, [el('div', { class: 'today' }, [
          el('div', {}, [el('small', { text: 'Saldo cuti (hari)' }), el('b', { text: f.num(d.balance) })]),
          el('div', {}, [el('small', { text: 'Menunggu persetujuan' }), el('b', { text: f.num(d.pending_days) })]),
          el('div', {}, [el('small', { text: 'Tersedia' }), el('b', { text: f.num(d.available) })])])]));
        content.replaceChildren(head, el('section', { class: 'card' }, [el('h3', { text: 'Ajukan ' + T.title.toLowerCase() }), form, box]),
          el('section', { class: 'card' }, [el('h3', { text: 'Riwayat pengajuan' }), list]));
      } else if (kind === 'leave' && reset) {
        head.querySelectorAll('.today b').forEach(function (b, i) { b.textContent = f.num([d.balance, d.pending_days, d.available][i]); });
      }
      if (offset === 0) list.replaceChildren();
      if (more) more.remove();
      if (!d.items.length && offset === 0) list.appendChild(el('p', { class: 'muted', text: 'Belum ada pengajuan.' }));
      else {
        var ul = list.querySelector('ul') || list.appendChild(el('ul', { class: 'feed' }));
        d.items.forEach(function (r) { ul.appendChild(row(r)); });
      }
      if (d.has_more) { offset += 10; more = el('button', { class: 'btn ghost', type: 'button', text: 'Muat lebih banyak', onclick: function () { load(false); } }); list.appendChild(more); }
    }).catch(function (e) {
      content.replaceChildren(el('div', { class: 'card' }, [el('h3', { text: T.title + ' belum bisa dimuat' }), el('p', { class: 'muted', text: e.message }), el('button', { class: 'btn', type: 'button', text: 'Coba lagi', onclick: function () { form = null; load(true); } })]));
    });
  }
  content.replaceChildren(el('div', { class: 'skel' }), el('div', { class: 'skel' }));
  load(true);
})();
