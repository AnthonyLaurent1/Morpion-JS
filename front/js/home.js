// Configuration
const SERVER_URL = window.location.origin;

// Fonction pour charger et afficher le leaderboard
function loadLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard');
  
  fetch(`${SERVER_URL}/api/leaderboard`)
    .then(response => response.json())
    .then(response => {
      if (!response.success) {
        throw new Error(response.message);
      }
      
      const rankings = response.data;
      if (!rankings || rankings.length === 0) {
        leaderboardEl.innerHTML = `
          <div class="no-players-message">
            Aucun joueur classé pour le moment.<br>
            Soyez le premier à remporter une victoire !
          </div>
        `;
        return;
      }

      // ✅ Afficher uniquement les 6 premiers joueurs
      const topPlayers = rankings.slice(0, 6);

      leaderboardEl.innerHTML = topPlayers.map((player, index) => `
        <div class="player-rank">
          <div class="rank-number">${index + 1}</div>
          <div class="rank-info">
            <div class="rank-name">${player.pseudo}</div>
            <div class="rank-trophies">
              <span class="trophy-icon">🏆</span>
              ${player.trophies}
            </div>
          </div>
        </div>
      `).join('');

      // ✅ Si plus de 6 joueurs existent, activer un scroll doux
      if (rankings.length > 6) {
        leaderboardEl.style.maxHeight = '350px';
        leaderboardEl.style.overflowY = 'auto';
      } else {
        leaderboardEl.style.maxHeight = 'none';
        leaderboardEl.style.overflowY = 'visible';
      }
    })
    .catch(error => {
      console.error('Erreur lors du chargement du classement:', error);
      leaderboardEl.innerHTML = `
        <div class="no-players-message">
          Impossible de charger le classement.<br>
          Veuillez réessayer plus tard.
        </div>
      `;
    });
}

// Charger le leaderboard au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  loadLeaderboard();
});

const pseudoInput = document.getElementById('pseudo');
const gameIdInput = document.getElementById('gameId');
const joinBtn = document.getElementById('joinBtn');
const errorMsg = document.getElementById('errorMsg');
const classCards = document.querySelectorAll('.class-card');

// État
let selectedClass = null;

// Initialisation
classCards.forEach(card => {
  card.addEventListener('click', () => {
    // Retirer la sélection précédente
    classCards.forEach(c => c.classList.remove('selected'));
    
    // Sélectionner la nouvelle classe
    card.classList.add('selected');
    selectedClass = card.dataset.class;
    
    // Activer le bouton
    joinBtn.disabled = false;
    errorMsg.textContent = '';
  });
});

joinBtn.addEventListener('click', () => {
  if (!selectedClass) {
    showError('Veuillez sélectionner une classe');
    return;
  }

  const pseudo = pseudoInput.value.trim();
  const gameId = gameIdInput.value.trim();

  // Validation du pseudo
  if (pseudo && (pseudo.length < 3 || pseudo.length > 20)) {
    showError('Le pseudo doit faire entre 3 et 20 caractères');
    return;
  }

  // Générer un pseudo aléatoire si non fourni
  const finalPseudo = pseudo || `Joueur${Math.floor(Math.random() * 9999)}`;

  sessionStorage.setItem('playerClass', selectedClass);
  sessionStorage.setItem('playerPseudo', finalPseudo);
  
  if (gameId) {
    if (!gameId.match(/^\d+$/)) {
      showError('Le code de partie doit être un nombre');
      return;
    }
    sessionStorage.setItem('gameId', gameId);
  } else {
    sessionStorage.removeItem('gameId');
  }

  window.location.href = './waiting.html';
});

// Afficher une erreur
function showError(message) {
  errorMsg.textContent = message;
  setTimeout(() => {
    errorMsg.textContent = '';
  }, 3000);
}

// Permettre d'appuyer sur Entrée pour rejoindre
gameIdInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !joinBtn.disabled) {
    joinBtn.click();
  }
});

// ===== CARROUSEL DE CLASSES =====
const carousel = document.querySelector('.classes-grid');
const leftBtn = document.querySelector('.carousel-btn.left');
const rightBtn = document.querySelector('.carousel-btn.right');

if (carousel && leftBtn && rightBtn) {
  leftBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -200, behavior: 'smooth' });
  });
  rightBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 200, behavior: 'smooth' });
  });
}
