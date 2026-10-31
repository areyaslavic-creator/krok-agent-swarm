(() => {
  const workspace = document.createElement('section');
  workspace.id = 'krok-agent-workspace';
  workspace.className = 'relative z-20 max-w-7xl mx-auto mb-16 px-4 sm:px-6';
  workspace.innerHTML = `
    <div class="rounded-3xl border border-[#E05B70]/30 bg-[#151015]/95 p-4 sm:p-6 shadow-2xl shadow-[#A83249]/20">
      <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">
        <div><div class="text-[11px] font-mono uppercase tracking-[0.18em] text-[#E05B70]">KROK BROWSER STUDIO</div><h2 class="mt-2 text-2xl sm:text-3xl font-extrabold font-display">Робоче місце рою агентів</h2><p class="mt-2 text-sm text-[#B9AEB3] max-w-3xl">Працюйте прямо в браузері: редагуйте код простим текстом, спостерігайте взаємодію агентів і одразу бачте результат у візуальному preview. Будь-яке вікно можна розгорнути або згорнути.</p></div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-mono"><span id="studio-state" class="rounded-full border border-white/10 px-3 py-1 text-[#B9AEB3]">Готово</span><button id="studio-run" class="rounded-xl bg-gradient-to-r from-[#A83249] to-[#E05B70] px-4 py-2 font-bold text-white">Запустити рій</button><button id="studio-pause" class="rounded-xl border border-white/15 px-4 py-2 text-white">Пауза</button><button id="studio-publish" class="rounded-xl border border-[#E05B70]/50 px-4 py-2 text-white">GitHub Pages</button></div>
      </div>
      <div class="mb-4 flex flex-col sm:flex-row gap-3"><input id="studio-command" class="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0E0B0E] px-4 py-3 text-sm outline-none focus:border-[#E05B70]" value="Створи сучасний односторінковий сайт для мого бізнесу" placeholder="Напишіть завдання агентам простими словами"><input id="studio-repo" class="w-full sm:w-64 rounded-xl border border-white/10 bg-[#0E0B0E] px-4 py-3 text-sm outline-none focus:border-[#E05B70]" value="areyaslavic-creator/krok-agent-swarm" aria-label="GitHub repository"></div>
      <div id="studio-grid" class="grid gap-4 lg:grid-cols-3">
        <section class="studio-pane rounded-2xl border border-white/10 bg-[#1C1519] overflow-hidden" data-pane="code"><header class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3"><div><span class="font-bold">1. Код / текст</span><span class="ml-2 text-[10px] font-mono text-[#B9AEB3]">EDITABLE</span></div><div class="flex gap-1"><button class="pane-collapse rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="Згорнути">−</button><button class="pane-full rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="На весь екран">□</button></div></header><div class="pane-body p-3"><textarea id="studio-code" spellcheck="false" class="h-[380px] w-full resize-y rounded-xl border border-white/10 bg-[#0B090B] p-3 font-mono text-xs leading-5 text-[#F2DDE2] outline-none focus:border-[#E05B70]"></textarea><div class="mt-3 flex flex-wrap gap-2"><button id="studio-apply" class="rounded-lg bg-[#A83249] px-3 py-2 text-xs font-bold">Застосувати правки</button><button id="studio-reset" class="rounded-lg border border-white/10 px-3 py-2 text-xs">Скинути</button></div></div></section>
        <section class="studio-pane rounded-2xl border border-white/10 bg-[#1C1519] overflow-hidden" data-pane="agents"><header class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3"><div><span class="font-bold">2. Взаємодія агентів</span><span class="ml-2 text-[10px] font-mono text-[#B9AEB3]">LIVE LOG</span></div><div class="flex gap-1"><button class="pane-collapse rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="Згорнути">−</button><button class="pane-full rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="На весь екран">□</button></div></header><div class="pane-body p-3"><div id="studio-agents" class="mb-3 grid grid-cols-2 gap-2"></div><div id="studio-log" class="h-[244px] overflow-auto rounded-xl border border-white/10 bg-[#0B090B] p-3 font-mono text-xs leading-5 text-[#B9AEB3]" aria-live="polite"></div></div></section>
        <section class="studio-pane rounded-2xl border border-white/10 bg-[#1C1519] overflow-hidden" data-pane="preview"><header class="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3"><div><span class="font-bold">3. Візуальний preview</span><span class="ml-2 text-[10px] font-mono text-[#B9AEB3]">ONLINE</span></div><div class="flex gap-1"><button id="studio-refresh" class="rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="Оновити preview">↻</button><button class="pane-collapse rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="Згорнути">−</button><button class="pane-full rounded-lg px-2 py-1 text-xs text-[#B9AEB3]" title="На весь екран">□</button></div></header><div class="pane-body p-3"><iframe id="studio-preview" class="h-[380px] w-full rounded-xl border border-white/10 bg-white" title="Візуальний preview сайту" sandbox="allow-scripts"></iframe><div class="mt-3 text-xs text-[#B9AEB3]">Зміни в текстовому редакторі застосовуються до preview без перезавантаження сторінки.</div></div></section>
      </div>
      <div id="studio-notice" class="mt-4 hidden rounded-xl border border-[#A83249]/40 bg-[#24151C] p-3 text-sm text-[#DCC2C8]" aria-live="polite"></div>
    </div>`;

  const hero = document.querySelector('#hero');
  if (hero) hero.insertAdjacentElement('afterend', workspace);
  const studioStyle = document.createElement('style');
  studioStyle.textContent = `.studio-pane.is-collapsed .pane-body{display:none}.studio-pane.is-fullscreen{position:fixed;inset:16px;z-index:9999;background:#151015;box-shadow:0 20px 80px rgba(0,0,0,.75);overflow:auto}.studio-pane.is-fullscreen .pane-body{display:block}.studio-pane.is-fullscreen .pane-body iframe,.studio-pane.is-fullscreen .pane-body textarea{height:calc(100vh - 150px)}@media(max-width:900px){.studio-pane.is-fullscreen{inset:8px}.studio-pane.is-fullscreen .pane-body iframe,.studio-pane.is-fullscreen .pane-body textarea{height:calc(100vh - 125px)}}`;
  document.head.appendChild(studioStyle);

  const defaultCode = `<main style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:48px 24px;color:#23151b;background:#fff7f8;border-radius:20px"><p style="color:#a83249;font-weight:700;letter-spacing:.08em">YOUR BRAND</p><h1 style="font-size:42px;line-height:1.05;margin:16px 0">Ваш сайт починається тут</h1><p style="font-size:18px;line-height:1.5;color:#644f57">Змініть цей текст у вікні редактора. Preview оновиться одразу після натискання «Застосувати правки».</p><button style="border:0;border-radius:999px;background:#a83249;color:white;padding:13px 20px;font-weight:700">Зв'язатися</button></main>`;
  const code = document.querySelector('#studio-code');
  const preview = document.querySelector('#studio-preview');
  const log = document.querySelector('#studio-log');
  const state = document.querySelector('#studio-state');
  const notice = document.querySelector('#studio-notice');
  const runButton = document.querySelector('#studio-run');
  const pauseButton = document.querySelector('#studio-pause');
  const agentsEl = document.querySelector('#studio-agents');
  code.value = localStorage.getItem('krok-studio-code') || defaultCode;

  const agents = [['dispatcher','Диспетчер'],['researcher','Дослідник'],['analyst','Аналітик'],['developer','Розробник'],['validator','Перевіряльник'],['publisher','Видавець']];
  let running = false; let paused = false; let step = 0; let timer = null;
  agentsEl.innerHTML = agents.map(([id, name]) => `<div data-agent-card="${id}" class="rounded-xl border border-white/10 bg-[#251A20] p-2 text-xs"><span data-agent-dot="${id}" class="mr-2 inline-block h-2 w-2 rounded-full bg-white/20"></span>${name}<div data-agent-state="${id}" class="mt-1 text-[10px] text-[#B9AEB3]">очікує</div></div>`).join('');

  function safe(value) { return String(value).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[ch])); }
  function setPreview() { localStorage.setItem('krok-studio-code', code.value); preview.srcdoc = code.value; }
  function writeLog(text) { log.insertAdjacentHTML('beforeend', `<div><span class="text-[#E05B70]">›</span> ${safe(text)}</div>`); log.scrollTop = log.scrollHeight; }
  function setNotice(text) { notice.classList.remove('hidden'); notice.innerHTML = text; }
  function setAgent(id, active, done) { const dot = document.querySelector(`[data-agent-dot="${id}"]`); const label = document.querySelector(`[data-agent-state="${id}"]`); if (dot) dot.className = `mr-2 inline-block h-2 w-2 rounded-full ${active ? 'bg-[#E05B70] animate-pulse' : done ? 'bg-emerald-400' : 'bg-white/20'}`; if (label) label.textContent = active ? 'працює…' : done ? 'готово' : 'очікує'; }
  function resetAgents() { agents.forEach(([id]) => setAgent(id, false, false)); }
  function finish() { running = false; paused = false; state.textContent = 'Готово'; state.className = 'rounded-full border border-emerald-400/30 px-3 py-1 text-emerald-300'; runButton.textContent = 'Запустити рій'; }
  function tick() { if (!running || paused) return; if (step >= agents.length) { finish(); writeLog('Рій завершив роботу. Перевірте preview і натисніть GitHub Pages для публікації через Actions.'); return; } const [id, name] = agents[step]; if (step > 0) setAgent(agents[step - 1][0], false, true); setAgent(id, true, false); writeLog(`${name}: ${id === 'researcher' ? 'аналізує дозволені публічні джерела' : id === 'developer' ? 'готує зміни для preview' : id === 'publisher' ? 'підготував deployment-запит' : 'виконує етап задачі'}`); step += 1; timer = setTimeout(tick, 900); }

  setPreview(); resetAgents();
  document.querySelector('#studio-apply').addEventListener('click', () => { setPreview(); setNotice('Правки застосовано до живого preview. Роботу рою можна продовжити кнопкою «Запустити рій».'); });
  document.querySelector('#studio-reset').addEventListener('click', () => { code.value = defaultCode; setPreview(); });
  document.querySelector('#studio-refresh').addEventListener('click', setPreview);
  runButton.addEventListener('click', () => { if (running) return; running = true; paused = false; step = 0; resetAgents(); log.innerHTML = ''; state.textContent = 'Працює'; state.className = 'rounded-full border border-[#E05B70]/40 px-3 py-1 text-[#F29AAA]'; writeLog(`Команда: ${document.querySelector('#studio-command').value}`); tick(); });
  pauseButton.addEventListener('click', () => { if (!running) return; paused = !paused; state.textContent = paused ? 'Призупинено' : 'Працює'; pauseButton.textContent = paused ? 'Продовжити' : 'Пауза'; writeLog(paused ? 'Роботу призупинено. Правки можна внести у вікні коду.' : 'Роботу продовжено.'); if (!paused) tick(); });
  document.querySelector('#studio-publish').addEventListener('click', () => { const repo = safe(document.querySelector('#studio-repo').value || 'areyaslavic-creator/krok-agent-swarm'); setNotice(`Підготовлено публікацію для <strong>${repo}</strong>. GitHub Pages запускається через Actions, щоб токен залишався на сервері. <a class="ml-1 text-[#F29AAA] underline" href="https://github.com/${repo}/actions/workflows/generated-content-pages.yml" target="_blank" rel="noreferrer">Відкрити workflow</a>`); writeLog('Видавець: відкрийте workflow і натисніть Run workflow для безпечного деплою.'); });

  document.querySelectorAll('.pane-collapse').forEach(button => button.addEventListener('click', () => { const pane = button.closest('.studio-pane'); pane.classList.toggle('is-collapsed'); button.textContent = pane.classList.contains('is-collapsed') ? '+' : '−'; }));
  document.querySelectorAll('.pane-full').forEach(button => button.addEventListener('click', () => { const pane = button.closest('.studio-pane'); pane.classList.toggle('is-fullscreen'); button.textContent = pane.classList.contains('is-fullscreen') ? '×' : '□'; }));
})();
