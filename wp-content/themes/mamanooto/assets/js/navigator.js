/* ともみさんナビゲーター：スクロール位置のセクションに合わせてポーズと吹き出しを切替
 * 台詞は各セクション複数パターンからランダム（同じ台詞の連続は避ける）。
 * 台詞を変えたい時はこの SCRIPT / TAPS / GREETS を書き換えるだけ。 */
(function () {
	var root = document.getElementById('mnoGuide');
	if (!root) return;
	var base = root.getAttribute('data-base') || '';
	var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* 時間帯あいさつ（FVの1文目に混ぜる） */
	var h = new Date().getHours();
	var GREETS = h < 5 ? ['夜ふかしさん、おつかれさま。', 'こんな時間まで、ほんとにおつかれさま。']
		: h < 11 ? ['おはよう！朝のバタバタ、ひと段落した？', 'おはようございます♪ 今日もいい一日にしようね。']
		: h < 17 ? ['こんにちは！ちょっとひと息つきに来た？', 'こんにちは♪ お昼寝タイムにのぞきに来てくれたのかな。']
		: h < 22 ? ['こんばんは！今日も一日おつかれさま。', 'こんばんは♪ 夜のひとり時間、ゆっくり見ていってね。']
		: ['夜おそくまでおつかれさま。', 'こんばんは。寝る前のひととき、ゆっくりどうぞ。'];

	/* セクションid → ポーズ・台詞候補・（任意）リンク */
	var SCRIPT = {
		hero: { pose: 'basic_wave', wave: true, text: [
			'ともみです！ままのおと。へようこそ♪ 下にスクロールしながら、私が案内するね。',
			'はじめまして、発起人の鉄本ともみです。この場所のこと、少しだけ話させてね。',
			'ここは「ママである前に、ひとりの人」でいられる場所。まずはゆっくり見ていって♪',
			'正解なんて、なくていい。今日はそんな話をしに来ました。'
		] },
		about: { pose: 'basic_heart', text: [
			'ママである前に、ひとりの人として。そのままのあなたでいられる場所をつくりたいの。',
			'学んでもいい。遊んでもいい。途中でやめてもいい。変わってもいい。全部OKな場所です。',
			'毎日誰かのために頑張ってると、自分のこと後回しになるよね。ここでは、あなたが主役。'
		] },
		values: { pose: 'basic_thumbs', text: [
			'大切にしているのは4つ。「そのまま」「つながる」「やってみる」「共につくる」！',
			'背伸びしなくていい。誰かの正解に合わせなくていい。それが「そのまま」。',
			'年齢も住んでる場所も仕事も違うからこそ、新しい出会いが生まれるんだよ。'
		] },
		cando: { pose: 'basic_present', text: [
			'講座も、交流も、イベントも。ここは「次の一歩が見つかる場所」だよ。',
			'専門家から学べて、ママ同士でつながれて、趣味も見つかる。よくばりでいいの♪',
			'オンラインだけじゃなくて、オフラインのイベントも。全国の仲間とつながれるよ。'
		] },
		courses: { pose: 'work_board', link: '#courses', label: 'コースを見る', text: [
			'コースは2つ。まずは気軽に、月々1,980円のコースからのぞいてみてね。',
			'今なら100名までは1,980円の特別価格。入会時の価格でずっと受けられるよ。',
			'4,980円コースは春ごろ開講目標。もっと深く学びたい人、稼ぐ力をつけたい人向け♪'
		] },
		teachers: { pose: 'work_point', link: '#teachers', label: '講師として関わる', text: [
			'講師は「先生」じゃなくて「仲間」。あなたの経験や得意なことが、誰かの一歩につながるかも。',
			'栄養、子育て、こころ、金融、美容……いろんな得意を持ち寄った14人の仲間がいるよ。',
			'講師同士もつながって、一緒に企画を考えたり、新しい可能性を生み出したりしてるの。',
			'「私にも教えられることあるかな？」って思ったら、それがもう講師の第一歩♪'
		] },
		board: { pose: 'work_board', text: [
			'講師さんからのお知らせは掲示板に届くよ。今日の講座のポイントとか、次回の予告とか♪',
			'掲示板は会員さんと講師だけの場所。ちょっとした裏話も読めるかも？',
			'講座を聞き逃しても大丈夫。ポイントは掲示板でおさらいできるよ。'
		] },
		unfinished: { pose: 'relax_hug', text: [
			'ままのおと。はまだ完成していません。だから、あなたもこの場所をつくる一人なんです。',
			'「こんな場所があったらいいな」って声で、少しずつ形を変えていく。それがここの育ち方。',
			'完成されたサービスを買うんじゃなくて、一緒に育てていく。そんな感覚でいてくれたら嬉しい。'
		] },
		future: { pose: 'work_present', text: [
			'オンラインから、全国へ。ママの可能性が新しい社会をつくる——そんな未来を描いてます。',
			'いつかリアルイベントで、全国のママたちと会える日を楽しみにしてるの。',
			'ママが活躍できる場所を、地域に、全国に。大きな夢だけど、本気だよ。'
		] },
		greeting: { pose: 'relax_mug', text: [
			'ここからは私の話。ちょっとお茶でも飲みながら、ゆっくり読んでもらえたら嬉しいな☕',
			'産後ケアの現場で、たくさんのママに出会ってきました。その中で感じたことを書いてます。',
			'「一人で頑張る」より「仲間とつながる」。そう思ったきっかけの話です。'
		] },
		partners: { pose: 'work_thumbs', text: [
			'講師・ママ・企業・地域・パートナー。ままのおと。は、一人でつくるものじゃないの。',
			'企業さんや地域の方とのコラボも大歓迎。「一緒に何かしたい」があれば声をかけてね。'
		] },
		company: { pose: 'relax_stand', text: [
			'運営は株式会社Coconeiro。一人ひとりの「心の音色」を重ねて、未来を共につくります。',
			'Coco＝個々・今ここ・心。neiro＝音色。名前に込めた想い、伝わるかな。'
		] },
		gates: { pose: 'relax_wave', wave: true, link: '#gates', label: '入口をえらぶ', text: [
			'気になる入口から入ってみてね！迷ったら、お問い合わせから気軽に声をかけて♪',
			'ママとして？講師として？それとも一緒に何か？あなたに合った入口がきっとあるよ。',
			'最後まで読んでくれてありがとう。「ここ、なんか好き」って思ってもらえたら嬉しいな。'
		] }
	};
	/* タップした時のひとこと */
	var TAPS = [
		'呼んだ？（笑）気になるところがあったら、そのまま下に読み進めてみてね。',
		'ままのおと。は「入会してください」じゃなくて「一緒につくってみない？」なの。',
		'今日もおつかれさま。ママの毎日、ほんとにすごいと思う。',
		'正解なんて、なくていい。変わっていく私を、まるごと楽しもう！',
		'私、栄養士なの。ごはんの相談も大歓迎だよ♪',
		'ちなみに私の右下の×を押すと、静かにしてます。さみしいけど（笑）',
		'質問があったら、お問い合わせから気軽にどうぞ。ちゃんと読んでます！',
		'「やってみたい」って気持ち、小さくても大事にしてね。',
		'講師さんは今14人。それぞれの得意を持ち寄ってくれてるの。',
		'うさこ、わんた、おとちゃんもこのサイトのどこかにいるよ。探してみて♪'
	];

	/* DOM構築 */
	root.innerHTML =
		'<div class="mno-guide-bubble is-out" id="mnoGuideBubble"><span class="name">ともみさん</span><span class="txt"></span><a class="go" hidden></a></div>' +
		'<div class="mno-guide-char" id="mnoGuideChar"><div class="mno-guide-shadow"></div><div class="mno-guide-stage" id="mnoGuideStage"><img alt="" class="a"><img alt="" class="b is-off"></div>' +
		'<button type="button" class="mno-guide-close" id="mnoGuideClose" aria-label="案内を閉じる">×</button></div>';
	var reopen = document.createElement('button');
	reopen.type = 'button'; reopen.className = 'mno-guide-reopen'; reopen.setAttribute('aria-label', '案内を表示');
	document.body.appendChild(reopen);

	var bubble = document.getElementById('mnoGuideBubble');
	var txt = bubble.querySelector('.txt');
	var go = bubble.querySelector('.go');
	var stage = document.getElementById('mnoGuideStage');
	var imgs = stage.querySelectorAll('img');
	var front = 0, curPose = '', curKey = '', typing = null, lastLine = {};

	/* 画像プリロード */
	Object.keys(SCRIPT).forEach(function (k) { var i = new Image(); i.src = base + SCRIPT[k].pose + '.webp'; });

	function pick(key, arr) {
		if (arr.length === 1) return arr[0];
		var i, tries = 0;
		do { i = Math.floor(Math.random() * arr.length); tries++; } while (i === lastLine[key] && tries < 5);
		lastLine[key] = i;
		return arr[i];
	}
	function hop() {
		if (reduce) return;
		stage.classList.remove('is-hop'); void stage.offsetWidth; stage.classList.add('is-hop');
		setTimeout(function () { stage.classList.remove('is-hop'); }, 720);
		sparkle();
	}
	function setPose(pose, wave) {
		if (pose === curPose) return;
		curPose = pose;
		var nxt = imgs[1 - front], cur = imgs[front];
		nxt.src = base + pose + '.webp';
		nxt.classList.remove('is-off'); cur.classList.add('is-off');
		front = 1 - front;
		stage.classList.toggle('is-wave', !!wave && !reduce);
		hop();
	}
	function sparkle() {
		var n = 5, marks = ['✨', '♪', '♡', '✿'];
		for (var i = 0; i < n; i++) {
			var s = document.createElement('span');
			s.className = 'mno-guide-spark'; s.textContent = marks[i % marks.length];
			var ang = (Math.PI * 2 / n) * i + Math.random();
			s.style.setProperty('--dx', Math.cos(ang) * 55 + 'px');
			s.style.setProperty('--dy', Math.sin(ang) * 45 - 30 + 'px');
			s.style.left = '50%'; s.style.top = '40%';
			stage.appendChild(s);
			setTimeout(function (el) { el.remove(); }, 1000, s);
		}
	}
	var sayId = 0;
	function say(text, link, label) {
		var seq = ++sayId;
		if (typing) { clearInterval(typing); typing = null; }
		bubble.classList.add('is-out');
		setTimeout(function () {
			if (seq !== sayId) return; /* 直後に別の台詞が来ていたら捨てる */
			txt.textContent = '';
			if (link) { go.href = link; go.textContent = label + ' →'; go.hidden = false; } else { go.hidden = true; }
			bubble.classList.remove('is-out');
			if (reduce) { txt.textContent = text; return; }
			var i = 0, node = document.createTextNode(''), cur = document.createElement('span');
			cur.className = 'cur';
			txt.appendChild(node); txt.appendChild(cur);
			var timer = setInterval(function () {
				i++;
				node.nodeValue = text.slice(0, i);
				if (i >= text.length) { clearInterval(timer); if (typing === timer) typing = null; setTimeout(function () { cur.remove(); }, 1500); }
			}, 30);
			typing = timer;
		}, 220);
	}
	function show(key) {
		if (key === curKey || !SCRIPT[key]) return;
		curKey = key;
		var s = SCRIPT[key];
		setPose(s.pose, s.wave);
		var line = pick(key, s.text);
		if (key === 'hero' && !lastLine._greeted) { lastLine._greeted = true; line = pick('greet', GREETS) + ' ' + line; }
		say(line, s.link, s.label);
	}

	/* 現在のセクション判定（ビューポート上寄り45%ラインを超えた最後のセクション） */
	var sections = [];
	Object.keys(SCRIPT).forEach(function (k) { var el = document.getElementById(k); if (el) sections.push({ key: k, el: el }); });
	var ticking = false;
	function update() {
		ticking = false;
		var line = window.innerHeight * 0.45, best = sections.length ? sections[0].key : '';
		for (var i = 0; i < sections.length; i++) {
			if (sections[i].el.getBoundingClientRect().top <= line) best = sections[i].key; else break;
		}
		if (best) show(best);
	}
	window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
	window.addEventListener('resize', update);

	/* 同じセクションに長くいる時は、別の台詞に切り替える（45秒ごと） */
	setInterval(function () {
		if (!curKey || root.classList.contains('is-hidden') || document.hidden) return;
		var s = SCRIPT[curKey];
		if (s.text.length > 1) say(pick(curKey, s.text), s.link, s.label);
	}, 45000);

	/* タップでひとこと */
	var tapOrder = TAPS.slice().sort(function () { return Math.random() - 0.5; }), tapIdx = 0;
	document.getElementById('mnoGuideChar').addEventListener('click', function (e) {
		if (e.target.id === 'mnoGuideClose') return;
		hop();
		say(tapOrder[tapIdx++ % tapOrder.length]);
	});
	/* マウスに合わせてほんの少し傾く（PCのみ） */
	if (!reduce && window.matchMedia('(hover:hover)').matches) {
		var charEl = document.getElementById('mnoGuideChar');
		window.addEventListener('mousemove', function (e) {
			var r = charEl.getBoundingClientRect();
			var dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
			charEl.style.transform = 'rotate(' + (dx * -6).toFixed(2) + 'deg)';
		}, { passive: true });
	}

	/* 閉じる／再表示（セッション中は記憶） */
	function hide() { root.classList.add('is-hidden'); reopen.classList.add('is-show'); try { sessionStorage.setItem('mnoGuide', 'off'); } catch (e) {} }
	function open() { root.classList.remove('is-hidden'); reopen.classList.remove('is-show'); try { sessionStorage.removeItem('mnoGuide'); } catch (e) {} curKey = ''; update(); }
	document.getElementById('mnoGuideClose').addEventListener('click', function (e) { e.stopPropagation(); hide(); });
	reopen.addEventListener('click', open);

	var off = false; try { off = sessionStorage.getItem('mnoGuide') === 'off'; } catch (e) {}
	if (off) { root.classList.add('is-hidden'); reopen.classList.add('is-show'); }
	else { setTimeout(update, 400); }
})();
