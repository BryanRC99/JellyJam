import { synthesizeSpeech } from './dj.tts.service';
import { getCachedVoice, setCachedVoice } from './dj.cache';

export async function getOrCreateVoiceAudio(
  text: string
): Promise<Buffer> {
  const cacheKey = text.trim();

  const cached = getCachedVoice(cacheKey);

  if (cached) {
    return cached;
  }

  const audio = await synthesizeSpeech(text);

  setCachedVoice(cacheKey, audio);

  return audio;
}
