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
