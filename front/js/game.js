// Configuration
const SERVER_URL = window.location.origin;

// Vérifier si le joueur vient de la salle d'attente
const gameStarted = sessionStorage.getItem('gameStarted');
const playerClass = sessionStorage.getItem('playerClass');

if (!gameStarted || !playerClass) {
  window.location.href = './index.html';
}

// Connexion Socket.IO avec reconnexion immédiate
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 100, // Reconnexion très rapide (100ms)
  reconnectionDelayMax: 500,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

// Gestion des erreurs de connexion
socket.on('connect_error', (error) => {
  console.error('Erreur de connexion:', error);
});

socket.on('join_error', (data) => {
  console.error('Erreur de connexion à la partie:', data.message);
  alert(`Erreur: ${data.message}`);
  window.location.href = './index.html';
});

const gameId = sessionStorage.getItem('gameId');
const oldSocketId = sessionStorage.getItem('socketId');
const playerPseudo = sessionStorage.getItem('playerPseudo') || '';

socket.on('connect', () => {
  console.log('✅ Connexion établie avec nouveau socket:', socket.id);
  console.log('📝 Ancien socket:', oldSocketId);
  console.log('🎮 Tentative de reconnexion à la partie:', gameId, 'avec la classe:', playerClass);
  
  socket.emit('join_game', {
    gameId: gameId ? parseInt(gameId) : null,
    playerClass: playerClass,

    pseudo: playerPseudo || sessionStorage.getItem('playerPseudo') || 'Joueur' + Math.floor(Math.random() * 9999)
  });
});

// Confirmation de reconnexion
socket.on('join_success', (data) => {
  console.log('✅ Reconnexion réussie!', data);
  if (data.reconnected) {
    console.log('🔄 Reconnexion détectée par le serveur');
  }
});

// Éléments DOM
const boardEl = document.getElementById('board');
const waveNumberEl = document.getElementById('waveNumber');
const waveTimerEl = document.getElementById('waveTimer');
const playersListEl = document.getElementById('playersList');
const classInfoEl = document.getElementById('classInfo');
const statusMessageEl = document.getElementById('statusMessage');

const placeModeBtn = document.getElementById('placeModeBtn');
const destroyModeBtn = document.getElementById('destroyModeBtn');
const abilityModeBtn = document.getElementById('abilityModeBtn');
const skipTurnBtn = document.getElementById('skipTurnBtn');

const placeCooldownEl = document.getElementById('placeCooldown');
const destroyCooldownEl = document.getElementById('destroyCooldown');
const abilityCooldownEl = document.getElementById('abilityCooldown');
const actionPointsDisplay = document.getElementById('actionPointsDisplay');

const waveOverlay = document.getElementById('waveOverlay');
const waveOverlayText = document.getElementById('waveOverlayText');

const gameOverModal = document.getElementById('gameOverModal');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMessage = document.getElementById('gameOverMessage');
const winnerInfoEl = document.getElementById('winnerInfo');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// État local
let myPlayerId = null;
let myColor = null;
let currentMode = 'place'; // 'place', 'destroy', 'ability'
let gameState = null;
let waveEndTime = null;
let timerInterval = null;

// Informations des classes
const classInfo = {
  'bombman': {
    icon: '💣',
    name: 'Bombman',
    description: 'Détruit en croix autour de lui',
    cooldown: '10s'
  },
  'parieur': {
    icon: '🎲',
    name: 'Le Parieur',
    description: 'Détruit une zone 3x3 et remplace par 6 blocs aléatoires',
    cooldown: '10s'
  },
  'bombwoman': {
    icon: '💥',
    name: 'Bombwoman',
    description: 'Détruit une ligne ou colonne entière',
    cooldown: '10s'
  },
  'fast': {
    icon: '⚡',
    name: 'Le Fast',
    description: 'Blocs à 0 PV, cooldowns divisés par 2',
    cooldown: 'Passif'
  },
  'solide': {
    icon: '🛡️',
    name: 'Le Solide',
    description: 'Blocs avec 2 PV',
    cooldown: 'Passif'
  },
  'roulette': {
    icon: '🎰',
    name: 'La Roulette',
    description: 'Pose 2 blocs aléatoires sur une ligne',
    cooldown: '10s'
  },
  'shuffle': {
    icon: '🔀',
    name: 'Le Shuffle',
    description: 'Mélange aléatoirement toute la grille',
    cooldown: '15s'
  },
  'aleatoire': {
    icon: '🎲',
    name: 'L\'Aléatoire',
    description: 'Pouvoir aléatoire qui change à chaque utilisation',
    cooldown: '3 vagues'
  }
};

// Initialisation
function init() {
  createBoard();
  displayClassInfo();
  setupModeButtons();
}

// Créer la grille
function createBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = Math.floor(i / 5);
    cell.dataset.col = i % 5;
    cell.addEventListener('click', handleCellClick);
    boardEl.appendChild(cell);
  }
}

// Afficher les informations de classe
function displayClassInfo() {
  const info = classInfo[playerClass];
  classInfoEl.innerHTML = `
    <div class="icon">${info.icon}</div>
    <h3>${info.name}</h3>
    <p>${info.description}</p>
    <p style="margin-top: 10px; color: var(--primary);">CD: ${info.cooldown}</p>
  `;
}

// Configuration des boutons de mode
function setupModeButtons() {
  placeModeBtn.addEventListener('click', () => {
    currentMode = 'place';
    updateModeButtons();
  });

  destroyModeBtn.addEventListener('click', () => {
    currentMode = 'destroy';
    updateModeButtons();
  });

  abilityModeBtn.addEventListener('click', () => {
    currentMode = 'ability';
    updateModeButtons();
  });

  skipTurnBtn.addEventListener('click', () => {
    socket.emit('skip_turn');
    showNotification('Tour pass\u00e9 ! PA conserv\u00e9s pour la prochaine vague.');
  });
}

// Changer de mode
function setMode(mode) {
  currentMode = mode;
  
  placeModeBtn.classList.toggle('active', mode === 'place');
  destroyModeBtn.classList.toggle('active', mode === 'destroy');
  abilityModeBtn.classList.toggle('active', mode === 'ability');
}

// Gestion du clic sur une cellule
function handleCellClick(e) {
  const cell = e.target;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  if (!gameState || !gameState.started) return;

  switch (currentMode) {
    case 'place':
      socket.emit('place_block', { x: row, y: col });
      break;
    case 'destroy':
      socket.emit('destroy_block', { x: row, y: col });
      break;
    case 'ability':
      socket.emit('use_ability', { x: row, y: col });
      showAbilityAnimation(playerClass, row, col);
      break;
  }
}

function showAbilityAnimation(className, x, y) {
  const cells = boardEl.querySelectorAll('.cell');
  const targetCell = cells[x * 5 + y];
  
  switch (className) {
    case 'bombman':
      // Obtenir les cellules affectées (croix)
      const bombmanCells = [];
      const directions = [[-1,0], [1,0], [0,-1], [0,1]];
      directions.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
          bombmanCells.push(cells[nx * 5 + ny]);
        }
      });
      AnimationSystem.explosion(targetCell, bombmanCells);
      break;
      
    case 'bombwoman':
      // Ligne ou colonne
      const bombwomanCells = [];
      for (let i = 0; i < 5; i++) {
        bombwomanCells.push(cells[x * 5 + i]); // Ligne
      }
      AnimationSystem.bombwoman(bombwomanCells, true);
      break;
      
    case 'parieur':
      // Zone 3x3
      const parieurCells = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
            parieurCells.push(cells[nx * 5 + ny]);
          }
        }
      }
      AnimationSystem.parieur(targetCell, parieurCells);
      break;
      
    case 'roulette':
      // 2 cellules sur une ligne
      const rouletteCells = [];
      for (let i = 0; i < 5; i++) {
        if (Math.random() < 0.4) { // Simuler les 2 cellules
          rouletteCells.push(cells[x * 5 + i]);
        }
      }
      AnimationSystem.roulette(rouletteCells);
      break;
      
    case 'shuffle':
      AnimationSystem.shuffle(Array.from(cells));
      break;
      
    case 'aleatoire':
      // Animation générique
      AnimationSystem.explosion(targetCell, []);
      break;
  }
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.className = 'notification';
  notif.textContent = message;
  document.body.appendChild(notif);
  
  setTimeout(() => notif.classList.add('show'), 10);
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

function updateBoard(grid) {
  const cells = boardEl.querySelectorAll('.cell');
  
  grid.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellIndex = rowIndex * 5 + colIndex;
      const cellEl = cells[cellIndex];
      
      const wasOccupied = cellEl.classList.contains('occupied');
      const previousColor = cellEl.style.backgroundColor;
      
      // Si un bloc était présent et est maintenant détruit
      if (wasOccupied && previousColor && !cell.color) {
        AnimationSystem.destroyBlock(cellEl, previousColor);
      }
      
      cellEl.className = 'cell';
      cellEl.style.backgroundColor = '';
      cellEl.textContent = '';
      
      if (cell.color) {
        cellEl.style.backgroundColor = cell.color;
        cellEl.classList.add('occupied');
        
        // Animation de placement (optionnel)
        if (!wasOccupied) {
          cellEl.style.animation = 'blockPlace 0.3s ease-out';
        }
        
        // HP et protection
        if (cell.hp > 1) {
          cellEl.classList.add('hp-2');
        }
        
        if (cell.waveNumber === gameState.waveNumber) {
          cellEl.classList.add('protected');
          const shield = document.createElement('span');
          shield.className = 'shield-icon';
          shield.textContent = '🛡️';
          shield.style.animation = 'shieldPulse 2s infinite';
          cellEl.appendChild(shield);
        }
      }
    });
  });
}

function updatePlayersList(players) {
  playersListEl.innerHTML = '';
  
  players.forEach(player => {
    const isMe = player.id === myPlayerId;
    
    const item = document.createElement('div');
    item.className = 'player-item' + (isMe ? ' active' : '');
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'player-color-indicator';
    colorDiv.style.backgroundColor = player.color;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'player-details';
    
    const nameP = document.createElement('p');
    nameP.textContent = isMe ? `Vous (${player.pseudo})` : player.pseudo;
    
    const classP = document.createElement('p');
    classP.className = 'player-class';
    classP.textContent = classInfo[player.class].name;
    
    const paP = document.createElement('p');
    paP.className = 'player-pa';
    if (player.hasSkipped) {
      paP.textContent = 'A passé son tour';
      paP.style.fontStyle = 'italic';
      paP.style.color = 'var(--text-dim)';
    } else {
      paP.textContent = `PA: ${player.actionPoints}`;
    }
    
    const abilityP = document.createElement('p');
    abilityP.className = 'player-ability';
    abilityP.textContent = `Pouvoir: ${player.abilityCharges}/3`;
    
    detailsDiv.appendChild(nameP);
    detailsDiv.appendChild(classP);
    detailsDiv.appendChild(paP);
    detailsDiv.appendChild(abilityP);
    
    item.appendChild(colorDiv);
    item.appendChild(detailsDiv);
    
    playersListEl.appendChild(item);
  });
}

function updateCooldowns(player) {
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  if (!myPlayer) return;
  
  const passiveClasses = ['fast', 'solide'];
  const hasPassiveClass = passiveClasses.includes(myPlayer.class);
  
  placeModeBtn.disabled = !myPlayer.canPlace;
  destroyModeBtn.disabled = !myPlayer.canDestroy;
  abilityModeBtn.disabled = !myPlayer.canUseAbility;
  skipTurnBtn.disabled = myPlayer.actionPoints === 0;
  
  if (hasPassiveClass) {
    abilityModeBtn.style.display = 'none';
  } else {
    abilityModeBtn.style.display = 'flex';
  }
  
  placeCooldownEl.textContent = myPlayer.canPlace ? 'OK' : 'X';
  destroyCooldownEl.textContent = myPlayer.canDestroy ? 'OK' : 'X';
  abilityCooldownEl.textContent = myPlayer.canUseAbility ? 'OK' : `${myPlayer.abilityCharges}/3`;
  
  actionPointsDisplay.textContent = `PA: ${myPlayer.actionPoints}`;
  
  if (myPlayer.actionPoints > 0) {
    statusMessageEl.textContent = `A vous de jouer !`;
  } else {
    statusMessageEl.textContent = 'En attente des autres joueurs...';
  }
}

// Démarrer le timer de vague
function startWaveTimer(duration) {
  waveEndTime = Date.now() + duration;
  
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((waveEndTime - Date.now()) / 1000));
    waveTimerEl.textContent = remaining;
    
    if (remaining === 0) {
      clearInterval(timerInterval);
    }
  }, 100);
}

// === ÉVÉNEMENTS SOCKET ===

socket.on('join_success', (data) => {
  myPlayerId = data.playerId;
  myColor = data.playerColor;
  console.log('Reconnecté au jeu');
});

socket.on('game_state_update', (state) => {
  gameState = state;
  
  if (state.grid) {
    updateBoard(state.grid);
  }
  
  if (state.players) {
    updatePlayersList(state.players);
    updateCooldowns();
  }
  
  if (state.waveNumber) {
    waveNumberEl.textContent = state.waveNumber;
  }
});

socket.on('wave_start', (data) => {
  waveNumberEl.textContent = data.waveNumber;
  startWaveTimer(data.duration);
  showWaveAnimation(data.waveNumber);
});

function showWaveAnimation(waveNumber) {
  waveOverlayText.textContent = `Vague ${waveNumber}`;
  waveOverlay.classList.remove('hidden');
  waveOverlay.classList.add('show');
  
  setTimeout(() => {
    waveOverlay.classList.remove('show');
    setTimeout(() => {
      waveOverlay.classList.add('hidden');
    }, 300);
  }, 1000);
}

socket.on('wave_end', (data) => {
  statusMessageEl.textContent = `Vague ${data.waveNumber} terminée !`;
});

socket.on('time_stop_start', (data) => {
  if (data.voyageurId !== myPlayerId) {
    statusMessageEl.textContent = '⏰ LE TEMPS EST ARRÊTÉ !';
    statusMessageEl.style.color = 'var(--warning)';
  } else {
    statusMessageEl.textContent = '⏰ Vous contrôlez le temps !';
    statusMessageEl.style.color = 'var(--success)';
  }
});

socket.on('time_stop_end', (data) => {
  statusMessageEl.textContent = 'Le temps reprend son cours';
  statusMessageEl.style.color = 'var(--text)';
});

socket.on('game_over', (data) => {
  if (timerInterval) clearInterval(timerInterval);
  
  showGameOver(data);
});

socket.on('player_left', (data) => {
  statusMessageEl.textContent = 'Un joueur a quitté la partie';
});

// Afficher l'écran de fin de partie
function showGameOver(data) {
  gameOverModal.classList.remove('hidden');
  
  if (data.winner) {
    gameOverTitle.textContent = data.winner.id === myPlayerId ? '🎉 VICTOIRE !' : '😢 Défaite';
    gameOverMessage.textContent = data.winner.id === myPlayerId 
      ? 'Félicitations ! Vous avez gagné !' 
      : 'Dommage ! Un autre joueur a gagné.';
    
    const info = classInfo[data.winner.class];
    winnerInfoEl.innerHTML = `
      <div class="winner-display">
        <div class="winner-color" style="background-color: ${data.winner.color}"></div>
        <div class="winner-details">
          <h3>${info.icon} ${info.name}</h3>
          <p>${data.winner.id === myPlayerId ? 'Vous' : 'Adversaire'}</p>
        </div>
      </div>
    `;
  } else {
    gameOverTitle.textContent = 'Partie terminée';
    gameOverMessage.textContent = data.reason === 'not_enough_players' 
      ? 'Pas assez de joueurs pour continuer' 
      : 'La partie est terminée';
    winnerInfoEl.innerHTML = '';
  }
}

// Retour au menu
backToMenuBtn.addEventListener('click', () => {
  socket.disconnect();
  sessionStorage.clear();
  window.location.href = './index.html';
});

// Gestion de la fermeture de la page
window.addEventListener('beforeunload', () => {
  socket.disconnect();
});

// Initialiser
init();

let animationsEnabled = true;

function toggleAnimations() {
  animationsEnabled = !animationsEnabled;
  if (!animationsEnabled) {
    document.body.classList.add('no-animation');
  } else {
    document.body.classList.remove('no-animation');
  }
}

// Modifier les appels
if (animationsEnabled) {
  AnimationSystem.destroyBlock(cellEl, previousColor);
}

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (isMobile) {
  AnimationSystem.config.particleCount = 6;
  AnimationSystem.config.particleLifetime = 400;
}