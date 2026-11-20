// Nihongo para sa Bisaya — コース1の試作。
// データは data/unit-1-1.json。形は Real Life Bisaya の phrases.json / listening の questions に合わせてある。
// 画面の文は セブアノ語（ceb）と 日本語（ja、確認用）を切り替えられる。セブアノ語の文はすべて要確認。
(() => {
  'use strict';

  const KEY = 'nihongo-bisaya-v1';
  const DAY = 24 * 60 * 60 * 1000;

  const T = {
    ceb: {
      app: 'Nihongo para sa Bisaya', unit: 'Yunit', lessons: 'Mga leksyon', lesson: 'Leksyon', done: 'Human na',
      start: 'Sugdi', next: 'Padayon', home: 'Balik sa sugod', review: 'Balik-tuon', reviewDue: 'pulong nga angay balikan',
      noReview: 'Walay balikan karon.', furi: 'Furigana', lang: '日本語で表示',
      video: 'Video', videoSoon: 'Moabot pa ang video. Sa pagkakaron, basaha ang sitwasyon.',
      newPhrase: 'Bag-ong pulong', scene: 'Sitwasyon', hint: 'Timailhan', meaning: 'Sa Binisaya',
      listen: 'Paminawa', listenAll: 'Paminawa ang tanan', sayAloud: 'Isulti og kusog, tulo ka beses.',
      sayNow: 'Isulti og kusog sa Nihongo, unya tan-awa ang tubag.', show: 'Ipakita ang tubag',
      could: 'Nasulti nako', notYet: 'Wala pa', right: 'Sakto!', wrong: 'Dili pa sakto.', answer: 'Ang sakto',
      why: 'Ngano', more: 'Dugang pasabot', order: 'Pindota ang mga pulong sumala sa han-ay.', check: 'Susiha',
      needAll: 'Ibutang una ang tanang pulong.', undo: 'Balika', pickOne: 'Pilia ang sakto nga isulti.',
      whatHear: 'Paminawa, unya pilia.', report: 'I-report ang sayop', reportPh: 'Unsay sayop? (Binisaya o Nihongo)',
      save: 'I-save', needText: 'Isulat una ang sayop.', saved: 'Na-save. Kopyaha ug ipadala sa Discord.', copy: 'Kopyaha',
      copied: 'Nakopya na.', finished: 'Nahuman nimo ang leksyon!', againCount: 'pulong nga balikan ugma',
      reports: 'Mga report', reset: 'Sugod usab (papasa ang tanan)', resetSure: 'Pindota pag-usab aron papason.',
      storageOff: 'Dili ma-save ang imong progress niining browser.'
    },
    ja: {
      app: 'セブアノ語話者のための日本語', unit: 'ユニット', lessons: 'レッスン', lesson: 'レッスン', done: '完了',
      start: '始める', next: '次へ', home: '最初の画面へ', review: '復習', reviewDue: '個の復習があります',
      noReview: '今日の復習はありません。', furi: 'ふりがな', lang: 'Binisaya',
      video: '動画', videoSoon: '動画は準備中です。今は場面の文を読んでください。',
      newPhrase: '新しいフレーズ', scene: '場面', hint: 'ヒント', meaning: 'セブアノ語',
      listen: '聞く', listenAll: '通して聞く', sayAloud: '声に出して3回言ってください。',
      sayNow: '日本語で声に出してから、答えを見てください。', show: '答えを見る',
      could: '言えた', notYet: 'まだ言えない', right: '正解です。', wrong: 'まだ違います。', answer: '正解',
      why: '理由', more: '解説を見る', order: '言う順番に押してください。', check: '確認する',
      needAll: '先に全部の言葉を並べてください。', undo: '戻す', pickOne: '言うべき言葉を選んでください。',
      whatHear: '聞いてから選んでください。', report: '誤りを報告', reportPh: 'どこが間違っていますか？',
      save: '保存', needText: '先に内容を書いてください。', saved: '保存しました。コピーしてDiscordに送ってください。', copy: 'コピー',
      copied: 'コピーしました。', finished: 'レッスンを終えました。', againCount: '個を明日もう一度復習します',
      reports: '報告', reset: '最初からやり直す（記録を消す）', resetSure: 'もう一度押すと消えます。',
      storageOff: 'このブラウザでは進み具合を保存できません。'
    }
  };

  // ---------- 保存 ----------
  let S = { done: {}, review: {}, set: { furi: false, ui: 'ceb' }, reports: [] };
  let storageOK = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      S = Object.assign(S, p, { set: Object.assign(S.set, p.set || {}) });
    }
  } catch (e) { storageOK = false; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; }
  }
  const t = (k) => T[S.set.ui][k] || T.ceb[k] || k;
  const L = (obj, base) => (obj && (obj[base + '_' + S.set.ui] || obj[base + '_ceb'] || obj[base + '_ja'])) || '';

  // ---------- 小さな道具 ----------
  const app = document.getElementById('app');
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  // null や false を除いて入れる（そのまま渡すと画面に "null" と出るため）
  const clean = (kids) => kids.flat().filter((k) => k != null && k !== false);
  const setKids = (el, ...kids) => el.replaceChildren(...clean(kids));
  const addKids = (el, ...kids) => el.append(...clean(kids));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }

  // ---------- データ ----------
  let D, IT = {}, Q = {}, R = {};
  function index(data) {
    D = data;
    for (const it of D.items) {
      IT[it.id] = it;
      for (const v of it.variants || []) {
        IT[v.id] = Object.assign({ parent: it.id, ceb: it.ceb, hint: it.hint, note_ceb: v.use_ceb, note_ja: v.use_ja, furigana: [] }, v);
      }
    }
    for (const q of D.questions) Q[q.id] = q;
    for (const r of D.roleplays) R[r.id] = r;
  }

  // ---------- 音声 ----------
  let current = null;
  function speakFallback(text, done) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP'; u.rate = 0.9; u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    } catch (e) { done(); }
  }
  function play(id) {
    return new Promise((resolve) => {
      const it = IT[id];
      let finished = false;
      const done = () => { if (!finished) { finished = true; resolve(); } };
      try {
        if (current) current.pause();
        const src = (window.AUDIO_DATA && window.AUDIO_DATA[id]) || it.audio;
        const a = new Audio(src);
        current = a;
        a.onended = done;
        a.onerror = () => speakFallback(it.ja, done);
        const p = a.play();
        if (p && p.catch) p.catch(done);
      } catch (e) { done(); }
    });
  }
  async function playSeq(ids, onEach) {
    for (const id of ids) { if (onEach) onEach(id); await play(id); await new Promise((r) => setTimeout(r, 350)); }
    if (onEach) onEach(null);
  }

  // ---------- 復習（間隔反復） ----------
  const intervals = () => (D.srs && D.srs.intervals_days) || [1, 3, 7, 14, 30];
  const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const baseId = (id) => (IT[id] && IT[id].parent) || id;
  function srsMiss(id) {
    const k = baseId(id);
    S.review[k] = { stage: 0, due: startOfDay(Date.now()) + intervals()[0] * DAY };
    save();
  }
  function srsGrade(id, ok) {
    const k = baseId(id), it = S.review[k];
    if (!it) return;
    if (!ok) { it.stage = 0; it.due = startOfDay(Date.now()) + intervals()[0] * DAY; }
    else if (it.stage + 1 >= intervals().length) delete S.review[k];
    else { it.stage += 1; it.due = startOfDay(Date.now()) + intervals()[it.stage] * DAY; }
    save();
  }
  const dueIds = () => Object.keys(S.review).filter((k) => IT[k] && S.review[k].due <= Date.now());

  // ---------- 部品 ----------
  function jaHTML(it) {
    let s = esc(it.ja);
    for (const f of it.furigana || []) s = s.replace(esc(f.t), `<ruby>${esc(f.t)}<rt>${esc(f.r)}</rt></ruby>`);
    return s;
  }
  function reportBox(id) {
    const box = h('div', { hidden: true });
    const ta = h('textarea', { placeholder: t('reportPh'), 'aria-label': t('report') });
    const msg = h('p', { class: 'err' });
    ta.addEventListener('input', () => { msg.textContent = ''; });
    const saveBtn = h('button', { class: 'small', type: 'button', onclick: () => {
      const text = ta.value.trim();
      if (!text) { msg.className = 'err'; msg.textContent = t('needText'); return; }
      S.reports.push({ id, text, at: new Date().toISOString() }); save();
      const line = `[${id}] ${IT[id].romaji} / ${IT[id].ceb} → ${text}`;
      msg.className = 'muted'; msg.textContent = t('saved');
      const copyBtn = h('button', { class: 'small', type: 'button', onclick: async () => {
        try { await navigator.clipboard.writeText(line); copyBtn.textContent = t('copied'); } catch (e) { ta.value = line; ta.select(); }
      } }, t('copy'));
      saveBtn.replaceWith(copyBtn);
    } }, t('save'));
    box.append(ta, msg, saveBtn);
    const toggle = h('button', { class: 'small', type: 'button', onclick: () => { box.hidden = !box.hidden; } }, t('report'));
    return [toggle, box];
  }
  function phrase(id, opts = {}) {
    const it = IT[id];
    const note = L(it, 'note');
    const [toggle, box] = reportBox(id);
    return h('div', { class: 'phrase', 'data-id': id },
      h('div', { class: 'romaji', lang: 'ja-Latn' }, it.romaji),
      h('div', { class: 'ja', lang: 'ja', html: jaHTML(it) }),
      h('div', { class: 'muted' }, t('meaning') + ': ' + it.ceb),
      opts.note !== false && note ? h('div', { class: 'muted' }, note) : null,
      h('div', { class: 'row' },
        h('button', { class: 'small', type: 'button', onclick: () => play(id) }, t('listen')), toggle),
      box);
  }
  function explainBox(key, open) {
    const ex = D.explanations && D.explanations[key];
    const body = ex && (ex[S.set.ui] || ex.ceb);
    if (!body) return null;
    return h('details', open ? { open: true } : {}, h('summary', {}, t('more') + ': ' + (L(ex, 'title') || key)), h('p', {}, body));
  }
  const sceneText = (o) => [L(o, 'scene'), L(o, 'intent')].filter(Boolean).join(' ');

  // ---------- レッスンの組み立て ----------
  function buildQueue(lesson) {
    const q = [];
    for (const st of lesson.steps) {
      if (st.kind === 'video') {
        q.push({ k: 'video' });
        for (const id of lesson.new_items) q.push({ k: 'learn', id });
      } else if (st.kind === 'choice' || st.kind === 'listening' || st.kind === 'order') {
        for (const id of st.questions) q.push({ k: Q[id].type === 'order' ? 'order' : 'q', q: Q[id] });
      } else if (st.kind === 'speaking') {
        for (const id of st.items || []) q.push({ k: 'speak', seq: [id], hint: st.hint, scene: IT[id] });
        for (const id of st.sequences || []) q.push({ k: 'speak', seq: Q[id].sequence, hint: st.hint, scene: Q[id] });
        for (const id of st.roleplays || []) q.push({ k: 'speak', seq: R[id].sequence, hint: st.hint, scene: R[id] });
      } else if (st.kind === 'listen_through') {
        q.push({ k: 'through', items: st.items, repeat: st.repeat || 1 });
      }
    }
    return q;
  }

  // ---------- 実行 ----------
  let run = null;
  function startRun(title, queue, onFinish) {
    run = { title, queue, i: 0, missed: new Set(), onFinish };
    showCard();
  }
  function nextBtn() {
    return h('button', { class: 'primary', type: 'button', id: 'next', onclick: () => { run.i += 1; showCard(); } }, t('next'));
  }
  function frame(...kids) {
    const pct = Math.round((run.i / run.queue.length) * 100);
    setKids(app, 
      h('div', { class: 'row spread' },
        h('span', { class: 'muted' }, `${run.title}  ${run.i + 1} / ${run.queue.length}`),
        h('button', { class: 'small', type: 'button', onclick: home }, t('home'))),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: `width:${pct}%` })),
      h('div', { class: 'card' }, ...kids));
    window.scrollTo(0, 0);
  }
  function showCard() {
    if (run.i >= run.queue.length) return finish();
    const c = run.queue[run.i];
    ({ video: cardVideo, learn: cardLearn, q: cardChoice, order: cardOrder, speak: cardSpeak, through: cardThrough }[c.k])(c);
  }
  function finish() {
    const n = run.missed.size;
    if (run.onFinish) run.onFinish();
    setKids(app, h('div', { class: 'card' },
      h('h1', {}, t('finished')),
      n ? h('p', {}, `${n} ${t('againCount')}`) : null,
      h('button', { class: 'primary', type: 'button', onclick: home }, t('home'))));
  }
  function miss(id) { run.missed.add(baseId(id)); srsMiss(id); }

  function cardVideo() {
    const v = D.unit.video || {};
    frame(
      h('h2', {}, t('video') + ': ' + (L(v, 'title') || '')),
      v.file ? h('video', { src: v.file, controls: true, playsinline: true, style: 'width:100%;border-radius:8px' })
             : h('p', { class: 'muted' }, t('videoSoon')),
      nextBtn());
  }
  function cardLearn(c) {
    const it = IT[c.id];
    frame(
      h('p', { class: 'muted' }, t('newPhrase')),
      h('p', { class: 'scene' }, sceneText(it)),
      phrase(c.id),
      h('p', {}, t('sayAloud')),
      it.explain ? explainBox(it.explain, true) : null,
      nextBtn());
    play(c.id);
  }
  function cardChoice(c) {
    const q = c.q;
    const listening = q.type === 'info';
    const itemId = q.item || q.audio_item;
    const labels = q.choices || q['choices_' + S.set.ui] || q.choices_ceb;
    const order = shuffle(labels.map((_, i) => i));
    const out = h('div', {});
    const btns = order.map((i) => h('button', { class: 'choice', type: 'button', onclick: () => pick(i) }, labels[i]));
    function pick(i) {
      const ok = i === q.answer;
      btns.forEach((b, n) => {
        b.disabled = true;
        if (order[n] === q.answer) b.classList.add('right');
        else if (order[n] === i) b.classList.add('wrong');
      });
      const trapped = q.traps && q.traps[String(i)];
      if (!ok && itemId) miss(itemId);
      addKids(out, 
        h('p', { class: 'fb ' + (ok ? 'ok' : 'ng') }, ok ? t('right') : t('wrong')),
        L(q, 'why') ? h('p', {}, t('why') + ': ' + L(q, 'why')) : null,
        itemId ? phrase(itemId) : null,
        q.explain ? explainBox(q.explain, !ok || !!trapped) : null,
        nextBtn());
      if (itemId && !listening) play(itemId);
      out.querySelector('#next').focus();
    }
    frame(
      listening
        ? [h('p', { class: 'scene' }, L(q, 'prompt')), h('p', { class: 'muted' }, t('whatHear')),
           h('button', { type: 'button', onclick: () => play(q.audio_item) }, t('listen'))]
        : [h('p', { class: 'muted' }, t('scene')), h('p', { class: 'scene' }, q.item ? sceneText(IT[q.item]) : L(q, 'scene')),
           h('p', { class: 'muted' }, t('pickOne'))],
      h('div', { class: 'stack', style: 'margin-top:12px' }, btns),
      out);
    if (listening) play(q.audio_item);
  }
  function cardOrder(c) {
    const q = c.q;
    let picked = [];
    const pool = shuffle(q.sequence);
    const answerRow = h('div', { class: 'chips', 'aria-label': t('answer') });
    const poolRow = h('div', { class: 'chips' });
    const err = h('p', { class: 'err' });
    const out = h('div', {});
    let locked = false;
    function draw() {
      answerRow.replaceChildren(...picked.map((id, n) => h('button', { type: 'button', disabled: locked, onclick: () => { picked.splice(n, 1); err.textContent = ''; draw(); } }, IT[id].romaji)));
      poolRow.replaceChildren(...pool.filter((id) => !picked.includes(id)).map((id) => h('button', { type: 'button', disabled: locked, onclick: () => { picked.push(id); err.textContent = ''; draw(); } }, IT[id].romaji)));
    }
    const checkBtn = h('button', { class: 'primary', type: 'button', onclick: () => {
      if (picked.length < q.sequence.length) { err.textContent = t('needAll'); return; }
      const ok = picked.every((id, n) => id === q.sequence[n]);
      locked = true; draw(); checkBtn.remove();
      if (!ok) q.sequence.forEach(miss);
      addKids(out, h('p', { class: 'fb ' + (ok ? 'ok' : 'ng') }, ok ? t('right') : t('wrong')),
        ...q.sequence.map((id) => phrase(id, { note: false })), nextBtn());
      playSeq(q.sequence);
    } }, t('check'));
    draw();
    frame(h('p', { class: 'muted' }, t('scene')), h('p', { class: 'scene' }, L(q, 'scene')),
      h('p', { class: 'muted' }, t('order')), answerRow, h('div', { style: 'height:8px' }), poolRow, err, checkBtn, out);
  }
  function cardSpeak(c) {
    const out = h('div', {});
    const showBtn = h('button', { class: 'primary', type: 'button', onclick: () => {
      showBtn.remove();
      const judge = (ok) => {
        if (ok) { if (c.review) c.seq.forEach((id) => srsGrade(id, true)); }
        else c.seq.forEach(miss);
        run.i += 1; showCard();
      };
      addKids(out, ...c.seq.map((id) => phrase(id, { note: c.seq.length === 1 })),
        h('div', { class: 'row' },
          h('button', { class: 'primary', type: 'button', id: 'could', onclick: () => judge(true) }, t('could')),
          h('button', { type: 'button', id: 'notyet', onclick: () => judge(false) }, t('notYet'))));
      playSeq(c.seq);
    } }, t('show'));
    frame(
      h('p', { class: 'muted' }, t('scene')),
      h('p', { class: 'scene' }, sceneText(c.scene)),
      c.hint ? h('p', { class: 'hint' }, t('hint') + ': ' + c.seq.map((id) => IT[id].hint).join('  /  ')) : null,
      h('p', {}, t('sayNow')),
      showBtn, out);
  }
  function cardThrough(c) {
    const ids = [];
    for (let n = 0; n < c.repeat; n++) ids.push(...c.items);
    const list = h('div', {}, c.items.map((id) => phrase(id, { note: false })));
    const mark = (id) => list.querySelectorAll('.phrase').forEach((el) => el.classList.toggle('playing', el.dataset.id === id));
    frame(h('h2', {}, t('listenAll')), h('p', {}, t('sayAloud')),
      h('button', { type: 'button', onclick: () => playSeq(ids, mark) }, t('listen')), list, nextBtn());
  }

  // ---------- 最初の画面 ----------
  function home() {
    if (current) current.pause();
    run = null;
    document.body.classList.toggle('furi', !!S.set.furi);
    document.documentElement.lang = S.set.ui === 'ja' ? 'ja' : 'ceb';
    const due = dueIds();
    let armed = false;
    const resetBtn = h('button', { class: 'small', type: 'button', onclick: () => {
      if (!armed) { armed = true; resetBtn.textContent = t('resetSure'); return; }
      S = { done: {}, review: {}, set: S.set, reports: [] }; save(); home();
    } }, t('reset'));
    setKids(app, 
      h('div', { class: 'row spread' },
        h('h1', {}, t('app')),
        h('button', { class: 'small', type: 'button', onclick: () => { S.set.ui = S.set.ui === 'ceb' ? 'ja' : 'ceb'; save(); home(); } }, t('lang'))),
      storageOK ? null : h('p', { class: 'err' }, t('storageOff')),
      h('div', { class: 'card' },
        h('p', { class: 'muted' }, `${t('unit')} ${D.unit.id}`),
        h('h2', { style: 'margin-top:0' }, L(D.unit, 'title')),
        h('p', {}, L(D.unit, 'cando')),
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: !!S.set.furi, onchange: (e) => { S.set.furi = e.target.checked; save(); document.body.classList.toggle('furi', S.set.furi); } }),
          t('furi'))),
      h('h2', {}, t('review')),
      due.length
        ? h('button', { class: 'lesson primary', type: 'button', onclick: () => startRun(t('review'), due.map((id) => ({ k: 'speak', seq: [id], hint: true, scene: IT[id], review: true }))) },
            `${due.length} ${t('reviewDue')}`)
        : h('p', { class: 'muted' }, t('noReview')),
      h('h2', {}, t('lessons')),
      h('div', { class: 'stack' }, D.lessons.map((ls, n) =>
        h('button', { class: 'lesson', type: 'button', onclick: () => startRun(`${t('lesson')} ${n + 1}`, buildQueue(ls), () => { S.done[ls.id] = Date.now(); save(); }) },
          h('span', {}, `${n + 1}. ${S.set.ui === 'ja' ? ls.title_ja : (ls.title_ceb || ls.title_ja)}`),
          S.done[ls.id] ? h('span', { class: 'badge' }, t('done')) : null))),
      S.reports.length ? h('details', {}, h('summary', {}, `${t('reports')} (${S.reports.length})`),
        ...S.reports.map((r) => h('p', { class: 'muted' }, `[${r.id}] ${r.text}`))) : null,
      h('p', { style: 'margin-top:24px' }, resetBtn));
  }

  // ---------- 起動 ----------
  function boot(data) { index(data); home(); }
  if (window.UNIT_DATA) boot(window.UNIT_DATA);
  else {
    fetch('data/unit-1-1.json').then((r) => r.json()).then(boot).catch(() => {
      setKids(app, h('p', { class: 'err' }, 'data/unit-1-1.json を読み込めませんでした。'));
    });
  }
})();
