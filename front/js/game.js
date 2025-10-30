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
  'nuke': {
    icon: '☢️',
    name: 'Le Nuke',
    description: 'Détruit toute la grille, place 3 blocs neutres',
    cooldown: '5 vagues'
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
    setMode('place');
    updateModeButtons();
  });

  destroyModeBtn.addEventListener('click', () => {
    setMode('destroy');
    updateModeButtons();
  });

  abilityModeBtn.addEventListener('click', () => {
    setMode('ability');
    updateModeButtons();
  });

  function updateModeButtons() {
    // Retirer la classe active de tous les boutons
    placeModeBtn.classList.remove('active');
    destroyModeBtn.classList.remove('active');
    abilityModeBtn.classList.remove('active');
    
    // Ajouter la classe active au bouton du mode actuel
    switch (currentMode) {
      case 'place':
        placeModeBtn.classList.add('active');
        break;
      case 'destroy':
        destroyModeBtn.classList.add('active');
        break;
      case 'ability':
        abilityModeBtn.classList.add('active');
        break;
    }
  }

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
      
    case 'shuffle':
      AnimationSystem.shuffle(Array.from(cells));
      break;
      
    case 'nuke':
      // Animation pour toute la grille
      const allCells = Array.from(cells);
      AnimationSystem.explosion(targetCell, allCells);
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
    item.setAttribute('data-player-id', player.id); // Pour les mises à jour ciblées
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'player-color-indicator';
    colorDiv.style.backgroundColor = player.color;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'player-details';
    
    const nameP = document.createElement('p');
    nameP.className = 'player-name';
    nameP.textContent = isMe ? `Vous (${player.pseudo})` : player.pseudo;
    
    const classP = document.createElement('p');
    classP.className = 'player-class';
    classP.textContent = classInfo[player.class].name;
    
    // Container pour les informations de PA et de statut
    const statsDiv = document.createElement('div');
    statsDiv.className = 'player-stats';
    
    const paP = document.createElement('p');
    paP.className = 'player-pa';
    if (player.hasSkipped) {
      paP.innerHTML = '<span class="skip-indicator">⏭️ A passé son tour</span>';
      paP.style.color = 'var(--text-dim)';
    } else {
      const paSpan = document.createElement('span');
      paSpan.className = 'pa-value' + (player.actionPoints > 0 ? ' has-pa' : '');
      paSpan.textContent = `${player.actionPoints} PA`;
      paP.appendChild(paSpan);
    }
    
    const abilityP = document.createElement('p');
    abilityP.className = 'player-ability';
    const abilityIcon = document.createElement('span');
    abilityIcon.className = 'ability-icon';
    abilityIcon.textContent = classInfo[player.class].icon;
    abilityP.appendChild(abilityIcon);
    
    // Texte de charge différent pour la Nuke
    if (player.class === 'nuke') {
      const wavesSinceLastUse = gameState.waveNumber - (player.lastChargeWave || 0);
      const wavesRemaining = Math.max(0, 5 - wavesSinceLastUse);
      if (player.abilityCharges > 0) {
        abilityP.appendChild(document.createTextNode(` Prêt !`));
      } else {
        abilityP.appendChild(document.createTextNode(` ${wavesRemaining} vagues`));
      }
    } else {
      abilityP.appendChild(document.createTextNode(` ${player.abilityCharges}/3`));
    }
    
    statsDiv.appendChild(paP);
    statsDiv.appendChild(abilityP);
    
    detailsDiv.appendChild(nameP);
    detailsDiv.appendChild(classP);
    detailsDiv.appendChild(statsDiv);
    
    item.appendChild(colorDiv);
    item.appendChild(detailsDiv);
    
    // Ajouter un indicateur de tour si c'est au joueur de jouer
    if (player.actionPoints > 0 && !player.hasSkipped) {
      const turnIndicator = document.createElement('div');
      turnIndicator.className = 'turn-indicator';
      turnIndicator.textContent = '►';
      item.appendChild(turnIndicator);
    }
    
    playersListEl.appendChild(item);
  });
}

function updateCooldowns(player) {
  console.log('Mise à jour des cooldowns...');
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  if (!myPlayer) {
    console.log('Joueur non trouvé dans gameState');
    return;
  }
  
  const passiveClasses = ['fast', 'solide'];
  const hasPassiveClass = passiveClasses.includes(myPlayer.class);
  
  // Vérifier si c'est le début d'une nouvelle vague
  const isNewWave = gameState.lastAction === null || gameState.lastAction === undefined;
  
  // Au début d'une vague, tous les joueurs avec des PA peuvent jouer
  const canPlay = isNewWave ? (myPlayer.actionPoints > 0) : myPlayer.canPlay;
  
  console.log('État du joueur:', {
    actionPoints: myPlayer.actionPoints,
    canPlay,
    isNewWave
  });
  
  // Activer tous les boutons au début d'une nouvelle vague si le joueur a des PA
  placeModeBtn.disabled = false;
  destroyModeBtn.disabled = false;
  abilityModeBtn.disabled = false;
  skipTurnBtn.disabled = false;
  
  // Retirer les classes visuelles de désactivation
  placeModeBtn.classList.remove('disabled');
  destroyModeBtn.classList.remove('disabled');
  abilityModeBtn.classList.remove('disabled');
  skipTurnBtn.classList.remove('disabled');
  
  if (hasPassiveClass) {
    abilityModeBtn.style.display = 'none';
  } else {
    abilityModeBtn.style.display = 'flex';
  }
  
  // Mise à jour des indicateurs de cooldown
  placeCooldownEl.textContent = myPlayer.canPlace ? 'OK' : 'CD';
  destroyCooldownEl.textContent = myPlayer.canDestroy ? 'OK' : 'CD';
  
  // Affichage spécial du cooldown pour la Nuke
  if (myPlayer.class === 'nuke') {
    const wavesSinceLastUse = gameState.waveNumber - (myPlayer.lastChargeWave || 0);
    const wavesRemaining = Math.max(0, 5 - wavesSinceLastUse);
    if (myPlayer.canUseAbility) {
      abilityCooldownEl.textContent = 'PRÊT';
    } else {
      abilityCooldownEl.textContent = `${wavesRemaining} vagues`;
    }
  } else {
    abilityCooldownEl.textContent = myPlayer.canUseAbility ? 'OK' : `${myPlayer.abilityCharges}/3`;
  }
  
  actionPointsDisplay.textContent = `PA: ${myPlayer.actionPoints}`;
  
  // Mise à jour du message de statut
  if (canPlay) {
    statusMessageEl.textContent = `A vous de jouer !`;
    statusMessageEl.style.color = 'var(--success)';
  } else {
    statusMessageEl.textContent = 'En attente des autres joueurs...';
    statusMessageEl.style.color = 'var(--text-dim)';
  }
  
  // Forcer un rafraîchissement visuel
  requestAnimationFrame(() => {
    placeModeBtn.style.opacity = '1';
    destroyModeBtn.style.opacity = '1';
    abilityModeBtn.style.opacity = '1';
    skipTurnBtn.style.opacity = '1';
  });
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

// Fonction pour mettre à jour uniquement les PA d'un joueur
function updatePlayerActionPoints(playerId, actionPoints, hasSkipped) {
  const playerItem = playersListEl.querySelector(`[data-player-id="${playerId}"]`);
  if (!playerItem) return;

  const paElement = playerItem.querySelector('.player-pa');
  if (!paElement) return;

  if (hasSkipped) {
    paElement.innerHTML = '<span class="skip-indicator">⏭️ A passé son tour</span>';
    paElement.style.color = 'var(--text-dim)';
  } else {
    const paSpan = document.createElement('span');
    paSpan.className = 'pa-value' + (actionPoints > 0 ? ' has-pa' : '');
    paSpan.textContent = `${actionPoints} PA`;
    paElement.innerHTML = '';
    paElement.appendChild(paSpan);
  }

  // Mettre à jour l'indicateur de tour
  const oldTurnIndicator = playerItem.querySelector('.turn-indicator');
  if (oldTurnIndicator) {
    oldTurnIndicator.remove();
  }
  
  if (actionPoints > 0 && !hasSkipped) {
    const turnIndicator = document.createElement('div');
    turnIndicator.className = 'turn-indicator';
    turnIndicator.textContent = '►';
    playerItem.appendChild(turnIndicator);
  }
}

socket.on('game_state_update', (state) => {
  const previousState = gameState;
  gameState = state;
  
  if (state.grid) {
    updateBoard(state.grid);
  }
  
  if (state.players) {
    // Vérifier si seuls les PA ont changé
    const onlyActionPointsChanged = previousState && 
      previousState.players.length === state.players.length &&
      state.players.every(player => {
        const prevPlayer = previousState.players.find(p => p.id === player.id);
        return prevPlayer && 
               prevPlayer.pseudo === player.pseudo &&
               prevPlayer.class === player.class &&
               prevPlayer.color === player.color &&
               (prevPlayer.actionPoints !== player.actionPoints || 
                prevPlayer.hasSkipped !== player.hasSkipped);
      });

    if (onlyActionPointsChanged) {
      // Mise à jour optimisée des PA uniquement
      state.players.forEach(player => {
        updatePlayerActionPoints(player.id, player.actionPoints, player.hasSkipped);
      });
    } else {
      // Mise à jour complète de la liste des joueurs
      updatePlayersList(state.players);
    }
    
    updateCooldowns();
  }
  
  if (state.waveNumber) {
    waveNumberEl.textContent = state.waveNumber;
  }
});

socket.on('wave_start', (data) => {
  waveNumberEl.textContent = data.waveNumber;
  startWaveTimer(data.duration);
  
  // Mise à jour immédiate des PA au début de la vague
  if (data.players) {
    gameState.players = data.players;
    
    // Réinitialiser l'interface pour la nouvelle vague
    data.players.forEach(player => {
      // Mettre à jour les points d'action
      if (player.actionPoints > 0) {
        actionPointsDisplay.textContent = `PA: ${player.actionPoints}`;
      }
    });
    
    // Forcer la mise à jour complète de l'interface
    updatePlayersList(data.players);
    updateCooldowns();
    
    // Réactiver les boutons si le joueur actuel a des PA
    const currentPlayer = data.players.find(p => p.id === myPlayerId);
    if (currentPlayer && currentPlayer.actionPoints > 0) {
      placeModeBtn.disabled = false;
      destroyModeBtn.disabled = false;
      abilityModeBtn.disabled = false;
      skipTurnBtn.disabled = false;
      
      // Retirer les classes de désactivation
      placeModeBtn.classList.remove('disabled');
      destroyModeBtn.classList.remove('disabled');
      abilityModeBtn.classList.remove('disabled');
      skipTurnBtn.classList.remove('disabled');
      
      setMode('place');
      updateModeButtons();
    }
  }
  
  showWaveAnimation(data.waveNumber);
  
  // Mettre à jour le message de statut
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  if (myPlayer && myPlayer.actionPoints > 0) {
    statusMessageEl.textContent = 'Nouvelle vague ! À vous de jouer !';
    statusMessageEl.style.color = 'var(--success)';
  } else {
    statusMessageEl.textContent = 'Nouvelle vague ! En attente de votre tour...';
    statusMessageEl.style.color = 'var(--text-dim)';
  }
});

// Nouvel événement pour la synchronisation complète
socket.on('sync_state', (data) => {
  console.log('Synchronisation reçue:', data);
  
  // Mettre à jour l'état complet du jeu
  gameState = data.gameState;
  
  // Réinitialiser tous les états visuels
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  if (myPlayer) {
    // Activer les boutons si le joueur a des PA
    const hasActionPoints = myPlayer.actionPoints > 0;
    
    placeModeBtn.disabled = false;
    destroyModeBtn.disabled = false;
    abilityModeBtn.disabled = false;
    skipTurnBtn.disabled = false;
    
    placeModeBtn.classList.remove('disabled');
    destroyModeBtn.classList.remove('disabled');
    abilityModeBtn.classList.remove('disabled');
    skipTurnBtn.classList.remove('disabled');
    
    setMode('place'); // Revenir au mode par défaut
    updateModeButtons();
  }
  
  // Mettre à jour toute l'interface
  updateBoard(gameState.grid);
  updatePlayersList(gameState.players);
  updateCooldowns();
  
  // Force le rafraîchissement du DOM
  requestAnimationFrame(() => {
    updateBoard(gameState.grid);
    updatePlayersList(gameState.players);
    updateCooldowns();
  });
});

function showWaveAnimation(waveNumber) {
  waveOverlayText.textContent = `Vague ${waveNumber}`;
  waveOverlay.classList.remove('hidden');
  waveOverlay.classList.add('show');
  
  // Réduire la durée de l'animation et s'assurer que l'interface est interactive
  setTimeout(() => {
    waveOverlay.classList.remove('show');
    waveOverlay.classList.add('hidden');
    
    // Forcer une mise à jour de l'interface
    if (gameState) {
      updateBoard(gameState.grid);
      updatePlayersList(gameState.players);
      updateCooldowns();
    }
  }, 500);
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
  
  if (data.winner) {
    // Afficher les changements d'ELO
    if (data.winner.id === myPlayerId) {
      showNotification(`Victoire ! 🎉 +${data.winner.eloChange} ELO`);
    } else {
      const myInfo = data.otherPlayers.find(p => p.id === myPlayerId);
      if (myInfo) {
        showNotification(`Défaite ! ${data.winner.pseudo} a gagné 😢 ${myInfo.eloChange} ELO`);
      }
    }
    
    // Demander une mise à jour du classement après un délai
    setTimeout(() => {
      socket.emit('request_leaderboard');
    }, 1000);
  }
  
  showGameOver(data);
});

socket.on('player_left', (data) => {
  statusMessageEl.textContent = 'Un joueur a quitté la partie';
});

// Afficher l'écran de fin de partie
function showGameOver(data) {
  gameOverModal.classList.remove('hidden');
  
  if (data.winner) {
    const isWinner = data.winner.id === myPlayerId;
    gameOverTitle.textContent = isWinner ? '🎉 VICTOIRE !' : '😢 Défaite';
    
    // Obtenir les infos du joueur
    const myInfo = !isWinner ? data.otherPlayers.find(p => p.id === myPlayerId) : null;
    const eloChange = isWinner ? data.winner.eloChange : (myInfo ? myInfo.eloChange : 0);
    const currentElo = isWinner ? data.winner.elo : (myInfo ? myInfo.elo : 0);
    
    gameOverMessage.innerHTML = isWinner 
      ? `Félicitations ! Vous avez gagné !<br><span class="trophy-change positive">+${eloChange} ELO (${currentElo})</span>` 
      : `Dommage ! ${data.winner.pseudo} a gagné.<br><span class="trophy-change negative">${eloChange} ELO (${currentElo})</span>`;
    
    const info = classInfo[data.winner.class];
    winnerInfoEl.innerHTML = `
      <div class="winner-display">
        <div class="winner-color" style="background-color: ${data.winner.color}"></div>
        <div class="winner-details">
          <h3>${info.icon} ${info.name}</h3>
          <p>${data.winner.id === myPlayerId ? 'Vous' : data.winner.pseudo}</p>
          <p class="trophy-change ${isWinner ? 'positive' : ''}">${isWinner ? '+' : ''}${eloChange} ELO (${currentElo})</p>
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