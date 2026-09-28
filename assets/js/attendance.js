(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require(), content = M.shell('attendance', 'Presensi', s.user);
  var LBL = { Present: 'Tepat waktu', Late: 'Terlambat', Absent: 'Tidak hadir' }, off = 0;
  var clockEl = el('div', { class: 'clock', text: '--:--:--' }), msg = el('div', { class: 'alert info', role: 'status', hidden: true });
  var today = el('section', { class: 'card' }, [el('div', { class: 'skel' })]), list = el('div', {});
  var month = el('input', { type: 'month', 'aria-label': 'Pilih bulan', value: new Date().toLocaleDateString('sv-SE').slice(0, 7) });

  function secs(t) { var p = t.split(':'); return (+p[0] * 3600 + +p[1] * 60 + +p[2]) * 1000; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() { var t = Math.floor(((off + Date.now()) % 86400000) / 1000); clockEl.textContent = pad(t / 3600 | 0) + ':' + pad((t / 60 | 0) % 60) + ':' + pad(t % 60); }
  function show(t, isErr) { msg.textContent = t; msg.className = 'alert' + (isErr ? '' : ' info'); msg.hidden = false; }
  function badge(st) { return el('span', { class: 'badge ' + st, text: LBL[st] || st }); }
  function item(k, v) { return el('div', {}, [el('small', { text: k }), el('b', { text: v })]); }

  function act(action, label) {
    today.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    M.api(action).then(function (d) {
      show(label + ' tercatat pukul ' + (action === 'attendance.clockIn' ? d.record.clock_in : d.record.clock_out).slice(0, 5) + (d.status === 'Late' ? ' (terlambat).' : '.'));
    }).catch(function (e) { show(e.message, true); }).then(function () { loadToday(); loadHist(); });
  }

  function renderToday(a) {
    off = secs(a.server_time) - Date.now(); M.setToday(a.date); tick();
    var r = a.record, inB = el('button', { class: 'btn y', type: 'button', onclick: function () { act('attendance.clockIn', 'Clock In'); } }, [M.icon('clock'), 'Clock In']);
    var outB = el('button', { class: 'btn', type: 'button', onclick: function () { if (confirm('Clock Out sekarang? Anda tidak dapat membatalkannya sendiri.')) act('attendance.clockOut', 'Clock Out'); } }, [M.icon('out'), 'Clock Out']);
    inB.disabled = !a.can_clock_in; outB.disabled = !a.can_clock_out;
    var sched = a.schedule.holiday ? 'Libur: ' + a.schedule.holiday : a.schedule.off ? 'Hari ini libur.' : 'Jadwal ' + a.schedule.start + '–' + a.schedule.end;
    today.replaceChildren(clockEl, el('p', { class: 'muted', text: f.long(a.date) }), el('p', { class: 'row', text: sched }), el('div', { class: 'acts' }, [inB, outB]), msg,
      r ? el('div', { class: 'today' }, [item('Masuk', r.clock_in.slice(0, 5)), item('Pulang', r.clock_out ? r.clock_out.slice(0, 5) : '–'), el('div', {}, [el('small', { text: 'Status' }), badge(r.status)])])
        : (!a.can_clock_in && a.message ? el('p', { class: 'row', text: a.message }) : null));
  }
  function loadToday() {
    return M.api('attendance.today').then(renderToday).catch(function (e) {
      today.replaceChildren(el('h3', { text: 'Presensi belum bisa dimuat' }), el('p', { class: 'muted', text: e.message }), el('button', { class: 'btn', type: 'button', onclick: loadToday, text: 'Coba lagi' }));
    });
  }
  function loadHist() {
    list.replaceChildren(el('div', { class: 'skel' }));
    M.api('attendance.history', { month: month.value }).then(function (d) {
      list.replaceChildren(el('p', { class: 'row', text: 'Tepat waktu ' + d.summary.present + ', terlambat ' + d.summary.late + (d.summary.absent ? ', tidak hadir ' + d.summary.absent : '') }),
        d.items.length ? el('ul', { class: 'feed' }, d.items.map(function (r) {
          return el('li', { class: 'hrow' }, [el('b', { text: f.date(r.date) }), el('span', { text: r.clock_in.slice(0, 5) + ' – ' + (r.clock_out ? r.clock_out.slice(0, 5) : 'belum Clock Out') }), badge(r.status)]);
        })) : el('p', { class: 'muted', text: 'Belum ada presensi pada bulan ini.' }));
    }).catch(function (e) { list.replaceChildren(el('p', { class: 'muted', text: e.message })); });
  }
  month.addEventListener('change', function () { if (month.value) loadHist(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) loadToday(); });
  setInterval(tick, 1000);
  content.replaceChildren(today, el('section', { class: 'card' }, [el('div', { class: 'hh' }, [el('h3', { text: 'Riwayat presensi' }), month]), list]));
  loadToday(); loadHist();
})();
