import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleAudio, type AudioBackend } from '../../src/renderer/audio.ts';
import { readAudioLevels, saveAudioLevels } from '../../src/renderer/audio-preferences.ts';

function fixture() {
  const tracks: { url: string; loop: boolean; volume: number; paused: boolean; plays: number; play(): Promise<void>; pause(): void }[] = [];
  const sources: { onended: (() => void) | null; started: number; stopped: number; connect(): void; disconnect(): void; start(): void; stop(): void }[] = [];
  let fetches = 0, resolveBuffer: ((value: AudioBuffer) => void) | undefined;
  const gain = { gain: { value: 0 }, connect() {} };
  const context = { state: 'running', destination: {}, async resume() {}, async close() { this.state = 'closed'; }, createGain() { return gain; }, createBufferSource() { const source = { onended: null, started: 0, stopped: 0, connect() {}, disconnect() {}, start() { this.started++; }, stop() { this.stopped++; } }; sources.push(source); return source; } };
  const ports: AudioBackend = { context: () => context as unknown as AudioContext, music: url => { const track = { url, loop: false, volume: 0, paused: true, plays: 0, async play() { this.paused = false; this.plays++; }, pause() { this.paused = true; } }; tracks.push(track); return track as unknown as HTMLAudioElement; }, buffer: async () => { fetches++; return {} as AudioBuffer; } };
  const mixer = new BattleAudio(ref => `/local/${ref}`, ports);
  return { mixer, ports, tracks, sources, gain, context, get fetches() { return fetches; }, pendingBuffer() { ports.buffer = () => new Promise(resolve => { resolveBuffer = resolve; }); }, resolveBuffer() { resolveBuffer?.({} as AudioBuffer); } };
}
test('BGM loops and keeps same track across restart; scene switch pauses old music; independent live volumes', async () => {
  const f = fixture(); await f.mixer.enable(true, 'field.mp3'); assert.equal(f.tracks[0]!.loop, true); assert.equal(f.tracks[0]!.paused, false);
  await f.mixer.enable(true, 'field.mp3'); assert.equal(f.tracks.length, 1);
  f.mixer.setLevels({ music: .4, effects: .7 }); assert.equal(f.tracks[0]!.volume, .4); assert.equal(f.gain.gain.value, .7);
  await f.mixer.enable(true, 'dungeon.mp3'); assert.equal(f.tracks[0]!.paused, true); assert.equal(f.tracks[1]!.paused, false);
  f.mixer.dispose(); assert.ok(f.tracks.every(track => track.paused)); assert.equal(f.context.state, 'closed');
});
test('mute/hidden/dispose cancel active and pending SFX; hidden music resumes without resetting its track', async () => {
  const f = fixture(); await f.mixer.enable(true, 'field.mp3'); await f.mixer.sound('hit.wav'); assert.equal(f.sources[0]!.started, 1);
  f.pendingBuffer(); const pending = f.mixer.sound('spell.wav'); await f.mixer.setHidden(true); await f.mixer.setHidden(false); f.resolveBuffer(); await pending;
  assert.equal(f.sources.length, 1); assert.equal(f.sources[0]!.stopped, 1); assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0]!.paused, false);
  await f.mixer.enable(false, 'field.mp3'); await f.mixer.sound('mute.wav'); assert.equal(f.sources.length, 1); assert.equal(f.tracks[0]!.paused, true);
  f.mixer.dispose(); await f.mixer.enable(true, 'field.mp3'); assert.equal(f.mixer.snapshot().enabled, false);
});
test('voice limit24 bounds bursts, decoded sounds are cached, zero effects volume stays silent', async () => {
  const f = fixture(); await f.mixer.enable(true, 'field.mp3'); for (let i = 0; i < 30; i++) await f.mixer.sound('hit.wav');
  assert.equal(f.fetches, 1); assert.equal(f.mixer.snapshot().active_effects, 24); assert.equal(f.sources.filter(s => s.stopped > 0).length, 6);
  f.mixer.setLevels({ music: .2, effects: 0 }); await f.mixer.sound('new.wav'); assert.equal(f.fetches, 1); f.mixer.dispose();
});
test('failed BGM does not stay enabled and can retry; corrupt/blocked preference storage does not break audio', async () => {
  const f = fixture(), createMusic = f.ports.music; let fail = true;
  f.ports.music = url => { const track = createMusic(url); track.play = async () => { if (fail) throw new Error('blocked'); }; return track; };
  await assert.rejects(f.mixer.enable(true, 'field.mp3')); assert.equal(f.mixer.snapshot().enabled, false); fail = false; await f.mixer.enable(true, 'field.mp3'); assert.equal(f.mixer.snapshot().enabled, true); f.mixer.dispose();
  assert.deepEqual(readAudioLevels({ getItem: () => '{bad' }), { music: .12, effects: .2 });
  assert.deepEqual(readAudioLevels({ getItem: () => '{"music":9,"effects":-1}' }), { music: .12, effects: .2 });
  assert.deepEqual(readAudioLevels({ getItem: () => '{"music":0.3,"effects":0}' }), { music: .3, effects: 0 });
  assert.doesNotThrow(() => saveAudioLevels({ setItem: () => { throw new Error('blocked'); } }, { music: .3, effects: .5 }));
});
test('visibility during pending unlock retains the scene and resumes exactly one music element', async () => {
  const f = fixture(); let resume!: () => void;
  f.context.resume = () => new Promise<void>(resolve => { resume = resolve; });
  const enabling = f.mixer.enable(true, 'field.mp3'); await f.mixer.setHidden(true); resume(); await enabling;
  assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0]!.paused, true);
  f.context.resume = async () => {}; await f.mixer.setHidden(false); assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0]!.paused, false); f.mixer.dispose();
});
test('actor cast channels cancel pending decodes and active cues without muting other actors', async () => {
  const f = fixture(); await f.mixer.enable(true, 'field.mp3');
  await f.mixer.sound('cast.wav', 'cast:mage'); await f.mixer.sound('cast.wav', 'cast:priest');
  f.mixer.stopSound('cast:mage'); assert.equal(f.sources[0]!.stopped, 1); assert.equal(f.sources[1]!.stopped, 0);
  f.pendingBuffer(); const pending = f.mixer.sound('new.wav', 'cast:mage'); f.mixer.stopSound('cast:mage'); f.resolveBuffer(); await pending;
  assert.equal(f.sources.length, 2); assert.equal(f.mixer.snapshot().active_effects, 1);
  await f.mixer.sound('cast.wav', 'cast:priest'); assert.equal(f.sources[1]!.stopped, 1); assert.equal(f.fetches, 1);
  f.mixer.dispose();
});
