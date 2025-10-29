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

// Rejoindre une partie
joinBtn.addEventListener('click', () => {
  if (!selectedClass) {
    showError('Veuillez sélectionner une classe');
    return;
  }

  const gameId = gameIdInput.value.trim();

  // Stocker les informations dans sessionStorage
  sessionStorage.setItem('playerClass', selectedClass);
  if (gameId) {
    sessionStorage.setItem('gameId', gameId);
  } else {
    sessionStorage.removeItem('gameId');
  }

  // Rediriger vers la salle d'attente
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