// ============================================================================
// models/classes/Parieur.js
// Classe Parieur - Détruit 3x3 et remplace par 6 blocs aléatoires (2 à lui)
// ============================================================================

import Player from '../Player.js';

export default class Parieur extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'parieur';
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const cells = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
          cells.push([nx, ny]);
        }
      }
    }

    cells.forEach(([nx, ny]) => {
      const cell = this.game.grid[nx][ny];
      cell.color = null;
      cell.playerId = null;
      cell.hp = 0;
      cell.waveNumber = null;
    });

    const shuffled = cells.sort(() => Math.random() - 0.5);
    
    const colors = this.game.players.map(p => p.color);
    const blocksToPlace = [
      this.color, this.color,
      ...Array(4).fill(null).map(() => colors[Math.floor(Math.random() * colors.length)])
    ];

    blocksToPlace.forEach((color, i) => {
      if (i < shuffled.length) {
        const [nx, ny] = shuffled[i];
        const cell = this.game.grid[nx][ny];
        cell.color = color;
        cell.hp = 1;
        cell.playerId = this.game.players.find(p => p.color === color)?.playerId || null;
        cell.waveNumber = this.game.waveNumber;
      }
    });

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: true };
  }
}