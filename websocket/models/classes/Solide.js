// ============================================================================
// models/classes/Solide.js
// Classe Solide - Blocs avec 2 PV, cooldown multiplié par 2
// ============================================================================

import Player from '../Player.js';

export default class Solide extends Player {
  constructor(playerId, color, game) {
    super(playerId, color, game);
    this.className = 'solide';
  }

  placeBlock(x, y) {
    if (!this.canPlace()) {
      return { success: false, reason: 'not_enough_ap' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const cell = this.game.grid[x][y];
    if (cell.color !== null) {
      return { success: false, reason: 'cell_occupied' };
    }

    cell.color = this.color;
    cell.hp = 2; // Blocs avec 2 PV
    cell.playerId = this.playerId;
    cell.waveNumber = this.game.waveNumber;
    this.actionPoints -= 1;
    
    return { success: true };
  }

  useAbility(x, y) {
    // Solide n'a pas de pouvoir spécial unique
    return { success: false, reason: 'no_ability' };
  }
}