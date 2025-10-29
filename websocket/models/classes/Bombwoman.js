// ============================================================================
// models/classes/Bombwoman.js
// Classe Bombwoman - Détruit ligne ou colonne, ne peut pas poser dedans 6s
// ============================================================================

import Player from '../Player.js';

export default class Bombwoman extends Player {
  constructor(playerId, color, game) {
    super(playerId, color, game);
    this.className = 'bombwoman';
    this.abilityCooldown = 10000; // 10s
    this.blockedRow = null;
    this.blockedCol = null;
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const destroyRow = Math.random() < 0.5;

    if (destroyRow) {
      for (let col = 0; col < 5; col++) {
        const cell = this.game.grid[x][col];
        cell.color = null;
        cell.playerId = null;
        cell.hp = 0;
        cell.waveNumber = null;
      }
      this.blockedRow = x;
      this.blockedCol = null;
    } else {
      for (let row = 0; row < 5; row++) {
        const cell = this.game.grid[row][y];
        cell.color = null;
        cell.playerId = null;
        cell.hp = 0;
        cell.waveNumber = null;
      }
      this.blockedRow = null;
      this.blockedCol = y;
    }

    const timer = setTimeout(() => {
      this.blockedRow = null;
      this.blockedCol = null;
    }, 6000);
    this.timers.push(timer);

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: true };
  }

  placeBlock(x, y) {
    // Vérifier si la position est bloquée
    if (this.blockedRow !== null && x === this.blockedRow) {
      return { success: false, reason: 'blocked' };
    }
    if (this.blockedCol !== null && y === this.blockedCol) {
      return { success: false, reason: 'blocked' };
    }

    return super.placeBlock(x, y);
  }
}