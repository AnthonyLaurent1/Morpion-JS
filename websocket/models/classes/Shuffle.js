// ============================================================================
// models/classes/Shuffle.js
// Classe Shuffle - Mélange aléatoirement toute la grille
// ============================================================================

import Player from '../Player.js';

export default class Shuffle extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'shuffle';
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    const blocks = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = this.game.grid[row][col];
        if (cell.color !== null) {
          blocks.push({
            color: cell.color,
            hp: cell.hp,
            playerId: cell.playerId,
            waveNumber: cell.waveNumber
          });
        }
      }
    }

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        this.game.grid[row][col].color = null;
        this.game.grid[row][col].hp = 0;
        this.game.grid[row][col].playerId = null;
        this.game.grid[row][col].waveNumber = null;
      }
    }

    const shuffled = blocks.sort(() => Math.random() - 0.5);

    const positions = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        positions.push([row, col]);
      }
    }
    const shuffledPositions = positions.sort(() => Math.random() - 0.5);

    shuffled.forEach((block, i) => {
      if (i < shuffledPositions.length) {
        const [row, col] = shuffledPositions[i];
        this.game.grid[row][col].color = block.color;
        this.game.grid[row][col].hp = block.hp;
        this.game.grid[row][col].playerId = block.playerId;
        this.game.grid[row][col].waveNumber = block.waveNumber;
      }
    });

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: true };
  }
}