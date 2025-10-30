// Configuration
// Socket.IO utilise http/https, pas ws/wss
const SERVER_URL = window.location.origin;

const playerClass = sessionStorage.getItem('playerClass');
const gameId = sessionStorage.getItem('gameId');
const playerPseudo = sessionStorage.getItem('playerPseudo') || '';

if (!playerClass) {
  window.location.href = './index.html';
}

// Configuration de la connexion Socket.IO
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  transports: ['websocket', 'polling']
});

// Gestion des erreurs de connexion
socket.on('connect_error', (error) => {
  console.error('Erreur de connexion:', error);
  alert(`Impossible de se connecter au serveur: ${error.message}. Vérifiez que le serveur est en cours d'exécution et que vous êtes connecté au bon réseau.`);
  window.location.href = './index.html';
});

socket.on('connect_timeout', () => {
  console.error('Délai de connexion dépassé');
  alert('Le serveur ne répond pas. Vérifiez votre connexion réseau.');
});

// Éléments DOM
const gameCodeEl = document.getElementById('gameCode');
const playerCountEl = document.getElementById('playerCount');
const playersListEl = document.getElementById('playersList');
const leaveBtn = document.getElementById('leaveBtn');
const startGameBtn = document.getElementById('startGameBtn');

// État local
let currentGameId = null;
let myPlayerId = null;
let playerRankings = new Map(); // Map pour stocker les trophées par pseudo

// Classes avec leurs icônes
const classIcons = {
  'bombman': '💣',
  'parieur': '🎲',
  'bombwoman': '💥',
  'flash': '⚡',
  'solide': '🛡️',
  'shuffle': '🔀',
  'aleatoire': '🎲',
  'nuke': '☢️'
};

const classNames = {
  'bombman': 'Bombman',
  'parieur': 'Le Parieur',
  'bombwoman': 'Bombwoman',
  'flash': 'Le Flash',
  'solide': 'Le Solide',
  'shuffle': 'Le Shuffle',
  'aleatoire': 'L\'Aléatoire',
  'nuke': 'Le Nuke'
};

socket.emit('join_game', {
  gameId: gameId ? parseInt(gameId) : null,
  playerClass: playerClass,
  pseudo: playerPseudo
});

  // Succès de la connexion
socket.on('join_success', (data) => {
  currentGameId = data.gameId;
  myPlayerId = data.playerId;
  
  // Stocker le gameId dans sessionStorage pour la reconnexion
  sessionStorage.setItem('gameId', data.gameId);
  
  gameCodeEl.textContent = data.gameId;

  // Récupérer les classements pour obtenir les ELO
  fetch(`${SERVER_URL}/api/leaderboard`)
    .then(response => response.json())
    .then(response => {
      console.log('Réponse du leaderboard:', response); // Pour debug
      if (response.success) {
        playerRankings.clear(); // Nettoyer l'ancienne map
        response.data.forEach(player => {
          if (player.pseudo && typeof player.elo === 'number') {
            playerRankings.set(player.pseudo, player.elo);
          }
        });
        console.log('ELO des joueurs:', playerRankings); // Pour debug
        const gameState = socket.volatile.gameState;
        if (gameState && gameState.players) {
          updatePlayersList(gameState.players);
        }
      }
    })
    .catch(error => console.error('Erreur lors de la récupération des classements:', error));
  
  console.log('Connexion réussie:', data);
});// Erreur de connexion
socket.on('join_error', (data) => {
  alert(data.message);
  window.location.href = './index.html';
});

// Mise à jour de l'état du jeu
socket.on('game_state_update', (state) => {
  updatePlayersList(state.players);
  // Activer le bouton démarrer si min 2 joueurs et partie pas commencée
  if (startGameBtn) {
    startGameBtn.disabled = !(state.players.length >= 2 && !state.started);
  }
});

// Partie démarrée
socket.on('game_started', (data) => {
  console.log('La partie commence!');
  
  // Stocker les informations de la partie
  sessionStorage.setItem('gameStarted', 'true');
  
  // IMPORTANT: Ne pas déconnecter le socket, il sera réutilisé dans game.html
  // On stocke l'ID du socket pour debug
  sessionStorage.setItem('socketId', socket.id);
  console.log('Redirection vers game.html avec socket:', socket.id);
  
  // Rediriger vers la page de jeu
  window.location.href = './game.html';
});

// Joueur parti
socket.on('player_left', (data) => {
  console.log('Joueur parti:', data.playerId);
});

// Démarrer la partie manuellement
if (startGameBtn) {
  startGameBtn.addEventListener('click', () => {
    socket.emit('start_game');
  });
}

socket.on('start_error', (data) => {
  alert(data.message || 'Impossible de démarrer la partie');
});

// Mise à jour de la liste des joueurs
function updatePlayersList(players) {
  playerCountEl.textContent = players.length;
  
  playersListEl.innerHTML = '';
  
  players.forEach(player => {
    const isMe = player.id === myPlayerId;
    
    const card = document.createElement('div');
    card.className = 'player-card' + (isMe ? ' you' : '');
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'player-color';
    colorDiv.style.backgroundColor = player.color;  
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'player-info';
    
    const nameP = document.createElement('p');
    nameP.className = 'player-name';
    nameP.textContent = isMe ? `Vous (${player.pseudo})` : player.pseudo;
    
    const classP = document.createElement('p');
    classP.className = 'player-class';
    classP.textContent = `${classIcons[player.class]} ${classNames[player.class]}`;
    
    const eloDiv = document.createElement('div');
    eloDiv.className = 'player-trophies'; // Garder la même classe pour le style
    
    const eloIcon = document.createElement('span');
    eloIcon.className = 'trophy-icon';
    eloIcon.textContent = '�️';
    
    const eloCount = document.createElement('span');
    eloCount.className = 'trophy-count';
    const elo = playerRankings.has(player.pseudo) ? playerRankings.get(player.pseudo) : 1000;
    console.log(`ELO pour ${player.pseudo}:`, elo); // Pour debug
    eloCount.textContent = elo;
    
    eloDiv.appendChild(eloIcon);
    eloDiv.appendChild(eloCount);
    
    infoDiv.appendChild(nameP);
    infoDiv.appendChild(classP);
    infoDiv.appendChild(eloDiv);
    
    card.appendChild(colorDiv);
    card.appendChild(infoDiv);
    
    if (isMe) {
      const badge = document.createElement('span');
      badge.className = 'player-badge';
      badge.textContent = 'VOUS';
      card.appendChild(badge);
    }
    
    playersListEl.appendChild(card);
  });
}

// Quitter la partie
leaveBtn.addEventListener('click', () => {
  socket.disconnect();
  sessionStorage.clear();
  window.location.href = './index.html';
});

// Gestion de la fermeture de la page
window.addEventListener('beforeunload', () => {
  if (!sessionStorage.getItem('gameStarted')) {
    socket.disconnect();
  }
});