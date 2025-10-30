// ============================================================================
// models/classes/Nuke.js
// Classe Nuke - Pouvoir unique disponible toutes les 5 vagues
// ============================================================================

import Player from '../Player.js';

export default class Nuke extends Player {
  constructor(playerId, color, game, pseudo) {
    super(playerId, color, game, pseudo);
    this.className = 'nuke';
    this.abilityMaxCharges = 1;  // Une seule charge à la fois
    this.abilityCharges = this.abilityMaxCharges;
    this.lastChargeWave = 0;  // Vague où le pouvoir a été utilisé/rechargé en dernier
    this.WAVES_BETWEEN_CHARGES = 5;  // Attendre 5 vagues entre les charges
  }

  // Override resetWave pour éviter la recharge automatique à chaque vague
  resetWave() {
    this.actionPoints += 1;
    this.hasSkipped = false;
    this.abilityUsedThisWave = false;

    // Vérifier si on doit recharger le pouvoir
    const wavesSinceLastUse = this.game.waveNumber - this.lastChargeWave;
    if (wavesSinceLastUse >= this.WAVES_BETWEEN_CHARGES && this.abilityCharges === 0) {
      this.abilityCharges = 1;
      this.lastChargeWave = this.game.waveNumber;
    }
  }

  // Override canUseAbility pour vérifier le cooldown de 5 vagues
  canUseAbility() {
    return (
      this.abilityCharges > 0 &&  // Doit avoir une charge
      !this.abilityUsedThisWave &&  // Ne peut pas l'utiliser deux fois dans la même vague
      this.actionPoints > 0  // Doit avoir au moins 1 point d'action
    );
  }

  // Effet principal de la Nuke
  useAbility(x, y) {
    if (!this.canUseAbility()) {
      return { success: false, reason: 'not_charged' };
    }

    // Détruire toute la grille
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        this.game.grid[i][j] = {
          color: null,
          hp: 0,
          playerId: null,
          waveNumber: null
        };
      }
    }

    // Placer 3 blocs aléatoires neutres
    let blocksPlaced = 0;
    let attempts = 0;
    const maxAttempts = 20;  // Éviter une boucle infinie

    while (blocksPlaced < 3 && attempts < maxAttempts) {
      const randX = Math.floor(Math.random() * 5);
      const randY = Math.floor(Math.random() * 5);

      if (!this.game.grid[randX][randY].color) {  // Case vide
        this.game.grid[randX][randY] = {
          color: '#808080',  // Couleur grise/neutre
          hp: 1,
          playerId: this.playerId,
          waveNumber: this.game.waveNumber
        };
        blocksPlaced++;
      }
      attempts++;
    }

    if (blocksPlaced < 3) {
      return { success: false, reason: 'placement_failed' };
    }

    // Mise à jour des compteurs
    this.abilityCharges--;
    this.abilityUsedThisWave = true;
    this.lastChargeWave = this.game.waveNumber;
    this.actionPoints--;

    return { success: true };
  }
}