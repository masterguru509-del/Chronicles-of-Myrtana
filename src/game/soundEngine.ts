// ============================================================
// GOTHIC 3 CLEAN & PLEASANT AUDIO ENGINE
// - Спокойная приятная фоновая мелодия (арфа/лютня и мягкие тёплые струнные)
// - Строгая защита от наложения звуков (ни один звук фауны не перебивает другой)
// - Отдельные реалистичные звуки: лай волка, вой волка на луну, рык медведя,
//   ржание/фырканье лошади, пение птиц, удары мечом
// - Голосовая озвучка диалогов персонажей (Web Speech API ru-RU с индивидуальными тембрами)
// ============================================================

export type MusicMood = 'dawn' | 'day' | 'evening' | 'night';

export class GothicSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private currentMood: MusicMood = 'day';
  private isMuted = false;
  private volume = 0.75;
  private isPaused = false;
  private isDialogActive = false;

  private schedulerTimer: number | null = null;
  private stepIndex = 0;

  // Строгий мьютекс (блокировка), чтобы звуки животных и природы НИКОГДА не накладывались друг на друга
  private sfxBusyUntil = 0;
  private lastAnimalSoundTime = 0;
  private lastBirdTime = 0;
  private lastWolfHowlTime = 0;

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Тихая, умиротворяющая фоновая мелодия
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.36;
    this.musicGain.connect(this.masterGain);

    // Канал для уместных звуков мира и меча
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.65;
    this.sfxGain.connect(this.masterGain);

    this.startMelodyScheduler();
  }

  private canPlayWorldSound(minGap = 1.8): boolean {
    if (!this.ctx || this.isMuted || this.isPaused || this.isDialogActive) return false;
    const now = this.ctx.currentTime;
    return now >= this.sfxBusyUntil && now - this.lastAnimalSoundTime >= minGap;
  }

  private lockWorldSound(duration: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.sfxBusyUntil = Math.max(this.sfxBusyUntil, now + duration);
    this.lastAnimalSoundTime = now;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopDialogVoice();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.15);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.stopDialogVoice();
    }
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(paused ? 0.1 : 0.36, now, 0.25);
  }

  // ============================================================
  // ОЗВУЧКА ДИАЛОГОВ ПЕРСОНАЖЕЙ ВЫСШЕГО УРОВНЯ (Google Gemini 3.8 Studio Neural TTS + Кэш + Studio EQ)
  // ============================================================
  private ttsBufferCache = new Map<string, AudioBuffer>();
  private ttsInFlight = new Map<string, Promise<AudioBuffer | null>>();
  private activeVoiceSource: AudioBufferSourceNode | null = null;
  private currentSpeakId = 0;
  private prefetchQueue: { npcKey: string; text: string }[] = [];
  private isProcessingPrefetch = false;
  private activePriorityRequests = 0;

  private isFemaleRole(npcKey: string): boolean {
    return npcKey === 'healer' || npcKey === 'female' || npcKey.startsWith('female_');
  }

  // Фоновая очередь предзагрузки (обрабатывает по 1 реплике за раз и уступает приоритет активной речи)
  public prefetchDialog(npcKey: string, text: string) {
    const clean = text.trim();
    if (!clean) return;
    const key = `${npcKey}::${clean}`;
    if (this.ttsBufferCache.has(key) || this.ttsInFlight.has(key)) return;
    if (this.prefetchQueue.some((item) => item.npcKey === npcKey && item.text === clean)) return;

    this.prefetchQueue.push({ npcKey, text: clean });
    void this.processPrefetchQueue();
  }

  private async processPrefetchQueue() {
    if (this.isProcessingPrefetch) return;
    this.isProcessingPrefetch = true;
    try {
      while (this.prefetchQueue.length > 0) {
        if (this.activePriorityRequests > 0) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        const item = this.prefetchQueue.shift();
        if (!item) break;
        const key = `${item.npcKey}::${item.text}`;
        if (!this.ttsBufferCache.has(key) && !this.ttsInFlight.has(key)) {
          await this.fetchAndDecodeNeuralTts(item.npcKey, item.text, false);
          await new Promise((r) => setTimeout(r, 120));
        }
      }
    } finally {
      this.isProcessingPrefetch = false;
    }
  }

  private async fetchAndDecodeNeuralTts(
    npcKey: string,
    cleanText: string,
    isPriority = true
  ): Promise<AudioBuffer | null> {
    const key = `${npcKey}::${cleanText}`;
    const existing = this.ttsBufferCache.get(key);
    if (existing) return existing;

    const inFlight = this.ttsInFlight.get(key);
    if (inFlight) return inFlight;

    if (isPriority) {
      this.activePriorityRequests++;
    }

    const promise = (async (): Promise<AudioBuffer | null> => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ npcKey, text: cleanText }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.audioBase64) return null;

        this.init();
        if (!this.ctx) return null;

        const binary = window.atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
        if (this.ttsBufferCache.size >= 10) {
          const oldestKey = this.ttsBufferCache.keys().next().value;
          if (oldestKey) this.ttsBufferCache.delete(oldestKey);
        }
        this.ttsBufferCache.set(key, audioBuffer);
        return audioBuffer;
      } catch {
        return null;
      } finally {
        if (isPriority) {
          this.activePriorityRequests = Math.max(0, this.activePriorityRequests - 1);
        }
        this.ttsInFlight.delete(key);
      }
    })();

    this.ttsInFlight.set(key, promise);
    return promise;
  }

  private playNeuralBufferThroughStudioChain(
    buffer: AudioBuffer,
    speakerKey: string
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ctx || !this.masterGain || this.isMuted) {
        resolve();
        return;
      }

      if (this.activeVoiceSource) {
        try {
          this.activeVoiceSource.stop();
          this.activeVoiceSource.disconnect();
        } catch {
          // ignore if already stopped
        }
        this.activeVoiceSource = null;
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      // Главный Герой (hero) имеет свой звонкий, молодой и энергичный тембр (rate: 1.05, detune: +55),
      // а каждый мужской персонаж — свой индивидуальный баритон/бас и темп речи!
      const studioProfiles: Record<
        string,
        {
          rate: number;
          detune: number;
          lowFreq: number;
          lowGain: number;
          midFreq: number;
          midGain: number;
        }
      > = {
        hero: { rate: 1.05, detune: 55, lowFreq: 215, lowGain: 1.8, midFreq: 2950, midGain: 2.6 },
        trader: { rate: 0.98, detune: -45, lowFreq: 185, lowGain: 3.0, midFreq: 2620, midGain: 2.4 },
        elder: { rate: 0.94, detune: -75, lowFreq: 170, lowGain: 3.5, midFreq: 2480, midGain: 2.2 },
        smith: { rate: 0.93, detune: -95, lowFreq: 162, lowGain: 3.8, midFreq: 2420, midGain: 2.2 },
        hunter: { rate: 0.97, detune: -35, lowFreq: 180, lowGain: 2.9, midFreq: 2580, midGain: 2.3 },
        guard: { rate: 0.95, detune: -65, lowFreq: 172, lowGain: 3.3, midFreq: 2520, midGain: 2.3 },
        woodcutter: { rate: 0.94, detune: -80, lowFreq: 168, lowGain: 3.5, midFreq: 2480, midGain: 2.2 },
        fisherman: { rate: 0.96, detune: -55, lowFreq: 176, lowGain: 3.1, midFreq: 2540, midGain: 2.3 },
        mage_fire: { rate: 0.95, detune: -70, lowFreq: 170, lowGain: 3.4, midFreq: 2550, midGain: 2.4 },
        mage_water: { rate: 0.94, detune: -60, lowFreq: 175, lowGain: 3.2, midFreq: 2500, midGain: 2.3 },
        mage_air: { rate: 0.99, detune: -25, lowFreq: 190, lowGain: 2.7, midFreq: 2680, midGain: 2.4 },
        mage_earth: { rate: 0.91, detune: -105, lowFreq: 158, lowGain: 3.9, midFreq: 2380, midGain: 2.2 },
        mage_necro: { rate: 0.92, detune: -90, lowFreq: 164, lowGain: 3.6, midFreq: 2440, midGain: 2.3 },
        cobbler: { rate: 0.98, detune: -40, lowFreq: 182, lowGain: 2.9, midFreq: 2600, midGain: 2.4 },
        cook: { rate: 0.95, detune: -68, lowFreq: 172, lowGain: 3.4, midFreq: 2520, midGain: 2.3 },
        stablehand: { rate: 0.97, detune: -48, lowFreq: 178, lowGain: 3.0, midFreq: 2560, midGain: 2.3 },
        worker: { rate: 0.93, detune: -85, lowFreq: 165, lowGain: 3.7, midFreq: 2450, midGain: 2.2 },
        healer: { rate: 1.01, detune: 25, lowFreq: 230, lowGain: 1.6, midFreq: 2950, midGain: 2.4 },
        female: { rate: 1.01, detune: 25, lowFreq: 230, lowGain: 1.6, midFreq: 2950, midGain: 2.4 },
      };

      const eq = studioProfiles[speakerKey] || studioProfiles.trader;
      source.playbackRate.value = eq.rate;
      if (source.detune) {
        source.detune.value = eq.detune;
      }

      // 1. Тёплый грудной резонанс студийного микрофона (без искажения формант)
      const warmthFilter = this.ctx.createBiquadFilter();
      warmthFilter.type = 'lowshelf';
      warmthFilter.frequency.value = eq.lowFreq;
      warmthFilter.gain.value = eq.lowGain;

      // 2. Студийная разборчивость дикции и присутствие
      const presenceFilter = this.ctx.createBiquadFilter();
      presenceFilter.type = 'peaking';
      presenceFilter.frequency.value = eq.midFreq;
      presenceFilter.Q.value = 1.1;
      presenceFilter.gain.value = eq.midGain;

      const voiceGain = this.ctx.createGain();
      voiceGain.gain.value = 1.28;

      source.connect(warmthFilter);
      warmthFilter.connect(presenceFilter);
      presenceFilter.connect(voiceGain);
      voiceGain.connect(this.masterGain);

      this.activeVoiceSource = source;
      source.onended = () => {
        if (this.activeVoiceSource === source) {
          this.activeVoiceSource = null;
        }
        resolve();
      };
      source.start(0);
    });
  }

  private async speakSingleLineInternal(
    speakId: number,
    speakerKey: string,
    text: string,
    actorLabel: string,
    onStatusChange?: (status: string) => void
  ): Promise<void> {
    if (speakId !== this.currentSpeakId || !this.isDialogActive || this.isMuted) {
      return;
    }

    const cleanText = text.trim();
    if (!cleanText) return;

    const cacheKey = `${speakerKey}::${cleanText}`;
    const cachedBuffer = this.ttsBufferCache.get(cacheKey);
    const genderBadge = this.isFemaleRole(speakerKey) ? 'Женский голос' : 'Мужской голос';

    if (cachedBuffer) {
      onStatusChange?.(
        `${actorLabel} • 🎙️ Студийный ${genderBadge} Google Gemini 3.8 (24 кГц)`
      );
      await this.playNeuralBufferThroughStudioChain(cachedBuffer, speakerKey);
      return;
    }

    onStatusChange?.(`${actorLabel} • ✨ Синтез студийного голоса Google Gemini AI...`);
    const buffer = await this.fetchAndDecodeNeuralTts(speakerKey, cleanText, true);

    if (speakId !== this.currentSpeakId || !this.isDialogActive || this.isMuted) {
      return;
    }

    if (buffer) {
      onStatusChange?.(
        `${actorLabel} • 🎙️ Студийный ${genderBadge} Google Gemini 3.8 (24 кГц)`
      );
      await this.playNeuralBufferThroughStudioChain(buffer, speakerKey);
    } else {
      onStatusChange?.(`${actorLabel} • 🔊 Студийный голос ru-RU (${genderBadge})`);
      await this.speakFallbackBrowserRussian(speakerKey, cleanText);
    }
  }

  public speakDialog(
    npcKey: string,
    text: string,
    onStatusChange?: (status: string) => void,
    actorLabel = '💬 Персонаж'
  ) {
    this.isDialogActive = true;
    const speakId = ++this.currentSpeakId;

    // Приглушаем фоновую мелодию во время речи персонажа, чтобы студийный голос звучал кристально чисто
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.18);
    }

    if (this.isMuted || typeof window === 'undefined') {
      return;
    }

    // Останавливаем предыдущую дорожку
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // ignore
      }
      this.activeVoiceSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const label = npcKey === 'hero' ? '🗣️ Говорит ваш Герой' : actorLabel;
    void this.speakSingleLineInternal(speakId, npcKey, text, label, onStatusChange);
  }

  // Полноценный живой диалог как в Gothic 3 / Two Worlds:
  // Сначала вслух звучит фраза ВАШЕГО ГЕРОЯ, а сразу после неё — ответ NPC!
  public speakHeroAndNpc(
    npcKey: string,
    npcName: string,
    heroText: string,
    npcReplyText: string,
    onStatusChange?: (status: string) => void,
    onSpeakerChange?: (speaker: 'hero' | 'npc' | 'idle') => void
  ) {
    this.isDialogActive = true;
    const speakId = ++this.currentSpeakId;

    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.18);
    }

    if (this.isMuted || typeof window === 'undefined') {
      return;
    }

    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // ignore
      }
      this.activeVoiceSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Параллельно запускаем приоритетную подготовку ответа NPC, чтобы после фразы Героя ответ начался мгновенно!
    void this.fetchAndDecodeNeuralTts(npcKey, npcReplyText.trim(), true);

    void (async () => {
      onSpeakerChange?.('hero');
      await this.speakSingleLineInternal(
        speakId,
        'hero',
        heroText,
        '🗣️ Говорит ваш Герой',
        onStatusChange
      );

      if (speakId !== this.currentSpeakId || !this.isDialogActive || this.isMuted) {
        return;
      }

      // Короткая естественная пауза между репликой героя и ответом собеседника
      await new Promise((r) => setTimeout(r, 140));

      if (speakId !== this.currentSpeakId || !this.isDialogActive || this.isMuted) {
        return;
      }

      onSpeakerChange?.('npc');
      await this.speakSingleLineInternal(
        speakId,
        npcKey,
        npcReplyText,
        `💬 Отвечает ${npcName}`,
        onStatusChange
      );

      if (speakId === this.currentSpeakId) {
        onSpeakerChange?.('idle');
      }
    })();
  }

  private speakFallbackBrowserRussian(npcKey: string, text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window) || this.isMuted) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';

      const isFemale = this.isFemaleRole(npcKey);
      const voices = window.speechSynthesis.getVoices();
      const ruVoices = voices.filter((v) => v.lang.toLowerCase().includes('ru'));

      if (ruVoices.length > 0) {
        const femalePattern = /irina|svetlana|dariya|daria|milena|katya|ekaterina|elena|alyona|anna|tatyana|female|жен/i;
        const maleNaturalPattern = /dmitry|pavel|yuri|maxim|aleksandr|artem|boris|denis|ivan|male|муж/i;

        if (isFemale) {
          // Для женских персонажей выбираем женский голос
          const femaleVoice =
            ruVoices.find((v) => femalePattern.test(v.name) && /natural|online|google/i.test(v.name)) ||
            ruVoices.find((v) => femalePattern.test(v.name)) ||
            ruVoices[0];
          utterance.voice = femaleVoice;
        } else {
          // Для ВСЕХ мужских персонажей всегда выбираем ЛУЧШИЙ живой нейро-голос №1 (rankedMaleVoices[0]),
          // тот же самый эталонный движок, которым говорит Главный Герой (чтобы никогда не включался
          // вторичный системный роботизированный синтезатор!).
          const nonFemaleVoices = ruVoices.filter((v) => !femalePattern.test(v.name));
          const pool = nonFemaleVoices.length > 0 ? nonFemaleVoices : ruVoices;
          const bestMaleVoice =
            pool.find((v) => maleNaturalPattern.test(v.name) && /natural|online/i.test(v.name)) ||
            pool.find((v) => maleNaturalPattern.test(v.name)) ||
            pool.find((v) => /google.*рус/i.test(v.name)) ||
            pool.find((v) => /natural|online/i.test(v.name)) ||
            pool[0];
          utterance.voice = bestMaleVoice;
        }
      }

      // Главный Герой (hero) говорит звонким, молодым и энергичным голосом ({ pitch: 1.08, rate: 1.05 }),
      // а каждый отвечающий мужской персонаж имеет свой собственный более глубокий баритон/бас (0.79–0.93),
      // при этом используется ТОТ ЖЕ лучший живой нейро-голос (bestMaleVoice), без переключения на старый системный робот!
      const voiceProfiles: Record<string, { pitch: number; rate: number }> = {
        hero: { pitch: 1.08, rate: 1.05 },
        trader: { pitch: 0.93, rate: 0.99 },
        elder: { pitch: 0.83, rate: 0.92 },
        smith: { pitch: 0.79, rate: 0.90 },
        hunter: { pitch: 0.91, rate: 0.97 },
        guard: { pitch: 0.86, rate: 0.94 },
        woodcutter: { pitch: 0.81, rate: 0.92 },
        fisherman: { pitch: 0.89, rate: 0.95 },
        mage_fire: { pitch: 0.84, rate: 0.94 },
        mage_water: { pitch: 0.86, rate: 0.93 },
        mage_air: { pitch: 0.94, rate: 0.98 },
        mage_earth: { pitch: 0.77, rate: 0.89 },
        mage_necro: { pitch: 0.80, rate: 0.91 },
        cobbler: { pitch: 0.92, rate: 0.98 },
        cook: { pitch: 0.85, rate: 0.95 },
        stablehand: { pitch: 0.90, rate: 0.96 },
        worker: { pitch: 0.82, rate: 0.92 },
        healer: { pitch: 1.08, rate: 1.01 },
        female: { pitch: 1.08, rate: 1.01 },
      };
      const profile = voiceProfiles[npcKey] || voiceProfiles.trader;
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = Math.min(1, this.volume * 1.15);

      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };

      const maxTimeoutMs = Math.max(2500, text.length * 95);
      const timer = setTimeout(finish, maxTimeoutMs);

      utterance.onend = () => {
        clearTimeout(timer);
        finish();
      };
      utterance.onerror = () => {
        clearTimeout(timer);
        finish();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stopDialogVoice() {
    this.isDialogActive = false;
    this.currentSpeakId++;
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch {
        // ignore
      }
      this.activeVoiceSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.ctx && this.musicGain && !this.isPaused) {
      this.musicGain.gain.setTargetAtTime(0.36, this.ctx.currentTime, 0.35);
    }
  }

  // ============================================================
  // ПРИЯТНАЯ ФОНОВАЯ МЕЛОДИЯ (Мягкая лютня/арфа и тёплые струнные без резких звуков)
  // ============================================================
  private playWarmPad(freq: number, duration: number, vol = 0.045) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.002, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + duration * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  private playGentleLute(freq: number, duration = 2.0, vol = 0.055) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(360, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private startMelodyScheduler() {
    if (this.schedulerTimer !== null) return;
    // Спокойный, размеренный шаг мелодии (раз в 950 мс — без спешки и нагромождения нот)
    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.isPaused) return;
      this.tickPleasantMelody();
    }, 950);
  }

  private tickPleasantMelody() {
    this.stepIndex = (this.stepIndex + 1) % 16;
    const step = this.stepIndex;

    // Приятная пасторальная гармония в стиле мирной Миртаны
    const chords = [
      [146.83, 220.0, 293.66], // Dm
      [174.61, 261.63, 349.23], // Fmaj
      [130.81, 196.0, 261.63], // Cmaj
      [146.83, 220.0, 329.63], // Dm9
    ];

    // Мягкий аккорд раз в 4 такта
    if (step % 4 === 0) {
      const chord = chords[Math.floor(step / 4) % chords.length];
      const padPitchMul = this.currentMood === 'night' ? 0.75 : 1.0;
      chord.forEach((f) => this.playWarmPad(f * padPitchMul, 3.8, 0.04));
    }

    // Одиночные переборы лютни/арфы (по одной ноте, чтобы никогда не накладывались)
    const melodyNotes = [
      293.66, 349.23, 440.0, 392.0,
      349.23, 293.66, 261.63, 329.63,
      293.66, 440.0, 523.25, 440.0,
      392.0, 349.23, 329.63, 293.66,
    ];
    if (step % 2 === 0 || step % 4 === 3) {
      const note = melodyNotes[step % melodyNotes.length];
      this.playGentleLute(note, 2.1, 0.052);
    }
  }

  // ============================================================
  // БОЕВЫЕ ЗВУКИ МЕЧА (Чёткие и лаконичные)
  // ============================================================
  public playSwordSwing() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.14);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSwordHit() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Сочный глухой удар клинка по цели + лёгкий звон стали
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(145, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(42, now + 0.16);
    bodyGain.gain.setValueAtTime(0.2, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.sfxGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.19);

    const ringOsc = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(1120 + Math.random() * 180, now);
    ringGain.gain.setValueAtTime(0.055, now);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    ringOsc.connect(ringGain);
    ringGain.connect(this.sfxGain);
    ringOsc.start(now);
    ringOsc.stop(now + 0.15);
  }

  public playSwordDraw(sheathe = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(sheathe ? 1100 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(sheathe ? 360 : 1650, now + 0.18);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playBowDraw() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.linearRampToValueAtTime(210, now + 0.22);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBowRelease() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Тетива + свист стрелы
    const stringOsc = this.ctx.createOscillator();
    const stringGain = this.ctx.createGain();
    stringOsc.type = 'triangle';
    stringOsc.frequency.setValueAtTime(260, now);
    stringOsc.frequency.exponentialRampToValueAtTime(92, now + 0.14);
    stringGain.gain.setValueAtTime(0.12, now);
    stringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    stringOsc.connect(stringGain);
    stringGain.connect(this.sfxGain);
    stringOsc.start(now);
    stringOsc.stop(now + 0.16);

    const whooshOsc = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();
    whooshOsc.type = 'sine';
    whooshOsc.frequency.setValueAtTime(980, now + 0.01);
    whooshOsc.frequency.exponentialRampToValueAtTime(320, now + 0.18);
    whooshGain.gain.setValueAtTime(0.065, now + 0.01);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    whooshOsc.connect(whooshGain);
    whooshGain.connect(this.sfxGain);
    whooshOsc.start(now + 0.01);
    whooshOsc.stop(now + 0.2);
  }

  public playTeleportWhoosh() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [320, 480, 640, 960].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.85, now + 0.55);
      gain.gain.setValueAtTime(0.06, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.6);
    });
  }

  public playCauldronBubble() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.08, 0.17, 0.27, 0.36].forEach((offset, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const baseF = 240 + idx * 65 + Math.random() * 50;
      osc.frequency.setValueAtTime(baseF, now + offset);
      osc.frequency.exponentialRampToValueAtTime(baseF * 1.65, now + offset + 0.08);
      gain.gain.setValueAtTime(0.07, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  public playWeaponUpgradeClang() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [780, 1170, 1560].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.42);
      gain.gain.setValueAtTime(0.09 / (i + 1), now + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.02);
      osc.stop(now + 0.46);
    });
  }

  // ============================================================
  // ЗВУКИ ЖИВОТНЫХ И ПТИЦ (С защитой от наложения!)
  // ============================================================

  // 1. 🐺 ВОЛК: Отрывистый лай / оскал (когда волк близко или нападает)
  public playWolfBark(dist = 10) {
    if (!this.canPlayWorldSound(2.2)) return;
    if (!this.ctx || !this.sfxGain) return;
    this.lockWorldSound(0.9);

    const now = this.ctx.currentTime;
    const atten = Math.max(0.15, Math.min(1, 1 - dist / 35));

    // Двойной хриплый волчий лай «Гав-рр!»
    [0, 0.24].forEach((offset, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + offset;
      const dur = idx === 0 ? 0.16 : 0.26;

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 220 : 195, start);
      osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 330 : 280, start + 0.04);
      osc.frequency.exponentialRampToValueAtTime(95, start + dur);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520, start);
      filter.Q.value = 2.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.14 * atten, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  // 2. 🐺🌙 ВОЛК: Протяжный вой на луну (вечером, ночью или вдалеке)
  public playWolfHowl(dist = 25) {
    if (!this.canPlayWorldSound(5.0)) return;
    if (!this.ctx || !this.sfxGain) return;
    this.lockWorldSound(2.8);

    const now = this.ctx.currentTime;
    const atten = Math.max(0.18, Math.min(0.85, 1 - dist / 75));
    const dur = 2.4;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    // Классическая огибающая волчьего воя: подъём с 190 Гц до 430 Гц и плавный спад к 310 Гц
    osc.frequency.setValueAtTime(185, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.55);
    osc.frequency.setValueAtTime(415, now + 1.35);
    osc.frequency.exponentialRampToValueAtTime(285, now + dur);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 5.5;
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.13 * atten, now + 0.45);
    gain.gain.setValueAtTime(0.11 * atten, now + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur + 0.05);
    lfo.stop(now + dur + 0.05);
  }

  // 3. 🐻 МЕДВЕДЬ: Мощный басовый утробный рык
  public playBearGrowl(dist = 10) {
    if (!this.canPlayWorldSound(2.6)) return;
    if (!this.ctx || !this.sfxGain) return;
    this.lockWorldSound(1.3);

    const now = this.ctx.currentTime;
    const atten = Math.max(0.2, Math.min(1, 1 - dist / 40));
    const dur = 0.95;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(78, now);
    osc1.frequency.linearRampToValueAtTime(96, now + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(52, now + dur);

    // Рычащая модуляция (рокот гортани медведя)
    osc2.frequency.setValueAtTime(83, now);
    osc2.frequency.linearRampToValueAtTime(102, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(55, now + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, now);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22 * atten, now + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.04);
    osc2.stop(now + dur + 0.04);
  }

  // 4. 🐴 ЛОШАДЬ: Ржание и фырканье скакуна (при посадке, подбегании или свисте)
  public playHorseNeigh() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.lockWorldSound(1.1);

    const now = this.ctx.currentTime;
    const dur = 0.85;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.linearRampToValueAtTime(760, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(340, now + dur);

    // Характерное вибрато конского ржания
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.value = 16;
    vibGain.gain.value = 45;
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    vibrato.start(now);
    osc.stop(now + dur + 0.03);
    vibrato.stop(now + dur + 0.03);
  }

  public playWhistle() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.lockWorldSound(1.2);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.linearRampToValueAtTime(2350, now + 0.15);
    osc.frequency.setValueAtTime(1800, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(2600, now + 0.42);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.58);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.setValueAtTime(0.02, now + 0.18);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  // 5. 🐦 ПТИЦЫ: Мелодичная трель лесной птицы (когда птицы пролетают рядом днём/утром)
  public playBirdSong() {
    if (!this.canPlayWorldSound(3.5)) return;
    if (!this.ctx || !this.sfxGain) return;
    this.lockWorldSound(0.8);

    const now = this.ctx.currentTime;
    const base = 1950 + Math.random() * 650;
    const notes = 3;

    for (let i = 0; i < notes; i++) {
      const start = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f1 = base + i * 160;
      const f2 = f1 + (i % 2 === 0 ? 280 : -180);
      osc.frequency.setValueAtTime(f1, start);
      osc.frequency.exponentialRampToValueAtTime(f2, start + 0.09);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.038, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.11);
    }
  }

  // 6. 💰 ЗВОН МОНЕТ (При сборе золота и бонусе за миссию)
  public playCoinPickup() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [1760, 2349.32];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.085, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  // 7. 🌿/📖 СБОР ТРАВ, ЯИЦ, СЕРДЕЦ И МАГИЧЕСКИХ ГРИМУАРОВ
  public playItemPickup(isGrimoire = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = isGrimoire ? [440, 554.37, 659.25, 880] : [587.33, 880];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(isGrimoire ? 0.09 : 0.065, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (isGrimoire ? 0.45 : 0.22));
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + (isGrimoire ? 0.48 : 0.24));
    });
  }

  // 8. ✨ КАСТ СТИХИЙНОЙ МАГИИ ИЗ ГРИМУАРА
  public playSpellCast(element: 'fire' | 'water' | 'air' | 'lightning' | 'necro') {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const cfg = {
      fire: { type: 'sawtooth' as OscillatorType, f1: 240, f2: 95, dur: 0.35 },
      water: { type: 'sine' as OscillatorType, f1: 520, f2: 780, dur: 0.38 },
      air: { type: 'triangle' as OscillatorType, f1: 380, f2: 920, dur: 0.32 },
      lightning: { type: 'sawtooth' as OscillatorType, f1: 1200, f2: 180, dur: 0.26 },
      necro: { type: 'triangle' as OscillatorType, f1: 165, f2: 110, dur: 0.42 },
    }[element];

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.f1, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.f2, now + cfg.dur);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + cfg.dur + 0.02);
  }

  // 9. ✨🌟 ЗВУК ПРОСВЕТЛЕНИЯ ПРИ ПОВЫШЕНИИ УРОВНЯ ГЕРОЯ (TWO WORLDS ENLIGHTENMENT!)
  // Небесный переливающийся аккорд + восходящие кристальные колокольчики + глубокий басовый резонанс озарения
  public playEnlightenmentLevelUp() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Тёплый глубокий фундамент озарения
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(130.81, now); // C3
    bassOsc.frequency.exponentialRampToValueAtTime(261.63, now + 1.6); // C4
    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(0.16, now + 0.25);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    bassOsc.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bassOsc.start(now);
    bassOsc.stop(now + 2.45);

    // 2. Возвышенный небесный хор/аккорд Просветления (C5 - E5 - G5 - B5 - D6 - G6)
    const chordFreqs = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const start = now + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const shimmer = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      shimmer.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      shimmer.frequency.setValueAtTime(freq * 1.003, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.085, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.9);

      osc.connect(gain);
      shimmer.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      shimmer.start(start);
      osc.stop(start + 1.95);
      shimmer.stop(start + 1.95);
    });
  }

  // ============================================================
  // ОБНОВЛЕНИЕ АТМОСФЕРЫ МИРА (Только уместные звуки, строго по очереди!)
  // ============================================================
  public update(params: {
    dt: number;
    hour: number;
    nearestWolfDist: number;
    nearestBearDist: number;
    wolfAggroed: boolean;
    bearAggroed: boolean;
  }): { mood: MusicMood; label: string } {
    if (!this.ctx) {
      return { mood: 'day', label: '🎵 Спокойная мелодия' };
    }

    const { hour, nearestWolfDist, nearestBearDist, wolfAggroed, bearAggroed } = params;
    const now = performance.now() / 1000;

    if (hour >= 5 && hour < 9) this.currentMood = 'dawn';
    else if (hour >= 9 && hour < 17.5) this.currentMood = 'day';
    else if (hour >= 17.5 && hour < 21) this.currentMood = 'evening';
    else this.currentMood = 'night';

    // Приоритет 1: Медведь рядом или рычит в бою
    if (bearAggroed && nearestBearDist < 22 && now - this.lastAnimalSoundTime > 3.2) {
      this.playBearGrowl(nearestBearDist);
    }
    // Приоритет 2: Волк рядом лает в бою
    else if (wolfAggroed && nearestWolfDist < 20 && now - this.lastAnimalSoundTime > 2.8) {
      this.playWolfBark(nearestWolfDist);
    }
    // Приоритет 3: Вечером или ночью волк вдалеке воет на луну
    else if (
      (hour >= 18.5 || hour < 5.5) &&
      nearestWolfDist < 75 &&
      now - this.lastWolfHowlTime > 14 + Math.random() * 10
    ) {
      this.lastWolfHowlTime = now;
      this.playWolfHowl(nearestWolfDist);
    }
    // Приоритет 4: Днём или утром спокойно поют птицы в небе
    else if (
      hour >= 5.5 &&
      hour < 19.5 &&
      !wolfAggroed &&
      !bearAggroed &&
      now - this.lastBirdTime > 5.5 + Math.random() * 5
    ) {
      this.lastBirdTime = now;
      this.playBirdSong();
    }

    const labels: Record<MusicMood, string> = {
      dawn: '🌅 Утренняя мелодия • Птицы',
      day: '☀️ Мелодия Миртаны • Птицы',
      evening: '🌇 Вечерняя лютня',
      night: '🌙 Ночная мелодия • Вой волков',
    };

    return { mood: this.currentMood, label: labels[this.currentMood] };
  }

  public dispose() {
    this.stopDialogVoice();
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
