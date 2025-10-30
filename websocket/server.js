// ============================================================================
// server.js
// Point d'entrée du serveur
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import GameManager from './gameManager.js';
import rankingRoutes from './routes/rankingRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../front')));

// Utiliser les routes du classement
app.use('/api', rankingRoutes);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Autorise toutes les origines
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  allowEIO3: true, // Pour la compatibilité avec les anciennes versions de Socket.IO
  transports: ['websocket', 'polling'] // Activer plusieurs méthodes de transport
});

// Middleware pour gérer les en-têtes CORS manuellement
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const PORT = process.env.PORT || 8080;

// Instance unique du gestionnaire de parties
const gameManager = new GameManager(io);

// Gestion des connexions socket
io.on('connection', (socket) => {
  console.log(`Joueur connecté: ${socket.id}`);

  socket.on('join_game', (data) => {
    const { gameId, playerClass, pseudo } = data;
    gameManager.handleJoinGame(socket, gameId, playerClass, pseudo);
  });

  // Action de placement de bloc
  socket.on('place_block', (data) => {
    const { x, y } = data;
    gameManager.handlePlaceBlock(socket, x, y);
  });

  socket.on('start_game', () => {
    gameManager.handleStartGame(socket);
  });

  // Action de destruction de bloc
  socket.on('destroy_block', (data) => {
    const { x, y } = data;
    gameManager.handleDestroyBlock(socket, x, y);
  });

  // Utilisation du pouvoir spécial
  socket.on('use_ability', (data) => {
    const { x, y } = data;
    gameManager.handleUseAbility(socket, x, y);
  });

  socket.on('skip_turn', () => {
    gameManager.handleSkipTurn(socket);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`Joueur déconnecté: ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`Serveur lancé sur le port ${PORT}`);
  console.log(`\nAccès local: http://localhost:${PORT}`);
  console.log(`\nPour accéder depuis un autre appareil:`);
  console.log(`1. Trouvez votre adresse IP locale avec: hostname -I`);
  console.log(`2. Utilisez: http://[VOTRE_IP]:${PORT}`);
  console.log(`========================================\n`);
});