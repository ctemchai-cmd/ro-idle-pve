import type { AccountState } from '../contracts/index.ts';

export const artifactResourceNames = {
  artifact_essence: 'ผลึก Artifact',
  artifact_ticket: 'ตั๋วสุ่ม Artifact',
  artifact_reroll: 'หินรีสกิล Artifact',
} as const;

/** Artifact balances live outside Wallet; presentation must read their actual stock. */
export function artifactResourceBalances(state: AccountState) {
  return [
    { id: 'artifact_essence', amount: state.artifacts?.essence ?? 0 },
    { id: 'artifact_ticket', amount: state.artifacts?.tickets ?? 0 },
    { id: 'artifact_reroll', amount: state.artifacts?.reroll_stones ?? 0 },
  ] as const;
}
