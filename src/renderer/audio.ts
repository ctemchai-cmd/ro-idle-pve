import { DEFAULT_AUDIO_LEVELS, type AudioLevels } from '../contracts/audio.ts';
export { DEFAULT_AUDIO_LEVELS, type AudioLevels } from '../contracts/audio.ts';
export interface AudioBackend {
  context(): AudioContext;
  music(url: string): HTMLAudioElement;
  buffer(url: string, context: AudioContext): Promise<AudioBuffer>;
}
const backend: AudioBackend = {
  context: () => new AudioContext(), music: url => new Audio(url),
  buffer: async (url, context) => { const response = await fetch(url); if (!response.ok) throw new Error('AUDIO_HTTP'); return context.decodeAudioData(await response.arrayBuffer()); },
};
const level = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
/** Browser audio only; playback and visibility never advance combat or consume its RNG. */
export class BattleAudio {
  private context: AudioContext | null = null;
  private bus: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private musicUrl = '';
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private voices = new Set<AudioBufferSourceNode>();
  private channels = new Map<string, { voice: AudioBufferSourceNode | null }>();
  private generation = 0;
  private visibilityGeneration = 0;
  private hidden = false;
  private disposed = false;
  private enabled = false;
  private levels: AudioLevels = { ...DEFAULT_AUDIO_LEVELS };
  constructor(private readonly mediaUrl: (ref: string) => string, private readonly ports = backend) {}
  snapshot() { return { enabled: this.enabled, music_url: this.musicUrl, music_playing: !!this.music && !this.music.paused, levels: { ...this.levels }, active_effects: this.voices.size }; }
  setLevels(levels: AudioLevels): void {
    this.levels = { music: level(levels.music), effects: level(levels.effects) };
    if (this.music) this.music.volume = this.levels.music;
    if (this.bus) this.bus.gain.value = this.levels.effects;
  }
  private stopEffects() { for (const voice of this.voices) { voice.stop(); voice.disconnect(); } this.voices.clear(); this.channels.clear(); }
  stopSound(channel: string): void {
    const entry = this.channels.get(channel); this.channels.delete(channel);
    if (entry?.voice) { entry.voice.stop(); entry.voice.disconnect(); this.voices.delete(entry.voice); }
  }
  async enable(enabled: boolean, musicRef: string): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.enabled = enabled; this.stopEffects();
    if (!enabled) { this.music?.pause(); return; }
    try {
      if (!this.context) { this.context = this.ports.context(); this.bus = this.context.createGain(); this.bus.gain.value = this.levels.effects; this.bus.connect(this.context.destination); }
      await this.context.resume();
      if (generation !== this.generation || !this.enabled || this.disposed) return;
      const url = this.mediaUrl(musicRef);
      if (url !== this.musicUrl || !this.music) { this.music?.pause(); this.music = this.ports.music(url); this.musicUrl = url; this.music.loop = true; }
      this.music.volume = this.levels.music;
      if (!this.hidden) await this.music.play();
    } catch (error) {
      if (generation === this.generation) { this.enabled = false; this.music?.pause(); this.stopEffects(); }
      if (generation === this.generation) throw error;
    }
  }
  async setHidden(hidden: boolean): Promise<void> {
    this.hidden = hidden; ++this.visibilityGeneration;
    if (hidden) { this.music?.pause(); this.stopEffects(); }
    else if (this.enabled && !this.disposed) { await this.context?.resume(); if (!this.hidden && this.enabled && !this.disposed) await this.music?.play(); }
  }
  async sound(ref: string, channel?: string): Promise<void> {
    if (channel) this.stopSound(channel);
    if (!this.enabled || this.hidden || this.disposed || !this.context || this.levels.effects === 0) return;
    const entry = { voice: null as AudioBufferSourceNode | null };
    if (channel) this.channels.set(channel, entry);
    const context = this.context, generation = this.generation, visibility = this.visibilityGeneration, url = this.mediaUrl(ref);
    if (!this.buffers.has(url)) this.buffers.set(url, this.ports.buffer(url, context).catch(error => { this.buffers.delete(url); throw error; }));
    let buffer: AudioBuffer;
    try { buffer = await this.buffers.get(url)!; }
    catch (error) { if (channel && this.channels.get(channel) === entry) this.channels.delete(channel); throw error; }
    if (channel && this.channels.get(channel) !== entry) return;
    if (generation !== this.generation || visibility !== this.visibilityGeneration || !this.enabled || this.hidden || this.disposed || context.state === 'closed' || this.levels.effects === 0) return;
    if (this.voices.size >= 24) { const oldest = this.voices.values().next().value!; oldest.stop(); oldest.disconnect(); this.voices.delete(oldest); }
    const voice = context.createBufferSource(); voice.buffer = buffer; voice.connect(this.bus!);
    entry.voice = voice;
    voice.onended = () => { voice.disconnect(); this.voices.delete(voice); if (channel && this.channels.get(channel) === entry) this.channels.delete(channel); };
    this.voices.add(voice); voice.start();
  }
  dispose(): void { this.disposed = true; this.enabled = false; ++this.generation; this.music?.pause(); this.stopEffects(); void this.context?.close(); this.context = null; }
}
