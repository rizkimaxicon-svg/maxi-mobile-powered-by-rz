(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require();
  if (s.user.role !== 'Manager' && s.user.role !== 'Admin') { location.replace('dashboard.html'); return; }
  var content = M.shell('approval', 'Approval', s.user), LBL = { leave: 'Cuti', permission: 'Izin', overtime: 'Lembur' };
  var sel = el('select', { 'aria-label': 'Filter status', onchange: load }, ['Pending', 'Approved', 'Rejected', 'All'].map(function (v) { return el('option', { value: v, text: v === 'All' ? 'Semua' : v }); }));
  var box = el('div', { class: 'alert info', role: 'status', hidden: true }), list = el('div', {});

  function show(t, err) { box.textContent = t; box.className = 'alert' + (err ? '' : ' info'); box.hidden = false; }
  function range(r) { return f.date(r.start_date) + (r.end_date !== r.start_date ? ' – ' + f.date(r.end_date) : ''); }
  function summary(r) {
    if (r.type === 'leave') return r.leave_type + ', ' + range(r) + ' (' + f.num(r.total_days) + ' hari)';
    if (r.type === 'permission') return r.permission_type + ', ' + range(r) + (r.start_time ? ', ' + r.start_time + '–' + r.end_time : '');
    return f.date(r.date) + ', ' + r.start_time + '–' + r.end_time + ' (' + f.num(r.total_hours) + ' jam)';
  }

  function decide(r, decision) {
    var note = '';
    if (decision === 'Rejected') { note = prompt('Alasan penolakan (wajib, minimal 3 karakter):'); if (note === null) return; }
    else if (!confirm('Setujui ' + LBL[r.type].toLowerCase() + ' ' + r.employee_name + '?')) return;
    list.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    M.api('approval.decide', { type: r.type, id: r.id, decision: decision, note: note.trim() }).then(function () {
      show(LBL[r.type] + ' ' + r.employee_name + ' ' + (decision === 'Approved' ? 'disetujui.' : 'ditolak.'));
    }).catch(function (e) { show(e.message, true); }).then(load);
  }

  function row(r) {
    return el('li', { class: 'req' }, [
      el('div', { class: 'rh' }, [el('b', { text: r.employee_name + ', ' + LBL[r.type] }), el('span', { class: 'badge ' + r.status, text: r.status })]),
      el('small', { text: summary(r) }), el('small', { text: r.reason }),
      r.approver_note ? el('small', { text: 'Catatan: ' + r.approver_note }) : null,
      el('small', { text: r.department + ', diajukan ' + f.ago(r.created_at) }),
      r.can_decide ? el('div', { class: 'bar' }, [el('button', { class: 'btn sm', type: 'button', text: 'Approve', onclick: function () { decide(r, 'Approved'); } }),
        el('button', { class: 'btn sm ghost', type: 'button', text: 'Reject', onclick: function () { decide(r, 'Rejected'); } })]) : null]);
  }

  function load() {
    list.replaceChildren(el('div', { class: 'skel' }));
    M.api('approval.list', { status: sel.value, limit: 50 }).then(function (d) {
      list.replaceChildren(d.items.length ? el('ul', { class: 'feed' }, d.items.map(row)) : el('p', { class: 'muted', text: sel.value === 'Pending' ? 'Tidak ada pengajuan yang menunggu persetujuan.' : 'Tidak ada data.' }));
    }).catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message }), el('button', { class: 'btn', type: 'button', text: 'Coba lagi', onclick: load })); });
  }
  content.replaceChildren(el('section', { class: 'card' }, [el('div', { class: 'hh' }, [el('h3', { text: 'Pengajuan bawahan' }), sel]), box, list]));
  load();
})();
