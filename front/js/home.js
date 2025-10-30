// Configuration
const SERVER_URL = window.location.origin;

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