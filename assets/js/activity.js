(function () {
  'use strict';
  var M = Maxi, el = M.el, f = M.fmt, s = M.auth.require(), content = M.shell('activity', 'Aktivitas', s.user);
  var PAGE = 20, offset = 0, ul = el('ul', { class: 'feed' }), body = el('div', {}), more = null;

  function row(a) {
    return el('li', {}, [el('span', { class: 'dot' }), el('div', {}, [a.description, el('small', { text: f.ago(a.timestamp) })])]);
  }

  function fail(err) {
    body.replaceChildren(el('p', { class: 'muted', text: err.message }),
      el('button', { class: 'btn', type: 'button', text: 'Coba lagi', onclick: function () { load(true); } }));
  }

  function load(reset) {
    if (reset) { offset = 0; ul = el('ul', { class: 'feed' }); body.replaceChildren(el('div', { class: 'skel' })); }
    else if (more) more.disabled = true;
    M.api('activity.list', { limit: PAGE, offset: offset }).then(function (d) {
      if (offset === 0 && !d.items.length) { body.replaceChildren(el('p', { class: 'muted', text: 'Belum ada aktivitas.' })); return; }
      d.items.forEach(function (a) { ul.appendChild(row(a)); });
      if (more) more.remove();
      body.replaceChildren(ul);
      if (d.has_more) {
        offset += PAGE;
        more = el('button', { class: 'btn ghost', type: 'button', text: 'Muat lebih banyak', onclick: function () { load(false); } });
        body.appendChild(more);
      }
    }).catch(fail);
  }

  content.replaceChildren(el('section', { class: 'card' }, [el('h3', { text: 'Riwayat aktivitas Anda' }), body]));
  load(true);
})();
