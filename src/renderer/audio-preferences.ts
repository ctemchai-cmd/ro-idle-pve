import { DEFAULT_AUDIO_LEVELS, type AudioLevels } from '../contracts/audio.ts';
const key = 'ro-idle.audio-levels.v1';
export function readAudioLevels(storage: Pick<Storage, 'getItem'>): AudioLevels {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    if (value && typeof value === 'object' && 'music' in value && 'effects' in value && [value.music, value.effects].every(level => typeof level === 'number' && Number.isFinite(level) && level >= 0 && level <= 1)) return { music: value.music as number, effects: value.effects as number };
  } catch { /* Storage can be unavailable; audio settings must not block combat. */ }
  return { ...DEFAULT_AUDIO_LEVELS };
}
export function saveAudioLevels(storage: Pick<Storage, 'setItem'>, levels: AudioLevels): void {
  try { storage.setItem(key, JSON.stringify(levels)); } catch { /* Session settings still work without local storage. */ }
}
