import { GameNode } from './GameNode';
import type { GameNodeProps, GameNodeStat } from './GameNode';

export interface EnemyStats {
  health: number;
  maxHealth: number;
  strength: number;
  attackSpeed: number;
  defense: number;
}

export interface EnemyNodeProps extends Partial<GameNodeProps> {
  enemyName: string;
  level?: number;
  enemyStats: EnemyStats;
  /** Enemy threat tier */
  threat?: 'normal' | 'elite' | 'boss';
}

const THREAT_COLORS = {
  normal: 'red' as const,
  elite: 'magenta' as const,
  boss: 'amber' as const,
};

const THREAT_ICONS = {
  normal: '▲',
  elite: '◈',
  boss: '☠',
};

export class EnemyNode extends GameNode {
  private _threat: 'normal' | 'elite' | 'boss';

  constructor(props: EnemyNodeProps) {
    const threat = props.threat ?? 'normal';

    const stats: GameNodeStat[] = [
      { key: 'health', label: 'HEALTH', value: props.enemyStats.health, max: props.enemyStats.maxHealth, color: 'red', showBar: true },
      { key: 'strength', label: 'STR', value: props.enemyStats.strength, max: 100, color: 'orange', showBar: false },
      { key: 'attackSpeed', label: 'ATK SPD', value: props.enemyStats.attackSpeed, max: 10, color: 'cyan', showBar: false },
      { key: 'defense', label: 'DEF', value: props.enemyStats.defense, max: 100, color: 'amber', showBar: false },
    ];

    super({
      name: props.enemyName,
      type: threat === 'boss' ? 'BOSS' : threat === 'elite' ? 'ELITE' : 'ENEMY',
      color: THREAT_COLORS[threat],
      icon: THREAT_ICONS[threat],
      stats,
      nodeWidth: props.nodeWidth ?? 210,
      draggable: props.draggable ?? true,
      level: props.level ?? 1,
      ...props,
    } as GameNodeProps);

    this._threat = threat;
  }

  get health(): number { return this.getStat('health') ?? 0; }
  set health(v: number) { this.updateStat('health', Math.max(0, v)); }

  get strength(): number { return this.getStat('strength') ?? 0; }
  get attackSpeed(): number { return this.getStat('attackSpeed') ?? 0; }
  get defense(): number { return this.getStat('defense') ?? 0; }

  get isAlive(): boolean { return this.health > 0; }
  get threat(): string { return this._threat; }

  takeDamage(amount: number): number {
    const mitigated = Math.max(1, amount - this.defense * 0.3);
    const newHealth = Math.max(0, this.health - mitigated);
    this.health = newHealth;
    return mitigated;
  }
}
