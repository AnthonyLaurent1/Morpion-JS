import Player from '../Player.js';

export default class Flash extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'flash';
  }

  placeBlock(x, y) {
    if (!this.canPlace()) {
      return { success: false, reason: 'not_enough_ap' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const cell = this.game.grid[x][y];
    
    if (cell.color !== null && cell.hp > 0) {
      return { success: false, reason: 'cell_occupied' };
    }

    cell.color = this.color;
    cell.hp = 0;
    cell.playerId = this.playerId;
    cell.waveNumber = this.game.waveNumber;
    
    this.actionPoints -= 1;
    
    return { success: true };
  }

  useAbility(x, y) {
    return { success: false, reason: 'no_ability' };
  }
}