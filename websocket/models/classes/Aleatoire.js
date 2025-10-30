import Player from '../Player.js';

export default class Aleatoire extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'aleatoire';
    this.currentAbility = null;
    this.selectRandomAbility();
  }

  selectRandomAbility() {
    const abilities = ['bombman', 'bombwoman', 'parieur', 'shuffle'];
    this.currentAbility = abilities[Math.floor(Math.random() * abilities.length)];
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    this.abilityCharges = 0;
    this.abilityUsedThisWave = true;
    let result = { success: false };

    switch (this.currentAbility) {
      case 'bombman':
        result = this.bombmanAbility(x, y);
        break;
      case 'bombwoman':
        result = this.bombwomanAbility(x, y);
        break;
      case 'parieur':
        result = this.parieurAbility(x, y);
        break;

      case 'shuffle':
        result = this.shuffleAbility();
        break;
    }

    if (result.success) {
      this.selectRandomAbility();
    }

    return result;
  }

  bombmanAbility(x, y) {
    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    const positions = [
      [x, y],
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];

    positions.forEach(([px, py]) => {
      if (px >= 0 && px < 5 && py >= 0 && py < 5) {
        const cell = this.game.grid[px][py];
        cell.color = null;
        cell.hp = 0;
        cell.playerId = null;
      }
    });

    return { success: true };
  }

  bombwomanAbility(x, y) {
    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    for (let i = 0; i < 5; i++) {
      this.game.grid[x][i].color = null;
      this.game.grid[x][i].hp = 0;
      this.game.grid[x][i].playerId = null;
    }

    return { success: true };
  }

  parieurAbility(x, y) {
    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
          this.game.grid[nx][ny].color = null;
          this.game.grid[nx][ny].hp = 0;
          this.game.grid[nx][ny].playerId = null;
        }
      }
    }

    const colors = this.game.players.map(p => p.color);
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(Math.random() * 5);
      const ry = Math.floor(Math.random() * 5);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      this.game.grid[rx][ry].color = randomColor;
      this.game.grid[rx][ry].hp = 1;
      this.game.grid[rx][ry].playerId = this.playerId;
    }

    return { success: true };
  }



  shuffleAbility() {
    const blocks = [];
    
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.game.grid[i][j].color !== null) {
          blocks.push({
            color: this.game.grid[i][j].color,
            hp: this.game.grid[i][j].hp,
            playerId: this.game.grid[i][j].playerId
          });
          this.game.grid[i][j].color = null;
          this.game.grid[i][j].hp = 0;
          this.game.grid[i][j].playerId = null;
        }
      }
    }

    for (let i = blocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }

    let blockIndex = 0;
    for (let i = 0; i < 5 && blockIndex < blocks.length; i++) {
      for (let j = 0; j < 5 && blockIndex < blocks.length; j++) {
        if (this.game.grid[i][j].color === null) {
          this.game.grid[i][j].color = blocks[blockIndex].color;
          this.game.grid[i][j].hp = blocks[blockIndex].hp;
          this.game.grid[i][j].playerId = blocks[blockIndex].playerId;
          blockIndex++;
        }
      }
    }

    return { success: true };
  }
}
