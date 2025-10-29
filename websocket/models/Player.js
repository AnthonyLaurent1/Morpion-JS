// ============================================================================
// models/Player.js
// Classe de base pour tous les joueurs
// ============================================================================

export default class Player {
  constructor(playerId, color, game) {
    this.playerId = playerId;
    this.color = color;
    this.game = game;
    this.className = 'base';
    
    this.actionPoints = 0;
    this.abilityCharges = 0;
    this.abilityMaxCharges = 3;
    this.abilityUsedThisWave = false;
    
    this.timers = [];
  }

  resetWave() {
    const pointsToAdd = this.className === 'fast' ? 2 : 1;
    this.actionPoints += pointsToAdd;
    this.abilityCharges = Math.min(this.abilityCharges + 1, this.abilityMaxCharges);
    this.abilityUsedThisWave = false;
  }

  canPlace() {
    return this.actionPoints >= 1;
  }

  canDestroy() {
    return this.actionPoints >= 1;
  }

  canUseAbility() {
    return this.abilityCharges >= this.abilityMaxCharges && !this.abilityUsedThisWave;
  }

  skipTurn() {
    return { success: true };
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
    cell.hp = 1;
    cell.playerId = this.playerId;
    cell.waveNumber = this.game.waveNumber;
    
    this.actionPoints -= 1;
    
    return { success: true };
  }

  destroyBlock(x, y) {
    if (!this.canDestroy()) {
      return { success: false, reason: 'not_enough_ap' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const cell = this.game.grid[x][y];
    if (cell.color === null) {
      return { success: false, reason: 'cell_empty' };
    }

    if (cell.waveNumber === this.game.waveNumber) {
      return { success: false, reason: 'protected_block' };
    }

    cell.hp--;
    if (cell.hp <= 0) {
      cell.color = null;
      cell.playerId = null;
      cell.hp = 0;
      cell.waveNumber = null;
    }
    
    this.actionPoints -= 1;
    
    return { success: true };
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }
    
    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: false, reason: 'no_ability' };
  }

  // Nettoyer les timers
  cleanup() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }
}