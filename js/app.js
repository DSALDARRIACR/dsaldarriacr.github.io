/* =========================================================
   Flores amarillas — app.js
   Jardín generativo en HTML + CSS + JS vanilla.
   Módulos internos: utils · escena · jardín · mensajes ·
                     secuencias · pétalos · audio · consola
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- utilidades ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  /** Espera ms, recortada cuando el sistema pide menos movimiento. */
  const wait = (ms) => new Promise((res) => setTimeout(res, reduced() ? Math.min(ms, 320) : ms));

  const show = (el) => el && el.classList.remove('is-away');
  const hide = (el) => el && el.classList.add('is-away');

  /* ---------------- textos ---------------- */
  const INTRO_LINES = [
    'Hey 👀',
    'Me dijeron que hoy se regalan flores amarillas...',
    'Pero comprar flores era demasiado fácil 😌',
    'Así que mejor las programé.'
  ];

  const FINALE_LINES = [
    { text: 'Feliz día de las flores amarillas 🌻', title: true },
    { text: 'No sabía qué regalarte...' },
    { text: 'así que hice algo que sí sé hacer.' },
    { text: 'Programar cosas innecesariamente complicadas 😂' },
    { text: 'Espero que te saque una sonrisa :)' }
  ];

  const LAST_LINES = [
    { text: 'Gracias por dejarme conocerte un poquito más 🌻', title: true },
    { text: 'Que tengas un bonito día.' }
  ];

  const FLOWER_MESSAGES = [
    'Una flor para alegrarte el día ✨',
    'Espero que hoy tengas un bonito día :)',
    'Esta salió en versión JavaScript 😂',
    'Las otras se marchitan, estas sobreviven mientras exista GitHub 😎',
    'Compiló a la primera... casi.',
    'Flor amarilla.exe ejecutándose correctamente 🌻',
    'Esta flor no necesita agua, solo un navegador 💻',
    'Advertencia: esta flor no se marchita nunca ⚠️'
  ];

  /* ---------------- referencias del DOM ---------------- */
  const dom = {
    body: document.body,
    stars: $('#stars'),
    fireflies: $('#fireflies'),
    intro: $('#intro'),
    introLine: $('#introLine'),
    startBtn: $('#startBtn'),
    skipBtn: $('#skipBtn'),
    garden: $('#garden'),
    field: $('#field'),
    hint: $('#gardenHint'),
    finale: $('#finale'),
    finaleLines: $('#finaleLines'),
    lastBtn: $('#lastBtn'),
    tooltips: $('#tooltips'),
    petalRain: $('#petalRain'),
    audioDock: $('#audioDock'),
    audioBtn: $('#audioBtn'),
    bgm: $('#bgm')
  };

  const state = {
    started: false,
    cancelIntro: false,
    finished: false,
    epilogue: false,
    lastMessage: -1,
    audioFade: null
  };

  /* ---------------- escena: estrellas y luciérnagas ---------------- */
  function buildSky() {
    const area = window.innerWidth * window.innerHeight;
    const starCount = reduced() ? 40 : clamp(Math.round(area / 9000), 50, 130);
    const frag = document.createDocumentFragment();

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('span');
      const size = rand(1, 2.6);
      star.className = 'star';
      star.style.cssText =
        `--x:${rand(0, 100)}%;--y:${rand(0, 82)}%;--sz:${size.toFixed(2)}px;` +
        `--o:${rand(0.35, 0.95).toFixed(2)};--dur:${rand(2.4, 6.5).toFixed(2)}s;` +
        `--delay:${rand(0, 6).toFixed(2)}s`;
      frag.appendChild(star);
    }
    dom.stars.appendChild(frag);

    if (reduced()) return;

    const flyFrag = document.createDocumentFragment();
    const flyCount = window.innerWidth < 640 ? 6 : 10;
    for (let i = 0; i < flyCount; i++) {
      const fly = document.createElement('span');
      fly.className = 'firefly';
      fly.style.cssText =
        `--x:${rand(4, 96)}%;--y:${rand(35, 88)}%;--sz:${rand(6, 13).toFixed(1)}px;` +
        `--dx:${rand(-90, 90).toFixed(0)}px;--dy:${rand(-120, -30).toFixed(0)}px;` +
        `--dur:${rand(7, 14).toFixed(1)}s;--delay:${rand(0, 9).toFixed(1)}s`;
      flyFrag.appendChild(fly);
    }
    dom.fireflies.appendChild(flyFrag);
  }

  /* ---------------- jardín ---------------- */
  function petalRing(count, extraClass) {
    let html = `<div class="bloom__ring ${extraClass}">`;
    for (let i = 0; i < count; i++) {
      html += `<div class="petal" style="--a:${(360 / count) * i}deg;--i:${i}"><i></i></div>`;
    }
    return html + '</div>';
  }

  /**
   * Inclinación de la flor. Al girar sobre su base, la corola se desplaza a los lados,
   * así que las flores de los extremos se inclinan hacia el centro y no se salen.
   */
  function tiltFor(left, spread) {
    const towardsCenter = (50 - left) / 50;
    return rand(-spread, spread) * 0.6 + towardsCenter * spread;
  }

  /** Mide en píxeles la corola que dicta el CSS, para repartir las flores sin que se pisen. */
  function measureBloom() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--bloom-d)';
    dom.field.appendChild(probe);
    const size = probe.offsetWidth || 90;
    probe.remove();
    return size;
  }

  function createFlower(spec) {
    const el = document.createElement('div');
    el.className = `flower flower--${spec.row}`;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Flor amarilla. Actívala para leer un mensaje.');
    el.style.cssText =
      `--left:${spec.left.toFixed(2)}%;--s:${spec.scale.toFixed(2)};` +
      `--tilt:${spec.tilt.toFixed(1)}deg;--bottom:${spec.bottom.toFixed(1)}%;` +
      `--delay:${spec.delay}ms;--sway:${spec.sway.toFixed(2)}deg;` +
      `--sway-dur:${spec.swayDur.toFixed(1)}s;--sway-delay:${spec.delay + 2400}ms`;

    el.innerHTML =
      '<div class="flower__sway">' +
        '<div class="flower__stem"></div>' +
        '<span class="flower__leaf flower__leaf--right"></span>' +
        '<span class="flower__leaf flower__leaf--left"></span>' +
        '<div class="flower__bloom">' +
          '<div class="bloom__glow"></div>' +
          petalRing(spec.outer, 'bloom__ring--outer') +
          petalRing(spec.inner, 'bloom__ring--inner') +
          '<div class="bloom__core"></div>' +
        '</div>' +
      '</div>';

    return el;
  }

  /** Reparte las flores en dos planos y devuelve cuánto tarda el jardín en crecer. */
  function plantGarden() {
    const width = window.innerWidth;
    // el hueco de cada flor debe ser más ancho que su corola: si no, se pisan
    const widest = measureBloom() * 1.28;
    const frontCount = clamp(Math.floor(width / (widest * 1.04)), 3, 9);
    const backCount = clamp(Math.round(frontCount * 0.7), 2, 6);
    const stepBack = reduced() ? 0 : 150;
    const stepFront = reduced() ? 0 : 215;

    const specs = [];
    let delay = 0;

    for (let i = 0; i < backCount; i++) {
      const left = clamp(((i + 0.5) / backCount) * 100 + rand(-4, 4), 4, 96);
      specs.push({
        row: 'back',
        left: left,
        scale: rand(0.5, 0.72),
        tilt: tiltFor(left, 10),
        bottom: rand(2, 10),
        sway: rand(1.4, 2.8),
        swayDur: rand(4.5, 7.5),
        outer: randInt(10, 13),
        inner: randInt(6, 8),
        delay: (delay += stepBack)
      });
    }

    for (let i = 0; i < frontCount; i++) {
      const left = clamp(((i + 0.5) / frontCount) * 100 + rand(-3, 3), 5, 95);
      specs.push({
        row: 'front',
        left: left,
        // alturas alternadas: dos corolas vecinas nunca quedan a la misma altura
        scale: i % 2 ? rand(0.85, 1) : rand(1.06, 1.24),
        tilt: tiltFor(left, 9),
        bottom: rand(-5, 3),
        sway: rand(1.1, 2.4),
        swayDur: rand(4, 7),
        outer: randInt(11, 14),
        inner: randInt(7, 9),
        delay: (delay += stepFront)
      });
    }

    const frag = document.createDocumentFragment();
    specs.forEach((spec) => frag.appendChild(createFlower(spec)));
    dom.field.appendChild(frag);

    console.log('Flores amarillas generadas correctamente 🌻');

    // crecimiento de una flor ≈ 2.6 s + el último retraso de la fila
    return delay + (reduced() ? 400 : 2700);
  }

  /* ---------------- tarjetas flotantes ---------------- */
  function nextMessage() {
    let index;
    do {
      index = randInt(0, FLOWER_MESSAGES.length - 1);
    } while (index === state.lastMessage && FLOWER_MESSAGES.length > 1);
    state.lastMessage = index;
    return FLOWER_MESSAGES[index];
  }

  function popTip(flower) {
    const bloom = $('.flower__bloom', flower);
    if (!bloom) return;

    const tips = dom.tooltips.children;
    while (tips.length > 2) tips[0].remove();

    const rect = bloom.getBoundingClientRect();
    const tip = document.createElement('p');
    tip.className = 'tip';
    tip.setAttribute('role', 'status');
    tip.textContent = nextMessage();
    tip.style.setProperty('--left', `${clamp(rect.left + rect.width / 2, 100, window.innerWidth - 100)}px`);
    tip.style.setProperty('--top', `${clamp(rect.top + rect.height * 0.35, 90, window.innerHeight - 120)}px`);
    dom.tooltips.appendChild(tip);

    requestAnimationFrame(() => tip.classList.add('is-on'));

    setTimeout(() => {
      tip.classList.remove('is-on');
      tip.classList.add('is-off');
      setTimeout(() => tip.remove(), 600);
    }, 3300);

    flower.classList.add('is-poked');
    setTimeout(() => flower.classList.remove('is-poked'), 1800);

    dom.hint.classList.add('is-off');
  }

  function wireFlowerInteraction() {
    const handler = (event) => {
      const flower = event.target.closest('.flower');
      if (!flower) return;
      if (event.type === 'keydown') {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
      }
      popTip(flower);
    };

    dom.field.addEventListener('click', handler);
    dom.field.addEventListener('keydown', handler);
  }

  /* ---------------- lluvia de pétalos ---------------- */
  function makePetal(oneShot) {
    const petal = document.createElement('div');
    const size = rand(9, 17);
    petal.className = 'fpetal';
    petal.style.cssText =
      `--x:${rand(-2, 100).toFixed(1)}%;--sz:${size.toFixed(1)}px;` +
      `--drift:${rand(-16, 16).toFixed(0)}vw;--spin:${rand(2.4, 5.5).toFixed(1)}s;` +
      `--dur:${rand(9, 18).toFixed(1)}s;--delay:${(oneShot ? rand(0, 0.8) : rand(0, 14)).toFixed(1)}s`;
    petal.innerHTML = '<i></i>';

    if (oneShot) {
      petal.style.animationIterationCount = '1';
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
    }
    return petal;
  }

  function startPetalRain() {
    if (reduced()) return;
    const count = window.innerWidth < 640 ? 10 : 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) frag.appendChild(makePetal(false));
    dom.petalRain.appendChild(frag);
  }

  function petalBurst() {
    if (reduced()) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 12; i++) frag.appendChild(makePetal(true));
    dom.petalRain.appendChild(frag);
  }

  /* ---------------- secuencias ---------------- */
  const readingTime = (text) => clamp(1250 + text.length * 48, 1700, 3400);

  async function showIntroLine(text) {
    dom.introLine.classList.remove('is-on');
    await wait(460);
    if (state.cancelIntro) return;
    dom.introLine.textContent = text;
    void dom.introLine.offsetWidth; // reinicia la transición
    dom.introLine.classList.add('is-on');
    await wait(readingTime(text));
  }

  async function runIntro() {
    await wait(700);
    for (const line of INTRO_LINES) {
      if (state.cancelIntro) return;
      await showIntroLine(line);
    }
    if (state.cancelIntro) return;
    show(dom.startBtn);
    dom.startBtn.focus({ preventScroll: true });
  }

  function addFinaleLine(entry) {
    const line = document.createElement('p');
    line.className = 'finale__line' + (entry.title ? ' finale__line--title' : '');
    line.textContent = entry.text;
    dom.finaleLines.appendChild(line);
    requestAnimationFrame(() => line.classList.add('is-on'));
  }

  async function runFinale() {
    if (state.finished) return;
    state.finished = true;

    dom.hint.classList.add('is-off');
    dom.body.classList.add('stage-finale');
    dom.finale.hidden = false;
    requestAnimationFrame(() => dom.finale.classList.add('is-on'));
    startPetalRain();

    await wait(700);
    for (const entry of FINALE_LINES) {
      addFinaleLine(entry);
      await wait(entry.title ? 2000 : 1500);
    }

    await wait(900);
    show(dom.lastBtn);
  }

  async function runEpilogue() {
    if (state.epilogue) return;
    state.epilogue = true;

    hide(dom.lastBtn);
    dom.lastBtn.disabled = true;
    dom.garden.classList.add('is-shining');
    petalBurst();

    await wait(900);
    dom.lastBtn.hidden = true;
    Array.prototype.forEach.call(
      dom.finaleLines.querySelectorAll('.finale__line'),
      (line) => line.classList.remove('is-on')
    );

    await wait(950);
    dom.finaleLines.textContent = '';

    for (const entry of LAST_LINES) {
      addFinaleLine(entry);
      await wait(1700);
    }

    console.log('%c✔ Última función ejecutada sin errores (esta vez sí) 🌻', 'color:#ffc93c');
  }

  function startGarden() {
    if (state.started) return;
    state.started = true;
    state.cancelIntro = true;

    dom.intro.classList.add('is-gone');
    dom.body.classList.add('stage-garden');
    setTimeout(() => { dom.intro.hidden = true; }, 900);

    dom.garden.hidden = false;
    show(dom.audioDock);

    const growMs = plantGarden();
    setTimeout(() => dom.hint.classList.add('is-on'), Math.min(growMs * 0.45, 2800));
    setTimeout(runFinale, growMs + 500);
  }

  /* ---------------- audio opcional ---------------- */
  function fadeAudio(target, done) {
    clearInterval(state.audioFade);
    state.audioFade = setInterval(() => {
      const delta = target > dom.bgm.volume ? 0.04 : -0.04;
      const next = clamp(dom.bgm.volume + delta, 0, 1);
      dom.bgm.volume = next;
      if (Math.abs(next - target) < 0.05) {
        dom.bgm.volume = target;
        clearInterval(state.audioFade);
        if (done) done();
      }
    }, 60);
  }

  function setAudioLabel(playing) {
    dom.audioBtn.textContent = playing ? '🔇 Silenciar' : '🔊 Música';
    dom.audioBtn.setAttribute('aria-pressed', String(playing));
  }

  function disableAudio(message) {
    dom.audioBtn.textContent = message;
    dom.audioBtn.disabled = true;
    setTimeout(() => hide(dom.audioDock), 2600);
  }

  async function toggleAudio() {
    if (!dom.bgm.paused) {
      fadeAudio(0, () => dom.bgm.pause());
      setAudioLabel(false);
      return;
    }
    try {
      dom.bgm.volume = 0;
      await dom.bgm.play();
      setAudioLabel(true);
      fadeAudio(0.35);
    } catch (err) {
      // No hay archivo de audio (o el navegador lo bloquea): la página sigue igual.
      disableAudio('🎧 sin música');
    }
  }

  function wireAudio() {
    dom.bgm.addEventListener('error', () => disableAudio('🎧 sin música'), { once: true });
    dom.audioBtn.addEventListener('click', toggleAudio);
  }

  /* ---------------- consola ---------------- */
  function greetDevTools() {
    const title = 'font-size:15px;font-weight:700;color:#ffc93c;text-shadow:0 0 10px rgba(255,201,60,.5)';
    const body = 'color:#a7b2d2;line-height:1.7;font-size:12px';
    console.log('%c🌻 SISTEMA DE FLORES AMARILLAS', title);
    console.log(
      '%cEstado: ONLINE\nFlores: OK\nSonrisa esperada: 100%\nBugs encontrados: probablemente varios 😂',
      body
    );
    console.log('%cpsst… prueba flores.regar() 👀', 'color:#57b463;font-size:11px');

    window.flores = {
      estado: 'ONLINE',
      regar() {
        petalBurst();
        dom.garden.classList.add('is-shining');
        setTimeout(() => {
          if (!dom.lastBtn.disabled) dom.garden.classList.remove('is-shining');
        }, 4000);
        return 'Regadas 💧 (aunque en realidad no lo necesitan)';
      },
      gracias: () => 'De nada 🌻'
    };
  }

  /* ---------------- arranque ---------------- */
  function init() {
    greetDevTools();
    buildSky();
    wireFlowerInteraction();
    wireAudio();

    dom.startBtn.addEventListener('click', startGarden);
    dom.skipBtn.addEventListener('click', startGarden);
    dom.lastBtn.addEventListener('click', runEpilogue);

    runIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
