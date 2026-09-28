(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require(), content = M.shell('dashboard', 'Dashboard', s.user);
  var LABEL = { leave: 'Cuti', permission: 'Izin', overtime: 'Lembur' };

  function load() {
    content.replaceChildren(el('div', { class: 'skel' }), el('div', { class: 'two' }, [el('div', { class: 'skel' }), el('div', { class: 'skel' })]));
    M.api('dashboard.get').then(render).catch(function (err) {
      content.replaceChildren(el('div', { class: 'card' }, [el('h3', { text: 'Dashboard belum bisa dimuat' }), el('p', { class: 'muted', text: err.message }),
        el('button', { class: 'btn', type: 'button', style: null, onclick: load, text: 'Coba lagi' })]));
    });
  }

  function attendanceCard(a) {
    var r = a.record, body;
    if (r && r.clock_out) body = [el('div', { class: 'big', text: 'Selesai' }), el('p', { class: 'row', text: 'Masuk ' + r.clock_in.slice(0, 5) + ', pulang ' + r.clock_out.slice(0, 5) })];
    else if (r) body = [el('div', { class: 'big', text: 'Sedang bekerja' }), el('p', { class: 'row', text: 'Masuk ' + r.clock_in.slice(0, 5) + ' ' }, [el('span', { class: 'badge ' + r.status, text: r.status === 'Late' ? 'Terlambat' : 'Tepat waktu' })])];
    else if (a.can_clock_in) body = [el('div', { class: 'big', text: 'Belum Clock In' }), el('p', { class: 'row', text: 'Jadwal ' + a.schedule.start + '–' + a.schedule.end })];
    else body = [el('div', { class: 'big', text: 'Tidak ada presensi' }), el('p', { class: 'row', text: a.message })];
    return el('section', { class: 'card' }, [el('h3', { text: 'Presensi hari ini' })].concat(body, M.ready('attendance') ? [el('a', { class: 'btn ghost', href: 'attendance.html', text: 'Buka presensi' })] : []));
  }

  function lastCard(r) {
    var body;
    if (!r) body = [el('div', { class: 'big', text: 'Belum ada pengajuan' }), el('p', { class: 'row', text: 'Pengajuan cuti, izin, dan lembur Anda muncul di sini.' })];
    else {
      var sum = r.type === 'leave' ? r.leave_type + ', ' + f.date(r.start_date) + (r.end_date !== r.start_date ? ' – ' + f.date(r.end_date) : '')
        : r.type === 'permission' ? r.permission_type + ', ' + f.date(r.start_date) : f.date(r.date) + ', ' + r.start_time + '–' + r.end_time;
      body = [el('div', { class: 'big', text: LABEL[r.type] }), el('p', { class: 'row', text: sum + ' ' }, [el('span', { class: 'badge ' + r.status, text: r.status })])];
    }
    return el('section', { class: 'card' }, [el('h3', { text: 'Pengajuan terakhir' })].concat(body));
  }

  function tile(n, badge) {
    var kids = [M.icon(n.icon), n.label];
    if (!M.ready(n.id)) return el('span', { class: 'tile soon', 'aria-disabled': 'true' }, kids.concat(el('small', { text: 'Segera' })));
    if (badge) kids.push(el('span', { class: 'n', text: String(badge) }));
    return el('a', { class: 'tile', href: n.href }, kids);
  }

  function render(d) {
    var p = d.profile, st = d.stats, h = +d.attendance.server_time.slice(0, 2);
    M.setToday(d.attendance.date);
    var greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
    var hero = el('section', { class: 'hero' }, [
      el('h2', { text: greet + ', ' + p.full_name.split(' ')[0] }), el('p', { class: 'sub', text: p.position + ', ' + p.department }),
      el('div', { class: 'ids' }, [el('span', { text: p.employee_id }), el('span', { text: p.supervisor_name ? 'Atasan: ' + p.supervisor_name : 'Belum ada atasan' })]),
      el('div', { class: 'stats' }, [
        el('div', {}, [el('b', { text: f.num(st.leave_balance) }), el('small', { text: 'Sisa cuti (hari)' })]),
        el('div', {}, [el('b', { text: f.num(st.permission_this_month) }), el('small', { text: 'Izin bulan ini' })]),
        el('div', {}, [el('b', { text: f.num(st.overtime_hours_this_month) }), el('small', { text: 'Lembur (jam)' })])])]);

    var tiles = [].concat(['attendance', 'leave', 'permission', 'overtime', 'activity'].map(function (id) { return tile(NAVBY(id)); }));
    var mgmt = (d.pending_approvals !== undefined) ? [el('h2', { class: 'sec', text: 'Management' }), el('div', { class: 'tiles' }, [tile(NAVBY('approval'), d.pending_approvals)].concat(p.role === 'Admin' ? [tile(NAVBY('employees'))] : []))] : [];

    var acts = d.recent_activity.length ? el('ul', { class: 'feed' }, d.recent_activity.map(function (a) {
      return el('li', {}, [el('span', { class: 'dot' }), el('div', {}, [a.description, el('small', { text: f.ago(a.timestamp) })])]);
    })) : el('p', { class: 'muted', text: 'Belum ada aktivitas.' });

    content.replaceChildren.apply(content, [hero, el('div', { class: 'two' }, [attendanceCard(d.attendance), lastCard(d.last_request)]),
      el('h2', { class: 'sec', text: 'Menu' }), el('div', { class: 'tiles' }, tiles)].concat(mgmt, [el('section', { class: 'card' }, [el('h3', { text: 'Aktivitas terbaru' }), acts])]));
  }
  function NAVBY(id) {
    return { attendance: { id: id, label: 'Presensi', icon: 'clock', href: 'attendance.html' }, leave: { id: id, label: 'Cuti', icon: 'calendar', href: 'leave.html' },
      permission: { id: id, label: 'Izin', icon: 'file', href: 'permission.html' }, overtime: { id: id, label: 'Lembur', icon: 'zap', href: 'overtime.html' },
      activity: { id: id, label: 'Aktivitas', icon: 'activity', href: 'activity.html' }, approval: { id: id, label: 'Approval', icon: 'shield', href: 'approval.html' }, employees: { id: id, label: 'Karyawan', icon: 'users', href: 'employees.html' } }[id];
  }
  load();
})();
