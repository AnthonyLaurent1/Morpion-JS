// ============================================================================
// models/Game.js
// Logique principale d'une partie
// ============================================================================

import Player from './Player.js';
import * as Classes from './classes/index.js';
import RankingManager from './RankingManager.js';

export default class Game {
  constructor(gameId, io) {
    this.gameId = gameId;
    this.io = io;
    this.players = [];
    this.grid = this.generateGrid();
    this.started = false;
    this.waveNumber = 0;
    this.waveTimer = null;
    this.WAVE_DURATION = 10000;
    this.colors = ['#e74c3c', '#3498db', '#16a34a', '#f59e0b'];
    this.availableColors = [...this.colors];
    this.playerActions = new Map();
  }

  generateGrid() {
    const grid = [];
    for (let i = 0; i < 5; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        row.push({ color: null, hp: 0, playerId: null, waveNumber: null });
      }
      grid.push(row);
    }
    return grid;
  }

  addPlayer(socket, playerClass, pseudo = '') {
    if (this.players.length >= 4) return false;
    if (this.players.some(p => p.className === playerClass)) return false;

    const color = this.availableColors.shift();
    const PlayerClass = this.getPlayerClass(playerClass);
    
    if (!pseudo) {
      pseudo = this.generateRandomPseudo();
    }
    
    const player = new PlayerClass(socket.id, color, this, pseudo);
    
    this.players.push(player);
    console.log(`Joueur ${pseudo} (${socket.id}) a rejoint la partie ${this.gameId} avec la classe ${playerClass}`);
    
    return true;
  }

  generateRandomPseudo() {
    const pseudos = [
      'Jean-Passe', 'Marie-Olette', 'Pierre-Fect', 'Sophie-Stiqué',
      'Paul-Ochon', 'Julie-Ette', 'Marc-Hand', 'Anne-Anas',
      'Luc-Arne', 'Emma-Nuelle', 'Tom-Ate', 'Clara-Vate',
      'Hugo-Lant', 'Léa-Zard', 'Max-Imum', 'Chloé-Ture',
      'Alex-Térieur', 'Sarah-Phin', 'Lucas-Cade', 'Zoé-Nith',
      'Théo-Rie', 'Inès-Péré', 'Nathan-Tique', 'Manon-Yme',
      'Arthur-Mite', 'Camille-Éon', 'Louis-Tique', 'Jade-Ite',
      'Gabriel-Ium', 'Lily-Acé', 'Raphaël-Ectrique', 'Nina-Teur'
    ];
    return pseudos[Math.floor(Math.random() * pseudos.length)];
  }

  getPlayerClass(className) {
    const classMap = {
      'bombman': Classes.Bombman,
      'parieur': Classes.Parieur,
      'bombwoman': Classes.Bombwoman,
      'fast': Classes.Fast,
      'solide': Classes.Solide,
      'shuffle': Classes.Shuffle,
      'aleatoire': Classes.Aleatoire,
      'nuke': Classes.Nuke
    };
    return classMap[className.toLowerCase()] || Player;
  }

  // Retirer un joueur
  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.playerId === socketId);
    if (index !== -1) {
      const player = this.players[index];
      this.availableColors.push(player.color);
      this.players.splice(index, 1);
      
      this.io.to(`game_${this.gameId}`).emit('player_left', {
        playerId: socketId,
        remainingPlayers: this.players.length
      });

      // Arrêter la partie si moins de 2 joueurs
      if (this.players.length < 2 && this.started) {
        this.endGame('not_enough_players');
      }
    }
  }

  // Obtenir un joueur
  getPlayer(socketId) {
    return this.players.find(p => p.playerId === socketId);
  }

  // Démarrer la partie
  startGame() {
    this.started = true;
    this.waveNumber = 1;
    console.log(`Partie ${this.gameId} démarrée avec ${this.players.length} joueurs`);
    
    this.io.to(`game_${this.gameId}`).emit('game_started', {
      message: 'La partie commence !',
      players: this.players.map(p => ({
        id: p.playerId,
        color: p.color,
        class: p.className
      }))
    });

    this.startWave();
  }

  startWave() {
    this.players.forEach(player => {
      player.resetWave();
    });

    this.io.to(`game_${this.gameId}`).emit('wave_start', {
      waveNumber: this.waveNumber,
      duration: this.WAVE_DURATION
    });

    this.waveTimer = setTimeout(() => {
      this.endWave();
    }, this.WAVE_DURATION);
  }

  // Terminer une vague
  endWave() {
    if (this.waveTimer) {
      clearTimeout(this.waveTimer);
      this.waveTimer = null;
    }

    this.io.to(`game_${this.gameId}`).emit('wave_end', {
      waveNumber: this.waveNumber
    });

    // Vérifier la victoire
    const winner = this.checkWin();
    if (winner) {
      this.endGame('victory', winner);
      return;
    }

    // Passer à la vague suivante
    this.waveNumber++;
    setTimeout(() => {
      if (this.started) {
        this.startWave();
      }
    }, 2000);
  }

  placeBlock(playerId, x, y) {
    const player = this.getPlayer(playerId);
    if (!player || !this.started) return;

    const result = player.placeBlock(x, y);
    if (result.success) {
      this.broadcastGameState();
      this.checkWaveComplete();
    }
  }

  destroyBlock(playerId, x, y) {
    const player = this.getPlayer(playerId);
    if (!player || !this.started) return;

    const result = player.destroyBlock(x, y);
    if (result.success) {
      this.broadcastGameState();
      this.checkWaveComplete();
    }
  }

  useAbility(playerId, x, y) {
    const player = this.getPlayer(playerId);
    if (!player || !this.started) return;

    const result = player.useAbility(x, y);
    if (result.success) {
      this.broadcastGameState();
      this.checkWaveComplete();
    }
  }

  checkWaveComplete() {
    const allPlayersFinished = this.players.every(p => p.actionPoints === 0);
    
    if (allPlayersFinished) {
      if (this.waveTimer) {
        clearTimeout(this.waveTimer);
      }
      this.endWave();
    }
  }

  skipTurn(playerId) {
    const player = this.getPlayer(playerId);
    if (!player || !this.started) return;

    player.hasSkipped = true;
    player.actionPoints = 0;
    this.broadcastGameState();
    this.checkWaveComplete();
  }

  // Vérifier la victoire
  checkWin() {
    const winLength = 3;
    const size = 5;

    // Vérifier horizontalement
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const first = this.grid[row][col];
        if (first.color && first.color !== null) {
          let matches = true;
          for (let k = 1; k < winLength; k++) {
            if (this.grid[row][col + k].color !== first.color) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return this.players.find(p => p.color === first.color);
          }
        }
      }
    }

    // Vérifier verticalement
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - winLength; row++) {
        const first = this.grid[row][col];
        if (first.color && first.color !== null) {
          let matches = true;
          for (let k = 1; k < winLength; k++) {
            if (this.grid[row + k][col].color !== first.color) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return this.players.find(p => p.color === first.color);
          }
        }
      }
    }

    // Vérifier diagonale ↘
    for (let row = 0; row <= size - winLength; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const first = this.grid[row][col];
        if (first.color && first.color !== null) {
          let matches = true;
          for (let k = 1; k < winLength; k++) {
            if (this.grid[row + k][col + k].color !== first.color) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return this.players.find(p => p.color === first.color);
          }
        }
      }
    }

    // Vérifier diagonale ↗
    for (let row = winLength - 1; row < size; row++) {
      for (let col = 0; col <= size - winLength; col++) {
        const first = this.grid[row][col];
        if (first.color && first.color !== null) {
          let matches = true;
          for (let k = 1; k < winLength; k++) {
            if (this.grid[row - k][col + k].color !== first.color) {
              matches = false;
              break;
            }
          }
          if (matches) {
            return this.players.find(p => p.color === first.color);
          }
        }
      }
    }

    return null;
  }

  // Terminer la partie
  endGame(reason, winner = null) {
    this.started = false;
    
    if (this.waveTimer) {
      clearTimeout(this.waveTimer);
      this.waveTimer = null;
    }

    // Nettoyer les timers des joueurs
    this.players.forEach(p => p.cleanup());

    // Mise à jour des classements si la partie s'est terminée normalement
    if (reason === 'victory' && this.players.length >= 2) {
      console.log('Mise à jour des classements...');
      try {
        RankingManager.updateGameResults(winner, this.players);
        console.log('Classements mis à jour avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour des classements:', error);
      }
    }

    // Envoyer les résultats de la partie, y compris les changements de trophées
    this.io.to(`game_${this.gameId}`).emit('game_over', {
      reason,
      winner: winner ? {
        id: winner.playerId,
        color: winner.color,
        class: winner.className,
        pseudo: winner.pseudo,
        trophyChange: 50 // Le gagnant gagne 50 trophées
      } : null,
      otherPlayers: winner ? this.players
        .filter(p => p.playerId !== winner.playerId)
        .map(p => ({
          id: p.playerId,
          pseudo: p.pseudo,
          trophyChange: -30 // Les perdants perdent 30 trophées
        })) : []
    });

    console.log(`Partie ${this.gameId} terminée. Raison: ${reason}`);
  }

  // Diffuser l'état du jeu
  broadcastGameState() {
    this.io.to(`game_${this.gameId}`).emit('game_state_update', this.getGameState());
  }

  getGameState() {
    return {
      gameId: this.gameId,
      waveNumber: this.waveNumber,
      grid: this.grid,
      players: this.players.map(p => ({
        id: p.playerId,
        color: p.color,
        class: p.className,
        pseudo: p.pseudo,
        actionPoints: p.actionPoints,
        hasSkipped: p.hasSkipped,
        canPlace: p.canPlace(),
        canDestroy: p.canDestroy(),
        canUseAbility: p.canUseAbility(),
        abilityCharges: p.abilityCharges,
        currentAbility: p.currentAbility || null,
        lastChargeWave: p.lastChargeWave || 0
      })),
      started: this.started
    };
  }
}