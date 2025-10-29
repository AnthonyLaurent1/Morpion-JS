// ============================================================================
// gameManager.js
// Gestionnaire principal des parties
// ============================================================================

import Game from './models/Game.js';

export default class GameManager {
  constructor(io) {
    this.io = io;
    this.games = new Map(); // gameId -> Game
    this.socketToGame = new Map(); // socketId -> gameId
    this.disconnectTimers = new Map(); // socketId -> timeout
  }

  // Générer un ID de partie unique
  generateGameId() {
    let id;
    do {
      id = Math.floor(Math.random() * 9000) + 1000;
    } while (this.games.has(id));
    return id;
  }

  // Rejoindre ou créer une partie
  handleJoinGame(socket, gameId, playerClass) {
    let game;

    if (gameId && this.games.has(gameId)) {
      game = this.games.get(gameId);
      
      // Vérifier si le joueur essaie de se reconnecter avec la même classe
      const existingPlayer = game.players.find(p => p.className === playerClass);
      
      if (existingPlayer && game.started) {
        // Reconnexion : mettre à jour le socket ID du joueur
        console.log(`Reconnexion du joueur ${socket.id} (anciennement ${existingPlayer.playerId}) à la partie ${gameId}`);
        
        // Annuler le timer de déconnexion si il existe
        const oldSocketId = existingPlayer.playerId;
        if (this.disconnectTimers.has(oldSocketId)) {
          clearTimeout(this.disconnectTimers.get(oldSocketId));
          this.disconnectTimers.delete(oldSocketId);
          this.socketToGame.delete(oldSocketId);
          console.log(`Timer de déconnexion annulé pour ${oldSocketId}`);
        }
        
        existingPlayer.playerId = socket.id;
        
        this.socketToGame.set(socket.id, game.gameId);
        socket.join(`game_${game.gameId}`);
        
        socket.emit('join_success', {
          gameId: game.gameId,
          playerId: socket.id,
          playerColor: existingPlayer.color,
          playerClass: playerClass,
          reconnected: true
        });
        
        // Envoyer l'état actuel de la partie
        socket.emit('game_state_update', game.getGameState());
        return;
      }
      
      // Vérifier si la partie est pleine
      if (game.players.length >= 4) {
        socket.emit('join_error', { message: 'Partie pleine' });
        return;
      }

      // Vérifier si la classe est déjà prise (et ce n'est pas une reconnexion)
      if (game.players.some(p => p.className === playerClass)) {
        socket.emit('join_error', { message: 'Classe déjà prise' });
        return;
      }

      // Vérifier si la partie a déjà commencé (et ce n'est pas une reconnexion)
      if (game.started) {
        socket.emit('join_error', { message: 'Partie déjà commencée' });
        return;
      }
    } else {
      // Créer une nouvelle partie
      const newGameId = this.generateGameId();
      game = new Game(newGameId, this.io);
      this.games.set(newGameId, game);
      console.log(`Nouvelle partie créée: ${newGameId}`);
    }

    // Ajouter le joueur à la partie
    const success = game.addPlayer(socket, playerClass);
    if (success) {
      this.socketToGame.set(socket.id, game.gameId);
      socket.join(`game_${game.gameId}`);
      socket.emit('join_success', {
        gameId: game.gameId,
        playerId: socket.id,
        playerColor: game.getPlayer(socket.id).color,
        playerClass: playerClass
      });

      this.io.to(`game_${game.gameId}`).emit('game_state_update', game.getGameState());

      if (game.players.length >= 2 && !game.started) {
        game.startGame();
      }
    } else {
      socket.emit('join_error', { message: 'Erreur lors de la connexion' });
    }
  }

  // Placer un bloc
  handlePlaceBlock(socket, x, y) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.placeBlock(socket.id, x, y);
  }

  // Détruire un bloc
  handleDestroyBlock(socket, x, y) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.destroyBlock(socket.id, x, y);
  }

  // Utiliser le pouvoir spécial
  handleUseAbility(socket, x, y) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.useAbility(socket.id, x, y);
  }

  handleSkipTurn(socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.skipTurn(socket.id);
  }

  // Gérer la déconnexion
  handleDisconnect(socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    // Si la partie a démarré, donner 15 secondes pour se reconnecter
    if (game.started) {
      console.log(`Joueur ${socket.id} déconnecté, attente de reconnexion (15s)...`);
      
      const timer = setTimeout(() => {
        // Vérifier si le joueur ne s'est toujours pas reconnecté
        const currentGame = this.games.get(gameId);
        if (!currentGame) {
          this.disconnectTimers.delete(socket.id);
          this.socketToGame.delete(socket.id);
          return;
        }
        
        // Vérifier si le joueur existe toujours avec cet ancien socket ID
        const player = currentGame.players.find(p => p.playerId === socket.id);
        if (player) {
          console.log(`⏱️ Joueur ${socket.id} n'est pas revenu après 15s, retrait du joueur`);
          
          // Compter combien de joueurs sont en attente de reconnexion
          const waitingCount = Array.from(this.disconnectTimers.values()).length;
          console.log(`📊 ${waitingCount} joueur(s) en attente de reconnexion`);
          
          currentGame.removePlayer(socket.id);
          
          // Supprimer la partie si elle est vide
          if (currentGame.players.length === 0) {
            this.games.delete(gameId);
            console.log(`Partie supprimée: ${gameId}`);
          }
        } else {
          console.log(`✅ Joueur ${socket.id} s'est déjà reconnecté avec un nouveau socket`);
        }
        
        this.disconnectTimers.delete(socket.id);
        this.socketToGame.delete(socket.id);
      }, 15000);
      
      this.disconnectTimers.set(socket.id, timer);
    } else {
      // Si la partie n'a pas encore démarré, retirer immédiatement
      game.removePlayer(socket.id);
      
      // Supprimer la partie si elle est vide
      if (game.players.length === 0) {
        this.games.delete(gameId);
        console.log(`Partie supprimée: ${gameId}`);
      }
      
      this.socketToGame.delete(socket.id);
    }
  }
}