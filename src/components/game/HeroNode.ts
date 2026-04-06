import { GameNode } from './GameNode';
import type { GameNodeProps, GameNodeStat } from './GameNode';

export interface HeroStats {
  health: number;
  maxHealth: number;
  strength: number;
  attackSpeed: number;
  defense: number;
}

export interface HeroNodeProps extends Partial<GameNodeProps> {
  heroName: string;
  level?: number;
  heroStats: HeroStats;
}

export class HeroNode extends GameNode {
  constructor(props: HeroNodeProps) {
    const stats: GameNodeStat[] = [
      { key: 'health', label: 'HEALTH', value: props.heroStats.health, max: props.heroStats.maxHealth, color: 'green', showBar: true },
      { key: 'strength', label: 'STR', value: props.heroStats.strength, max: 100, color: 'orange', showBar: false },
      { key: 'attackSpeed', label: 'ATK SPD', value: props.heroStats.attackSpeed, max: 10, color: 'cyan', showBar: false },
      { key: 'defense', label: 'DEF', value: props.heroStats.defense, max: 100, color: 'amber', showBar: false },
    ];

    super({
      name: props.heroName,
      type: 'HERO',
      color: 'cyan',
      icon: '◆',
      stats,
      nodeWidth: props.nodeWidth ?? 210,
      draggable: props.draggable ?? true,
      level: props.level ?? 1,
      ...props,
    } as GameNodeProps);
  }

  get health(): number { return this.getStat('health') ?? 0; }
  set health(v: number) { this.updateStat('health', Math.max(0, v)); }

  get strength(): number { return this.getStat('strength') ?? 0; }
  get attackSpeed(): number { return this.getStat('attackSpeed') ?? 0; }
  get defense(): number { return this.getStat('defense') ?? 0; }

  get isAlive(): boolean { return this.health > 0; }

  takeDamage(amount: number): number {
    const mitigated = Math.max(1, amount - this.defense * 0.3);
    const newHealth = Math.max(0, this.health - mitigated);
    this.health = newHealth;
    return mitigated;
  }
}
