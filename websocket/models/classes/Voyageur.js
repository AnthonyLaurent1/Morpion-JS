// ============================================================================
// models/classes/Voyageur.js
// Classe Voyageur - Arrête le temps pour les autres pendant 5s
// ============================================================================

import Player from '../Player.js';

export default class Voyageur extends Player {
  constructor(playerId, color, game) {
    super(playerId, color, game);
    this.className = 'voyageur';
    this.abilityCooldown = 15000; // 15s
    this.timeStopActive = false;
  }

  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'cooldown' };
    }

    // Activer l'arrêt du temps
    this.timeStopActive = true;

    // Sauvegarder les cooldowns actuels des autres joueurs
    const otherPlayers = this.game.players.filter(p => p.playerId !== this.playerId);
    const savedCooldowns = otherPlayers.map(p => ({
      player: p,
      lastPlace: p.lastPlace,
      lastDestroy: p.lastDestroy,
      lastAbility: p.lastAbility
    }));

    // Geler les actions des autres joueurs
    otherPlayers.forEach(p => {
      p.frozen = true;
    });

    // Notifier tous les joueurs
    this.game.io.to(`game_${this.game.gameId}`).emit('time_stop_start', {
      voyageurId: this.playerId,
      duration: 5000
    });

    // Débloquer après 5s
    const timer = setTimeout(() => {
      this.timeStopActive = false;
      
      // Restaurer l'état des autres joueurs et ajuster leurs cooldowns
      const timeElapsed = 5000;
      savedCooldowns.forEach(({ player, lastPlace, lastDestroy, lastAbility }) => {
        player.frozen = false;
        // Ajuster les timestamps pour compenser le temps gelé
        player.lastPlace = lastPlace + timeElapsed;
        player.lastDestroy = lastDestroy + timeElapsed;
        player.lastAbility = lastAbility + timeElapsed;
      });

      this.game.io.to(`game_${this.game.gameId}`).emit('time_stop_end', {
        voyageurId: this.playerId
      });
    }, 5000);
    this.timers.push(timer);

    this.lastAbility = Date.now();
    return { success: true };
  }
}