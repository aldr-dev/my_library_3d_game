// Процедурный звук библиотеки на Web Audio API.
//
// Внешних аудиофайлов нет: все эффекты синтезируются из осцилляторов
// и белого шума. Это даёт мгновенный отклик, нулевой вес и отсутствие
// сетевых запросов.
//
// AudioContext создаётся лениво — только после первого жеста пользователя
// (браузеры блокируют автозапуск звука).

const MUTE_KEY = "library-muted";

interface Engine {
  ctx: AudioContext;
  master: GainNode;
}

let engine: Engine | null = null;
let noiseBuffer: AudioBuffer | null = null;
let ambient: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

let muted =
  typeof window !== "undefined" &&
  window.localStorage.getItem(MUTE_KEY) === "1";

const MASTER_VOLUME = 0.85;

function ensure(): Engine | null {
  if (typeof window === "undefined") return null;

  if (engine) {
    if (engine.ctx.state === "suspended") void engine.ctx.resume();
    return engine;
  }

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  try {
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOLUME;
    master.connect(ctx.destination);
    engine = { ctx, master };
    return engine;
  } catch {
    return null;
  }
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 1.2);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buf;
  return buf;
}

// ---------------------------------------------------------------- примитивы

interface ToneOptions {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  dur: number;
  gain: number;
  delay?: number;
  attack?: number;
}

function playTone(o: ToneOptions): void {
  const e = ensure();
  if (!e || muted) return;
  const { ctx, master } = e;

  const t0 = ctx.currentTime + (o.delay ?? 0);
  const attack = o.attack ?? 0.006;

  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(Math.max(1, o.freq), t0);
  if (o.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, o.freqEnd),
      t0 + o.dur,
    );
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

interface NoiseOptions {
  dur: number;
  gain: number;
  freq: number;
  freqEnd?: number;
  type?: BiquadFilterType;
  q?: number;
  delay?: number;
  attack?: number;
}

function playNoise(o: NoiseOptions): void {
  const e = ensure();
  if (!e || muted) return;
  const { ctx, master } = e;

  const t0 = ctx.currentTime + (o.delay ?? 0);
  const attack = o.attack ?? 0.004;

  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  src.loop = true;
  // случайная точка старта — шаги не звучат одинаково
  const offset = Math.random() * 0.8;

  const filter = ctx.createBiquadFilter();
  filter.type = o.type ?? "bandpass";
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(Math.max(20, o.freq), t0);
  if (o.freqEnd !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, o.freqEnd),
      t0 + o.dur,
    );
  }

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  src.connect(filter).connect(g).connect(master);
  src.start(t0, offset);
  src.stop(t0 + o.dur + 0.05);
}

// ---------------------------------------------------------------- эмбиент

// Тихий гул комнаты: низкочастотный шум + мягкое «дыхание» ламп.
function startAmbient(): void {
  const e = ensure();
  if (!e || ambient || muted) return;
  const { ctx, master } = e;

  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  src.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 180;
  lp.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 2.5);

  // медленная модуляция громкости — «живая» тишина
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.012;
  lfo.connect(lfoGain).connect(gain.gain);
  lfo.start();

  src.connect(lp).connect(gain).connect(master);
  src.start();

  ambient = { src, gain };
}

function stopAmbient(): void {
  if (!ambient) return;
  try {
    ambient.src.stop();
  } catch {
    /* уже остановлен */
  }
  ambient = null;
}

// ---------------------------------------------------------------- публичное API

/** Вызывается по первому клику пользователя — «разбудить» звук. */
export function unlockAudio(): void {
  const e = ensure();
  if (!e) return;
  if (e.ctx.state === "suspended") void e.ctx.resume();
  startAmbient();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  }
  const e = engine;
  if (e) {
    e.master.gain.setTargetAtTime(
      value ? 0 : MASTER_VOLUME,
      e.ctx.currentTime,
      0.05,
    );
  }
  if (value) {
    stopAmbient();
  } else {
    unlockAudio();
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

// ---------------------------------------------------------------- эффекты

/** Шаг по деревянному полу. */
export function playFootstep(running = false): void {
  const v = 0.9 + Math.random() * 0.25;
  playNoise({
    dur: running ? 0.1 : 0.12,
    gain: (running ? 0.075 : 0.05) * v,
    freq: (running ? 900 : 700) * v,
    freqEnd: (running ? 320 : 260) * v,
    type: "bandpass",
    q: 0.9,
  });
  playTone({
    freq: (running ? 96 : 84) * v,
    freqEnd: (running ? 58 : 52) * v,
    type: "sine",
    dur: 0.08,
    gain: running ? 0.05 : 0.032,
  });
}

export function playJump(): void {
  playTone({ freq: 240, freqEnd: 430, type: "sine", dur: 0.13, gain: 0.06 });
  playNoise({ dur: 0.08, gain: 0.03, freq: 900, freqEnd: 1800, q: 0.8 });
}

export function playLand(): void {
  playTone({ freq: 130, freqEnd: 58, type: "sine", dur: 0.18, gain: 0.09 });
  playNoise({
    dur: 0.16,
    gain: 0.07,
    freq: 600,
    freqEnd: 180,
    type: "lowpass",
    q: 0.7,
  });
}

/** Взять книгу — шелест бумаги и лёгкое скольжение по полке. */
export function playPickup(): void {
  playNoise({
    dur: 0.18,
    gain: 0.05,
    freq: 1400,
    freqEnd: 3200,
    type: "bandpass",
    q: 0.8,
  });
  playTone({ freq: 520, freqEnd: 760, type: "triangle", dur: 0.1, gain: 0.03 });
}

/** Вернуть книгу обратно (клавиша Q). */
export function playReturn(): void {
  playNoise({
    dur: 0.16,
    gain: 0.045,
    freq: 2600,
    freqEnd: 900,
    type: "bandpass",
    q: 0.8,
  });
  playTone({ freq: 460, freqEnd: 300, type: "triangle", dur: 0.11, gain: 0.03 });
}

/** Поставить книгу на полку — глухой деревянный стук. */
export function playPlace(): void {
  playTone({ freq: 210, freqEnd: 96, type: "triangle", dur: 0.14, gain: 0.08 });
  playNoise({
    dur: 0.09,
    gain: 0.05,
    freq: 1100,
    freqEnd: 380,
    type: "lowpass",
    q: 0.9,
  });
  playNoise({
    dur: 0.12,
    gain: 0.025,
    freq: 2400,
    freqEnd: 1400,
    type: "bandpass",
    q: 1.2,
    delay: 0.04,
  });
}

/** Действие невозможно (на полке нет места). */
export function playDenied(): void {
  playTone({ freq: 220, type: "square", dur: 0.08, gain: 0.05 });
  playTone({ freq: 150, type: "square", dur: 0.1, gain: 0.05, delay: 0.09 });
}

/** Открыть карточку книги — перелистывание страницы. */
export function playPageFlip(): void {
  playNoise({
    dur: 0.22,
    gain: 0.055,
    freq: 900,
    freqEnd: 3400,
    type: "bandpass",
    q: 0.7,
  });
  playNoise({
    dur: 0.16,
    gain: 0.035,
    freq: 3000,
    freqEnd: 1200,
    type: "bandpass",
    q: 0.9,
    delay: 0.1,
  });
}

/** Открытие панели / модалки. */
export function playUiOpen(): void {
  playTone({ freq: 480, freqEnd: 760, type: "sine", dur: 0.14, gain: 0.04 });
  playNoise({ dur: 0.16, gain: 0.02, freq: 700, freqEnd: 2600, q: 0.7 });
}

/** Закрытие панели / модалки. */
export function playUiClose(): void {
  playTone({ freq: 700, freqEnd: 420, type: "sine", dur: 0.13, gain: 0.035 });
  playNoise({ dur: 0.14, gain: 0.018, freq: 2400, freqEnd: 600, q: 0.7 });
}

/** Книга добавлена в библиотеку — короткий тёплый арпеджио. */
export function playSuccess(): void {
  playTone({ freq: 660, type: "sine", dur: 0.16, gain: 0.05 });
  playTone({ freq: 880, type: "sine", dur: 0.16, gain: 0.045, delay: 0.09 });
  playTone({ freq: 1175, type: "sine", dur: 0.26, gain: 0.04, delay: 0.18 });
}

/** Книга удалена. */
export function playDelete(): void {
  playTone({ freq: 380, freqEnd: 140, type: "triangle", dur: 0.22, gain: 0.05 });
  playNoise({
    dur: 0.24,
    gain: 0.035,
    freq: 2200,
    freqEnd: 400,
    type: "bandpass",
    q: 0.8,
  });
}

/** Ошибка (сеть, БД, валидация). */
export function playError(): void {
  playTone({ freq: 200, freqEnd: 120, type: "sawtooth", dur: 0.2, gain: 0.05 });
  playTone({
    freq: 150,
    freqEnd: 90,
    type: "sawtooth",
    dur: 0.24,
    gain: 0.04,
    delay: 0.1,
  });
}
