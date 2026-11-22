import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация серверного клиента Google GenAI со строгим заголовком User-Agent
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ============================================================
// ПРОФИЛИ СТУДИЙНЫХ ГОЛОСОВ GOOGLE GEMINI 3.8 NEURAL TTS
// Все мужские персонажи (Герой, Торговец Хакон, Старейшина Горн, Кузнец Торус,
// Охотник Ларс, Стражник Диего) используют эталонный мужской нейро-голос 'Puck'
// (который показал наивысшее естественное качество и живую русскую дикцию у Хакона).
// Женские голоса ('Kore' / 'Zephyr') используются ТОЛЬКО для женских персонажей!
// ============================================================
const NPC_VOICE_CONFIG: Record<
  string,
  {
    voiceName: 'Puck' | 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr';
    gender: 'male' | 'female';
    style: string;
  }
> = {
  hero: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Energetic, young, confident, charismatic male RPG protagonist (the Nameless Hero), speaking clearly, brightly, and naturally in Russian',
  },
  trader: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Warm, charismatic, lively, persuasive male caravan merchant in a medieval RPG, speaking smoothly and naturally in Russian with a warm baritone',
  },
  elder: {
    voiceName: 'Charon',
    gender: 'male',
    style:
      'Deep, wise, calm, dignified mature male village elder in a medieval RPG, speaking smoothly, thoughtfully, and naturally in Russian',
  },
  smith: {
    voiceName: 'Fenrir',
    gender: 'male',
    style:
      'Strong, deep, resonant, warm-voiced male master blacksmith in a medieval RPG, speaking firmly, clearly, and naturally in Russian',
  },
  hunter: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Calm, focused, experienced male woodland ranger and hunter in a medieval RPG, speaking clearly, smoothly, and naturally in Russian',
  },
  guard: {
    voiceName: 'Fenrir',
    gender: 'male',
    style:
      'Steady, confident, authoritative male garrison captain in a medieval RPG, speaking firmly, clearly, and naturally in Russian',
  },
  woodcutter: {
    voiceName: 'Charon',
    gender: 'male',
    style:
      'Warm, friendly, hearty deep-voiced male woodsman sitting by a campfire in a medieval RPG, speaking naturally and expressively in Russian',
  },
  fisherman: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Seasoned, warm, expressive male fisherman in a medieval RPG, speaking clearly and naturally in Russian',
  },
  mage_fire: {
    voiceName: 'Fenrir',
    gender: 'male',
    style:
      'Majestic, fiery, resonant male Fire Archmage mentor in a medieval fantasy RPG, speaking with power and wisdom in Russian',
  },
  mage_water: {
    voiceName: 'Charon',
    gender: 'male',
    style:
      'Calm, serene, wise male Water Archmage mentor in a medieval fantasy RPG, speaking smoothly and thoughtfully in Russian',
  },
  mage_air: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Inspiring, clear, spirited male Air Archmage mentor in a medieval fantasy RPG, speaking smoothly and naturally in Russian',
  },
  mage_earth: {
    voiceName: 'Fenrir',
    gender: 'male',
    style:
      'Deep, grounded, ancient male Earth Archmage and Golem Master in a medieval fantasy RPG, speaking firmly and naturally in Russian',
  },
  mage_necro: {
    voiceName: 'Charon',
    gender: 'male',
    style:
      'Mysterious, deep, solemn male Necromancer and Poison Master mentor in a medieval fantasy RPG, speaking clearly in Russian',
  },
  cobbler: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Friendly, skilled, cheerful male village cobbler and leatherworker in a medieval RPG, speaking warmly in Russian',
  },
  cook: {
    voiceName: 'Charon',
    gender: 'male',
    style:
      'Hearty, jovial, warm-voiced male village tavern chef in a medieval RPG, speaking enthusiastically in Russian',
  },
  stablehand: {
    voiceName: 'Puck',
    gender: 'male',
    style:
      'Steady, friendly male horse master and stablehand in a medieval RPG, speaking naturally in Russian',
  },
  worker: {
    voiceName: 'Fenrir',
    gender: 'male',
    style:
      'Strong, honest, hardworking male stonemason and miner in a medieval RPG, speaking firmly in Russian',
  },
  healer: {
    voiceName: 'Kore',
    gender: 'female',
    style:
      'Warm, gentle, melodic female herbalist and healer in a medieval RPG, speaking kindly, clearly, and naturally in Russian',
  },
  female: {
    voiceName: 'Kore',
    gender: 'female',
    style:
      'Warm, expressive, natural female voice in Russian, clear studio pronunciation',
  },
};

// Если Gemini вернул сырой 16-bit PCM (audio/l16) без заголовка RIFF WAVE,
// оборачиваем его в стандартный 44-байтный WAV (24 кГц, 16 бит, моно)
function ensureValidWavBase64(base64Data: string, mimeType: string): string {
  const buf = Buffer.from(base64Data, 'base64');
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return base64Data;
  }
  if (mimeType.toLowerCase().includes('l16') || mimeType.toLowerCase().includes('pcm') || buf.toString('ascii', 0, 4) !== 'RIFF') {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = buf.length;
    const wavHeader = Buffer.alloc(44);

    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(36 + dataSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    return Buffer.concat([wavHeader, buf]).toString('base64');
  }
  return base64Data;
}

// Серверный кэш сгенерированных WAV-дорожек (чтобы повторные фразы отдавались за 0 мс)
const serverAudioCache = new Map<string, { audioBase64: string; mimeType: string; gender: 'male' | 'female' }>();
const serverInFlight = new Map<string, Promise<{ audioBase64: string; mimeType: string; gender: 'male' | 'female' }>>();

// Ограничитель параллельных запросов к Gemini TTS, чтобы предзагрузка никогда не вызывала 429
let activeTtsCalls = 0;
const MAX_CONCURRENT_TTS = 4;
const waitQueue: (() => void)[] = [];

async function acquireTtsSlot(): Promise<void> {
  if (activeTtsCalls < MAX_CONCURRENT_TTS) {
    activeTtsCalls++;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeTtsCalls++;
}

function releaseTtsSlot(): void {
  activeTtsCalls = Math.max(0, activeTtsCalls - 1);
  const next = waitQueue.shift();
  if (next) next();
}

async function generateStudioTts(
  npcKey: string,
  cleanText: string
): Promise<{ audioBase64: string; mimeType: string; gender: 'male' | 'female' }> {
  const profile = NPC_VOICE_CONFIG[npcKey] || NPC_VOICE_CONFIG.trader;
  const cacheKey = `${profile.voiceName}::${npcKey}::${cleanText}`;

  const cached = serverAudioCache.get(cacheKey);
  if (cached) return cached;

  const existingPromise = serverInFlight.get(cacheKey);
  if (existingPromise) return existingPromise;

  const task = (async () => {
    await acquireTtsSlot();
    try {
      const ai = getAiClient();
      const modelsToTry = [
        'gemini-2.5-flash-preview-tts',
        'gemini-3.8-flash-lite-tts',
        'gemini-3.8-flash-tts',
      ];
      let audioBase64: string | undefined;
      let mimeType = 'audio/wav';

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: cleanText,
                    speechMetadata: {
                      style: profile.style,
                    },
                  } as Record<string, unknown>,
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: profile.voiceName,
                  },
                },
              },
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
          if (part?.inlineData?.data) {
            const rawMime = part.inlineData.mimeType || 'audio/wav';
            audioBase64 = ensureValidWavBase64(part.inlineData.data, rawMime);
            mimeType = 'audio/wav';
            break;
          }
        } catch {
          // Пробуем следующую модель или без дополнительных метаданных
          try {
            const simpleResp = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: 'user',
                  parts: [{ text: cleanText }],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: profile.voiceName,
                    },
                  },
                },
              },
            });
            const part = simpleResp.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
            if (part?.inlineData?.data) {
              const rawMime = part.inlineData.mimeType || 'audio/wav';
              audioBase64 = ensureValidWavBase64(part.inlineData.data, rawMime);
              mimeType = 'audio/wav';
              break;
            }
          } catch {
            // continue
          }
        }
      }

      if (!audioBase64) {
        throw new Error('No audio data returned by Gemini TTS');
      }

      const result = { audioBase64, mimeType, gender: profile.gender };
      serverAudioCache.set(cacheKey, result);
      return result;
    } finally {
      releaseTtsSlot();
      serverInFlight.delete(cacheKey);
    }
  })();

  serverInFlight.set(cacheKey, task);
  return task;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // ============================================================
  // POST /api/tts — Студийная нейросетевая озвучка диалогов (Google Gemini 3.8 TTS)
  // ============================================================
  app.post('/api/tts', async (req, res) => {
    try {
      const { npcKey = 'trader', text = '' } = req.body || {};
      const cleanText = String(text).trim();
      if (!cleanText) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const result = await generateStudioTts(String(npcKey), cleanText);
      res.json({
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        gender: result.gender,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'TTS generation error';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
