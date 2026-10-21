import type { AccountState } from '../../contracts/index.ts';
import type { GameContext } from './shell.tsx';
import { friendNames } from './kit.tsx';

/** One browsing order for the roster strip and the Stats/Skill arrows. Does not change the saved roster. */
export function orderedCharacters(state: Pick<AccountState, 'roster' | 'team'>) {
  const position = new Map(state.team.map((slot, index) => [slot.character_id, index]));
  return state.roster.map((actor, index) => ({ actor, index }))
    .sort((a, b) => (position.get(a.actor.character_id) ?? state.team.length) - (position.get(b.actor.character_id) ?? state.team.length) || a.index - b.index)
    .map(row => row.actor);
}

export function CharacterNav({ context }: { context: GameContext }) {
  const actors = orderedCharacters(context.state), at = Math.max(0, actors.findIndex(a => a.character_id === context.characterId));
  const previous = actors[(at + actors.length - 1) % actors.length], next = actors[(at + 1) % actors.length];
  const disabled = context.busy || actors.length < 2;
  return <nav className="character-nav" aria-label="เปลี่ยนตัวละคร">
    <button type="button" aria-label="ตัวละครก่อนหน้า" title={friendNames[previous?.character_id ?? '']} disabled={disabled} onClick={() => previous && context.selectCharacter(previous.character_id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg></button>
    <span className="character-index" aria-label={`ตัวละคร ${at + 1} จาก ${actors.length}`}>{at + 1}<small>/{actors.length}</small></span>
    <button type="button" aria-label="ตัวละครถัดไป" title={friendNames[next?.character_id ?? '']} disabled={disabled} onClick={() => next && context.selectCharacter(next.character_id)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button>
  </nav>;
}
