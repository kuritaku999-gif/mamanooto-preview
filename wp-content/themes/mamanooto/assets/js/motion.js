/* v7.0 モーション
 *  1) ローディング「とくん、とくん。」（トップのみ）
 *  2) フェルト小物（Blender製スプライト）：画面にふわふわ・タップでぽわっ・ローディングで舞う
 *  3) スクロールで現れる・見出し1文字ずつ・写真の窓・パララックス・進み具合のハート・数字カウント
 *  時間はすべて setTimeout と CSS transition（WebKitで重いときに止まらないよう最後は必ず強制完了）
 */
(function () {
	'use strict';
	var doc = document.documentElement;
	var reduce = false;
	try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
	var IMG = (window.MNO && MNO.img) || '';
	function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

	/* ---------- フェルト小物のパーティクル ---------- */
	var sheet = new Image();
	var sheetOk = false;
	sheet.onload = function () { sheetOk = true; };
	if (IMG) sheet.src = IMG + 'felt/sheet.webp';
	var ROWS = 6, FR = 16, CELL = 96; // heart, star, cloud, flower, moon, note

	function FX(canvas) {
		this.c = canvas; this.x = canvas.getContext('2d'); this.p = []; this.on = true;
		this.resize(); var self = this;
		window.addEventListener('resize', function () { self.resize(); });
		this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
	}
	FX.prototype.resize = function () {
		var d = Math.min(window.devicePixelRatio || 1, 2);
		this.w = this.c.clientWidth; this.h = this.c.clientHeight;
		this.c.width = Math.round(this.w * d); this.c.height = Math.round(this.h * d);
		this.x.setTransform(d, 0, 0, d, 0, 0);
	};
	FX.prototype.add = function (o) {
		this.p.push({
			x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, s: o.s || 32, row: o.row != null ? o.row : (Math.random() * ROWS) | 0,
			f: Math.random() * FR, fs: (o.fs || 6) * (Math.random() < .5 ? -1 : 1), a: 0, amax: o.a || 1, life: o.life || 6, t: 0,
			sw: o.sw || 0, ph: Math.random() * 6.28, fade: o.fade || .6, loop: o.loop || null
		});
	};
	FX.prototype.loop = function (now) {
		var dt = Math.min(.05, ((now - (this.last || now)) / 1000)); this.last = now;
		var x = this.x; x.clearRect(0, 0, this.w, this.h);
		if (sheetOk) {
			for (var i = this.p.length - 1; i >= 0; i--) {
				var q = this.p[i]; q.t += dt;
				q.vy += q.g * dt; q.x += (q.vx + Math.sin(q.t * 1.3 + q.ph) * q.sw) * dt; q.y += q.vy * dt; q.f = (q.f + q.fs * dt + FR) % FR;
				var lf = q.t / q.life;
				q.a = lf < .15 ? lf / .15 : (lf > 1 - q.fade * .5 ? Math.max(0, (1 - lf) / (q.fade * .5)) : 1);
				if (q.t >= q.life || q.y < -80 || q.y > this.h + 80) {
					if (q.loop) { q.loop(q); continue; }
					this.p.splice(i, 1); continue;
				}
				x.globalAlpha = q.a * q.amax;
				x.drawImage(sheet, ((q.f | 0) % FR) * CELL, q.row * CELL, CELL, CELL, q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
			}
			x.globalAlpha = 1;
		}
		requestAnimationFrame(this.loop);
	};
	/* ぽわっと弾ける（タップ・ローディング） */
	FX.prototype.burst = function (cx, cy, n, big) {
		for (var i = 0; i < n; i++) {
			var a = Math.random() * 6.28, sp = (big ? 160 : 70) + Math.random() * (big ? 220 : 90);
			this.add({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (big ? 60 : 40), g: big ? 60 : 90, s: (big ? 30 : 18) + Math.random() * (big ? 34 : 14), life: big ? 3.2 : 1.6, fs: 10, row: big ? undefined : (Math.random() < .6 ? 0 : 5), fade: .9 });
		}
	};

	/* ---------- 1) ローディング ---------- */
	var loader = document.getElementById('mnoLoader');
	var finished = false;
	function ready() {
		if (document.body.classList.contains('mno-ready')) return;
		document.body.classList.add('mno-ready');
		doc.classList.remove('mno-loading');
	}
	if (!loader || !doc.classList.contains('mno-loading')) {
		if (loader) loader.parentNode.removeChild(loader);
		ready();
	} else {
		runLoader();
	}

	function runLoader() {
		var port = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
		var v = loader.querySelector('video');
		v.poster = loader.getAttribute(port ? 'data-pport' : 'data-pland');
		v.src = loader.getAttribute(port ? 'data-port' : 'data-land');
		v.muted = true; v.setAttribute('muted', ''); v.playsInline = true;
		try { v.load(); } catch (e) {}

		var fx = new FX(loader.querySelector('.ld-felt'));
		var short = ls('mno_intro_seen') && (Date.now() - (+ls('mno_intro_seen'))) < 7 * 864e5;
		var vw = window.innerWidth, vh = window.innerHeight;
		var R = port ? Math.min(vw * .40, vh * .23) : Math.min(vh * .29, vw * .21, 260);
		var cy = port ? .36 : .42;
		loader.style.setProperty('--rmax', R + 'px');
		var lines = loader.querySelectorAll('.ld-text .l');
		var T = [];
		function at(ms, fn) { T.push(setTimeout(fn, ms)); }
		function cls(c) { loader.classList.add(c); }
		function line(i) {
			for (var k = 0; k < lines.length; k++) {
				if (k === i) { lines[k].classList.remove('off'); lines[k].classList.add('on'); }
				else if (lines[k].classList.contains('on')) { lines[k].classList.remove('on'); lines[k].classList.add('off'); }
			}
		}
		function rise(n) { /* 窓のふちから、フェルトがふわっと浮かぶ */
			for (var i = 0; i < n; i++) {
				var a = Math.random() * 6.28;
				fx.add({ x: vw / 2 + Math.cos(a) * R, y: vh * cy + Math.sin(a) * R, vx: Math.cos(a) * 18, vy: -24 - Math.random() * 30, sw: 14, s: 22 + Math.random() * 26, life: 4 + Math.random() * 2.5, fs: 5, a: .95 });
			}
		}
		function finish(fast) {
			if (finished) return; finished = true;
			T.forEach(clearTimeout);
			ls('mno_intro_seen', String(Date.now()));
			loader.classList.add('is-out');
			setTimeout(ready, fast ? 0 : 200);
			setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 1300);
		}
		loader.querySelector('.ld-skip').addEventListener('click', function () { finish(true); });
		setTimeout(function () { finish(false); }, short ? 6000 : 13000); /* 何があっても必ず終わる */

		if (short) {
			cls('t-beat');
			at(700, function () { cls('t-open'); loader.style.setProperty('--r', (R * .9) + 'px'); try { v.play(); } catch (e) {} });
			at(1100, function () { cls('t-logo'); fx.burst(vw / 2, vh * cy, 14, true); });
			at(2300, function () { cls('t-logo-out'); cls('t-full'); loader.style.setProperty('--r', Math.hypot(vw, vh) + 'px'); });
			at(3300, function () { finish(false); });
			return;
		}
		/* 本編（約8秒） */
		at(250, function () { cls('t-beat'); });
		at(400, function () { line(0); });
		at(1700, function () {
			cls('t-open'); loader.style.setProperty('--r', R + 'px');
			var p = v.play(); if (p && p.catch) p.catch(function () {});
		});
		at(2000, function () { rise(10); });
		at(2700, function () { line(1); });
		at(3400, function () { rise(8); });
		at(4500, function () { line(2); });
		at(5000, function () { rise(8); });
		at(6200, function () { line(-1); cls('t-logo'); fx.burst(vw / 2, vh * cy, 18, true); });
		at(7500, function () {
			cls('t-logo-out'); cls('t-full');
			loader.style.setProperty('--r', Math.hypot(vw, vh) + 'px');
			fx.burst(vw / 2, vh * cy, 16, true);
		});
		at(8900, function () { finish(false); });
	}

	if (reduce) { document.querySelectorAll('.mno-rise, .mno-pop, .mno-split, .mno-mask').forEach(function (el) { el.classList.add('is-in'); }); return; }

	/* ---------- 2) 画面のフェルト（ふわふわ・タップ） ---------- */
	var fxc = document.createElement('canvas');
	fxc.className = 'mno-fx'; fxc.setAttribute('aria-hidden', 'true');
	document.body.appendChild(fxc);
	var amb = new FX(fxc);
	var small = window.innerWidth < 700;
	function seed(q) { /* 下から上へゆっくり。ほとんど透明に近い控えめな量 */
		q.x = Math.random() * amb.w; q.y = amb.h + 40; q.t = 0; q.life = 26 + Math.random() * 18;
		q.vy = -(16 + Math.random() * 14); q.vx = (Math.random() - .5) * 6; q.row = (Math.random() * ROWS) | 0;
	}
	var N = small ? 4 : 7;
	setTimeout(function () {
		for (var i = 0; i < N; i++) {
			amb.add({ x: Math.random() * amb.w, y: amb.h * (.3 + Math.random() * .8), vy: -(16 + Math.random() * 14), sw: 16, s: (small ? 18 : 22) + Math.random() * 18, life: 26 + Math.random() * 18, fs: 2.2, a: .5, fade: .3, loop: seed });
		}
	}, 1500);
	var lastTap = 0;
	document.addEventListener('pointerdown', function (e) {
		if (e.target.closest('input,textarea,select,.mno-chat,.mno-modal-box,video,iframe')) return;
		var n = Date.now(); if (n - lastTap < 350) return; lastTap = n;
		amb.burst(e.clientX, e.clientY, 6, false);
	}, { passive: true });

	/* ---------- 3) スクロールで現れる ---------- */
	function splitText(el) {
		if (el.dataset.split) return; el.dataset.split = '1';
		var i = 0;
		(function walk(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (c) {
				if (c.nodeType === 3) {
					var frag = document.createDocumentFragment();
					/* 英数字のかたまりだけ途中で折り返さない。日本語は1文字ずつ（折り返しはふつうどおり） */
					c.textContent.split(/([A-Za-z0-9.,'’!?-]+|\s+)/).forEach(function (word) {
						if (!word) return;
						if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(word)); return; }
						var box = frag;
						if (/^[A-Za-z0-9.,'’!?-]+$/.test(word)) { box = document.createElement('span'); box.className = 'wd'; frag.appendChild(box); }
						Array.from(word).forEach(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = ch; box.appendChild(s); });
					});
					c.parentNode.replaceChild(frag, c);
				} else if (c.nodeType === 1 && c.tagName !== 'BR') { walk(c); }
			});
		})(el);
	}
	document.querySelectorAll('.mnp-h2, .mno-split, .mno-sec-head h2').forEach(function (h) { h.classList.add('mno-split'); splitText(h); });
	document.querySelectorAll('.mnp-split-photo, .mnp-value .ph, .mnp-course-photo, .mno-col-card .ph').forEach(function (el) { if (!el.querySelector('.mnp-accent-char')) el.classList.add('mno-mask'); });
	document.querySelectorAll('.mno-teacher-card, .mno-post-card, .mno-archive-item, .mno-event-card, .mno-card, .mno-room-card, .mno-tsec').forEach(function (el, k) { if (!el.classList.contains('mno-anim')) { el.classList.add('mno-rise'); el.style.setProperty('--d', k % 4); } });

	var targets = '.mno-rise, .mno-pop, .mno-split, .mno-mask, .mno-feat-card, [data-count]';
	function revealAll() { document.querySelectorAll(targets).forEach(function (el) { el.classList.add('is-in'); }); }
	if (!('IntersectionObserver' in window)) { revealAll(); }
	else {
		var io = new IntersectionObserver(function (es) {
			es.forEach(function (e) {
				if (!e.isIntersecting) return;
				e.target.classList.add('is-in');
				if (e.target.hasAttribute('data-count')) countUp(e.target);
				io.unobserve(e.target);
			});
		}, { threshold: .12, rootMargin: '0px 0px -30px 0px' });
		document.querySelectorAll(targets).forEach(function (el) { io.observe(el); });
		setTimeout(revealAll, 9000 + 60000); /* 万一の保険（1分以上たっても出ないものは出す） */
	}
	function countUp(el) {
		var to = +el.getAttribute('data-count') || 0, t0 = performance.now(), dur = 1400;
		(function f(now) { var k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
	}

	/* パララックス・進み具合 */
	var bands = document.querySelectorAll('.mnp-band-bg');
	var bar = document.createElement('div'); bar.className = 'mno-progress'; bar.setAttribute('aria-hidden', 'true');
	bar.innerHTML = '<i></i><img src="' + IMG + 'felt/heart.webp" alt="">';
	document.body.appendChild(bar);
	var ticking = false;
	function onScroll() {
		if (ticking) return; ticking = true;
		requestAnimationFrame(function () {
			ticking = false;
			var h = document.documentElement.scrollHeight - innerHeight;
			bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
			bands.forEach(function (b) {
				var r = b.parentNode.getBoundingClientRect();
				if (r.bottom < 0 || r.top > innerHeight) return;
				b.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * -0.12).toFixed(1) + 'px');
			});
		});
	}
	addEventListener('scroll', onScroll, { passive: true }); onScroll();

	/* ボタンのさざなみ */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('.mno-btn'); if (!b) return;
		var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
		var rp = document.createElement('span'); rp.className = 'rp';
		rp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
		b.appendChild(rp); setTimeout(function () { rp.remove(); }, 800);
	});
})();
