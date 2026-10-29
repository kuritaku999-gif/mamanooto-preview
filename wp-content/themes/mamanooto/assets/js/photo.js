/* v6.0 実写版トップ：流れる写真帯を切れ目なくつなぐため、中身を1回複製する */
(function () {
	var track = document.querySelector('.mnp-marquee-track');
	if (!track || track.dataset.cloned) return;
	Array.prototype.slice.call(track.children).forEach(function (el) {
		var c = el.cloneNode(true);
		c.setAttribute('aria-hidden', 'true');
		track.appendChild(c);
	});
	track.dataset.cloned = '1';
})();

/* v7.2 できること：選んだ項目の写真に切りかえる（見えている間は自動でゆっくり送る・さわったら止める） */
(function () {
	var box = document.querySelector('.mno-cando');
	if (!box) return;
	var imgs = box.querySelectorAll('.mno-cando-photo img');
	var btns = box.querySelectorAll('.mno-cando-list button');
	var cur = 0, timer = null, touched = false;
	function show(i) {
		cur = i;
		for (var k = 0; k < btns.length; k++) {
			btns[k].classList.toggle('on', k === i);
			imgs[k].classList.toggle('on', k === i);
		}
	}
	function stop() { touched = true; if (timer) { clearInterval(timer); timer = null; } }
	Array.prototype.forEach.call(btns, function (b) {
		var i = +b.getAttribute('data-i');
		b.addEventListener('mouseenter', function () { stop(); show(i); });
		b.addEventListener('focus', function () { stop(); show(i); });
		b.addEventListener('click', function () { stop(); show(i); });
	});
	if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	new IntersectionObserver(function (es) {
		es.forEach(function (e) {
			if (touched) return;
			if (e.isIntersecting && !timer) { timer = setInterval(function () { show((cur + 1) % btns.length); }, 3200); }
			if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
		});
	}, { threshold: 0.4 }).observe(box);
})();
