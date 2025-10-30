import Player from '../Player.js';

export default class Bombman extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'bombman';
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const directions = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x, y]
    ];

    directions.forEach(([nx, ny]) => {
      if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
        const cell = this.game.grid[nx][ny];
        cell.color = null;
        cell.playerId = null;
        cell.hp = 0;
        cell.waveNumber = null;
      }
    });

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: true };
  }
}