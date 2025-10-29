// ============================================================================
// models/classes/Roulette.js
// Classe Roulette - Pose 2 blocs aléatoires sur une même ligne
// ============================================================================

import Player from "../Player.js";

export default class Roulette extends Player {
  constructor(playerId, color, game) {
    super(playerId, color, game);
    this.className = "roulette";
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: "not_charged" };
    }

    if (x < 0 || x >= 5) {
      return { success: false, reason: "out_of_bounds" };
    }

    const emptyCells = [];
    for (let col = 0; col < 5; col++) {
      if (this.game.grid[x][col].color === null) {
        emptyCells.push(col);
      }
    }

    if (emptyCells.length < 2) {
      return { success: false, reason: "not_enough_empty_cells" };
    }

    const shuffled = emptyCells.sort(() => Math.random() - 0.5);
    const [col1, col2] = shuffled.slice(0, 2);

    this.game.grid[x][col1].color = this.color;
    this.game.grid[x][col1].hp = 1;
    this.game.grid[x][col1].playerId = this.playerId;
    this.game.grid[x][col1].waveNumber = this.game.waveNumber;

    this.game.grid[x][col2].color = this.color;
    this.game.grid[x][col2].hp = 1;
    this.game.grid[x][col2].playerId = this.playerId;
    this.game.grid[x][col2].waveNumber = this.game.waveNumber;

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    return { success: true };
  }
}
