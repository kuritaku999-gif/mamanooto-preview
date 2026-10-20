/* v7.0 会員まわり：カレンダーの詳細・お部屋のチャット・いいね */
(function () {
	'use strict';
	var M = window.MNO || {};
	function post(data) {
		var fd = new FormData();
		Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
		fd.append('nonce', M.nonce || '');
		return fetch(M.ajax, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json(); });
	}

	/* ---------- カレンダー：タップで詳細 ---------- */
	var modal = document.getElementById('mnoEvModal');
	if (modal) {
		var body = modal.querySelector('.mno-modal-body'), lastFocus = null;
		function open(id) {
			var t = document.getElementById('mno-ev-' + id); if (!t) return;
			body.innerHTML = ''; body.appendChild(t.content.cloneNode(true));
			lastFocus = document.activeElement;
			modal.hidden = false; requestAnimationFrame(function () { modal.classList.add('on'); });
			document.documentElement.classList.add('mno-modal-open');
			modal.querySelector('.mno-modal-x').focus();
		}
		function close() {
			modal.classList.remove('on'); document.documentElement.classList.remove('mno-modal-open');
			setTimeout(function () { modal.hidden = true; }, 300);
			if (lastFocus) lastFocus.focus();
		}
		document.addEventListener('click', function (e) {
			var b = e.target.closest('[data-ev]'); if (b) { open(b.getAttribute('data-ev')); return; }
			if (e.target.closest('[data-close]')) close();
		});
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
	}

	/* ---------- お部屋（オープンチャット） ---------- */
	var chat = document.getElementById('mnoChat'), form = document.getElementById('mnoChatForm');
	if (chat && form) {
		var room = chat.getAttribute('data-room'), last = +chat.getAttribute('data-last') || 0, busy = false;
		function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML.replace(/\n/g, '<br>'); }
		function add(list) {
			var near = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 120;
			list.forEach(function (m) {
				if (m.id <= last || chat.querySelector('[data-id="' + m.id + '"]')) return;
				last = Math.max(last, m.id);
				var empty = chat.querySelector('.mno-chat-empty'); if (empty) empty.remove();
				var el = document.createElement('div');
				el.className = 'msg new' + (m.mine ? ' mine' : ''); el.setAttribute('data-id', m.id);
				el.innerHTML = '<p class="who">' + esc(m.name) + (m.role ? '<em>' + esc(m.role) + '</em>' : '') + '<span>' + esc(m.time) + '</span></p><p class="bubble">' + esc(m.text) + '</p>' + (m.mine ? '' : '<button class="report" type="button" data-report="' + m.id + '">運営に知らせる</button>');
				chat.appendChild(el);
			});
			if (near) chat.scrollTop = chat.scrollHeight;
		}
		function sync(text) {
			if (busy) return Promise.resolve(); busy = true;
			return post({ action: 'mno_room', room: room, after: last, text: text || '' }).then(function (r) {
				busy = false;
				if (r && r.success) add(r.data);
				else if (r && r.data === 'wait') alertSoft('少し時間をあけてから送ってくださいね');
			}).catch(function () { busy = false; });
		}
		function alertSoft(t) {
			var n = document.createElement('p'); n.className = 'mno-toast'; n.textContent = t; document.body.appendChild(n);
			setTimeout(function () { n.classList.add('on'); }, 10); setTimeout(function () { n.remove(); }, 2600);
		}
		chat.scrollTop = chat.scrollHeight;
		var ta = form.querySelector('textarea');
		ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
		ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var t = ta.value.trim(); if (!t) return;
			ta.value = ''; ta.style.height = '';
			sync(t).then(function () { chat.scrollTop = chat.scrollHeight; });
		});
		setInterval(function () { if (!document.hidden) sync(''); }, 8000);
		chat.addEventListener('click', function (e) {
			var b = e.target.closest('[data-report]'); if (!b) return;
			if (!confirm('この投稿を運営に知らせますか？（相手には通知されません）')) return;
			post({ action: 'mno_room_report', id: b.getAttribute('data-report') }).then(function () { b.textContent = '運営に知らせました'; b.disabled = true; });
		});
	}

	/* ---------- いいね ---------- */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-like]'); if (!b || b.disabled) return;
		b.disabled = true;
		post({ action: 'mno_like', id: b.getAttribute('data-like') }).then(function (r) {
			b.disabled = false;
			if (!r || !r.success) return;
			b.classList.toggle('on', r.data.on); b.setAttribute('aria-pressed', r.data.on ? 'true' : 'false');
			b.querySelector('.n').textContent = r.data.n;
			if (r.data.on) { b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing'); }
		}).catch(function () { b.disabled = false; });
	});
})();
