// ============================================================================
// animations.js
// Système d'animations pour le Morpion 4 Joueurs
// ============================================================================

const AnimationSystem = {
  // Configuration des particules
  config: {
    particleCount: 12,
    particleLifetime: 600,
    explosionRadius: 80,
    shuffleDistance: 100,
    shakeDuration: 300
  },

  // ==================== DESTRUCTION DE BLOC ====================
  
  /**
   * Créer une explosion de particules lors de la destruction d'un bloc
   * @param {HTMLElement} cellElement - L'élément DOM de la cellule
   * @param {string} color - La couleur du bloc détruit
   */
  destroyBlock(cellElement, color) {
    const rect = cellElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Créer le conteneur de particules
    const container = document.createElement('div');
    container.className = 'particle-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(container);

    // Générer les particules
    for (let i = 0; i < this.config.particleCount; i++) {
      this.createParticle(container, centerX, centerY, color, i);
    }

    // Animation de pulsation de la cellule
    cellElement.style.animation = 'cellDestroy 0.3s ease-out';
    
    // Nettoyer après l'animation
    setTimeout(() => {
      container.remove();
    }, this.config.particleLifetime);

    setTimeout(() => {
      cellElement.style.animation = '';
    }, 300);
  },

  /**
   * Créer une particule individuelle
   */
  createParticle(container, x, y, color, index) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Calculer l'angle et la vitesse
    const angle = (Math.PI * 2 * index) / this.config.particleCount;
    const velocity = 0.8 + Math.random() * 0.4;
    const size = 6 + Math.random() * 6;
    
    const dx = Math.cos(angle) * this.config.explosionRadius * velocity;
    const dy = Math.sin(angle) * this.config.explosionRadius * velocity;

    particle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 8px ${color};
    `;

    container.appendChild(particle);

    // Animation avec requestAnimationFrame pour plus de fluidité
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = elapsed / this.config.particleLifetime;

      if (progress >= 1) {
        particle.remove();
        return;
      }

      // Calcul de la position avec gravité
      const currentX = x + dx * progress;
      const currentY = y + dy * progress + (progress * progress * 50); // Gravité
      const opacity = 1 - progress;
      const scale = 1 - progress * 0.5;

      particle.style.transform = `translate(-50%, -50%) translate(${currentX - x}px, ${currentY - y}px) scale(${scale})`;
      particle.style.opacity = opacity;

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },

  // ==================== EXPLOSION (BOMBMAN) ====================
  
  /**
   * Animation d'explosion en croix
   * @param {HTMLElement} cellElement - La cellule centrale
   * @param {Array<HTMLElement>} affectedCells - Les cellules touchées
   */
  explosion(cellElement, affectedCells = []) {
    // Onde de choc centrale
    const shockwave = document.createElement('div');
    shockwave.className = 'shockwave';
    const rect = cellElement.getBoundingClientRect();
    
    shockwave.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, rgba(255,100,50,0.8), transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      animation: shockwaveExpand 0.4s ease-out;
    `;
    
    document.body.appendChild(shockwave);

    // Flash sur la cellule centrale
    cellElement.style.animation = 'explosionFlash 0.3s ease-out';

    // Effet sur les cellules affectées
    affectedCells.forEach((cell, i) => {
      setTimeout(() => {
        cell.style.animation = 'explosionImpact 0.3s ease-out';
        
        // Particules de débris
        if (cell.style.backgroundColor) {
          this.destroyBlock(cell, cell.style.backgroundColor);
        }
      }, i * 40);
    });

    // Nettoyer
    setTimeout(() => {
      shockwave.remove();
      cellElement.style.animation = '';
      affectedCells.forEach(cell => {
        cell.style.animation = '';
      });
    }, 500);
  },

  // ==================== SHUFFLE ====================
  
  /**
   * Animation de mélange de la grille
   * @param {Array<HTMLElement>} cells - Toutes les cellules de la grille
   */
  shuffle(cells) {
    // Phase 1: Shake violent
    cells.forEach((cell, i) => {
      setTimeout(() => {
        cell.style.animation = 'shuffleShake 0.5s ease-in-out';
      }, i * 10);
    });

    // Phase 2: Rotation et dispersion
    setTimeout(() => {
      cells.forEach((cell, i) => {
        const angle = Math.random() * 360;
        const distance = 50 + Math.random() * 50;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        
        cell.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.4s';
        cell.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(0.5)`;
        cell.style.opacity = '0.3';
      });
    }, 500);

    // Phase 3: Retour en place
    setTimeout(() => {
      cells.forEach(cell => {
        cell.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s';
        cell.style.transform = '';
        cell.style.opacity = '';
      });
    }, 900);

    // Nettoyer
    setTimeout(() => {
      cells.forEach(cell => {
        cell.style.animation = '';
        cell.style.transition = '';
      });
    }, 1500);
  },

  // ==================== AUTRES POUVOIRS ====================

  /**
   * Animation pour le pouvoir Parieur (zone 3x3 + blocs aléatoires)
   */
  parieur(centerCell, affectedCells) {
    // Rotation de dé animée au centre
    const dice = document.createElement('div');
    dice.textContent = '🎲';
    dice.className = 'dice-animation';
    const rect = centerCell.getBoundingClientRect();
    
    dice.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      font-size: 48px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      animation: diceRoll 0.6s ease-out;
    `;
    
    document.body.appendChild(dice);

    // Effet de dispersion sur les cellules
    affectedCells.forEach((cell, i) => {
      setTimeout(() => {
        cell.style.animation = 'zoneImpact 0.3s ease-out';
      }, i * 30);
    });

    setTimeout(() => {
      dice.remove();
      affectedCells.forEach(cell => {
        cell.style.animation = '';
      });
    }, 700);
  },

  /**
   * Animation pour Bombwoman (ligne/colonne)
   */
  bombwoman(affectedCells, isRow) {
    // Vague de destruction
    affectedCells.forEach((cell, i) => {
      setTimeout(() => {
        cell.style.animation = 'lineDestroy 0.4s ease-out';
        
        // Traînée lumineuse
        const trail = document.createElement('div');
        const rect = cell.getBoundingClientRect();
        trail.className = 'destruction-trail';
        
        trail.style.cssText = `
          position: fixed;
          left: ${rect.left}px;
          top: ${rect.top}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
          background: linear-gradient(90deg, transparent, rgba(255,100,150,0.6), transparent);
          pointer-events: none;
          z-index: 9997;
          animation: trailFade 0.5s ease-out;
        `;
        
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 500);
      }, i * 60);
    });

    setTimeout(() => {
      affectedCells.forEach(cell => {
        cell.style.animation = '';
      });
    }, 800);
  },

};

// ==================== EXPORT ====================
// Pour utilisation dans game.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationSystem;
}