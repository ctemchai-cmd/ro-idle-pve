/** Wall-time cadence only; rendering/prediction and the server's clock limits are independent. */
export const BATTLE_ACK_INTERVAL_MS = 4000;

export class BattleAckSchedule {
  private battleId: string | null = null;
  private nextAt = 0;

  reset() { this.battleId = null; this.nextAt = 0; }

  delay(battleId: string, now: number): number {
    if (this.battleId !== battleId) this.sent(battleId, now);
    return Math.max(0, this.nextAt - now);
  }

  /** Measure from request start, so response/checkpoint latency does not add to every interval. */
  sent(battleId: string, now: number) {
    this.battleId = battleId;
    this.nextAt = now + BATTLE_ACK_INTERVAL_MS;
  }
}
