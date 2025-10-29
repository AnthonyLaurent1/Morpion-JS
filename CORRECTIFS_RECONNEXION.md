# Correctifs de reconnexion - Morpion Multijoueur

## Problème identifié

Lors du démarrage de la partie, tous les joueurs étaient redirigés de `waiting.html` vers `game.html`. Cette redirection provoquait :

1. **Fermeture de la connexion Socket.IO** de `waiting.html`
2. **Création d'une nouvelle connexion** dans `game.html`
3. **Délai de reconnexion** trop court (5 secondes)
4. **Timers multiples** qui se déclenchaient en même temps et retiraient les joueurs avant qu'ils ne puissent tous se reconnecter

### Logs du problème :
```
Partie 2241 démarrée avec 4 joueurs
Joueur déconnecté: Jzp1UiZJ4sbzdlKVAAAD
Joueur Jzp1UiZJ4sbzdlKVAAAD déconnecté, attente de reconnexion (5s)...
[...] (tous les joueurs se déconnectent)
Joueur connecté: SzVxb24b8K6YupKZAAAL
Reconnexion du joueur SzVxb24b8K6YupKZAAAL (anciennement -0iBzaHpxs5LKqRIAAAB) à la partie 2241
Joueur Jzp1UiZJ4sbzdlKVAAAD n'est pas revenu, suppression de la partie
[...] (les autres timers se déclenchent et retirent les joueurs)
Partie 2241 terminée. Raison: not_enough_players
```

## Solutions implémentées

### 1. Reconnexion ultra-rapide côté client ⚡

**Fichier : `/front/js/game..js`**

- Délai de reconnexion réduit à **100ms** (au lieu de 1000ms)
- Reconnexion immédiate dès que la connexion est établie
- Utilisation de l'événement `connect` pour rejoindre la partie automatiquement

```javascript
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 100, // Reconnexion très rapide
  reconnectionDelayMax: 500,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  // Rejoindre la partie immédiatement
  socket.emit('join_game', {
    gameId: gameId ? parseInt(gameId) : null,
    playerClass: playerClass
  });
});
```

### 2. Délai de reconnexion augmenté côté serveur ⏱️

**Fichier : `/websocket/gameManager.js`**

- Délai passé de **5 secondes à 15 secondes**
- Vérification que le joueur n'est pas déjà reconnecté avant de le retirer
- Logs détaillés pour le débogage

```javascript
// Si la partie a démarré, donner 15 secondes pour se reconnecter
if (game.started) {
  console.log(`Joueur ${socket.id} déconnecté, attente de reconnexion (15s)...`);
  
  const timer = setTimeout(() => {
    // Vérifier si le joueur existe toujours avec cet ancien socket ID
    const player = currentGame.players.find(p => p.playerId === socket.id);
    if (player) {
      // Le joueur ne s'est pas reconnecté, on le retire
      currentGame.removePlayer(socket.id);
    } else {
      // Le joueur s'est déjà reconnecté avec un nouveau socket
      console.log(`✅ Joueur ${socket.id} s'est déjà reconnecté`);
    }
  }, 15000);
}
```

### 3. Stockage du socket ID pour le débogage 🔍

**Fichier : `/front/js/waiting.js`**

```javascript
socket.on('game_started', (data) => {
  // Stocker l'ID du socket pour debug
  sessionStorage.setItem('socketId', socket.id);
  console.log('Redirection vers game.html avec socket:', socket.id);
  
  window.location.href = './game.html';
});
```

### 4. Logs améliorés 📊

Ajout de logs détaillés avec emojis pour faciliter le débogage :

```
✅ Connexion établie avec nouveau socket: [id]
📝 Ancien socket: [old-id]
🎮 Tentative de reconnexion à la partie: [gameId] avec la classe: [class]
✅ Reconnexion réussie!
🔄 Reconnexion détectée par le serveur
⏱️ Joueur [id] n'est pas revenu après 15s
📊 X joueur(s) en attente de reconnexion
```

## Résultat attendu

Avec ces modifications, voici ce qui devrait se passer :

1. **4 joueurs rejoignent** la partie dans `waiting.html`
2. **La partie démarre** automatiquement
3. **Tous les joueurs sont redirigés** vers `game.html`
4. **Chaque joueur se déconnecte** brièvement (fermeture de l'ancienne connexion)
5. **Reconnexion immédiate** (< 500ms) avec un nouveau socket ID
6. **Le serveur détecte** la reconnexion et met à jour le socket ID du joueur
7. **La partie continue** normalement avec tous les joueurs

### Logs attendus :

```
Partie 2241 démarrée avec 4 joueurs

Joueur déconnecté: [socket-1]
Joueur [socket-1] déconnecté, attente de reconnexion (15s)...
Joueur déconnecté: [socket-2]
Joueur [socket-2] déconnecté, attente de reconnexion (15s)...
Joueur déconnecté: [socket-3]
Joueur [socket-3] déconnecté, attente de reconnexion (15s)...
Joueur déconnecté: [socket-4]
Joueur [socket-4] déconnecté, attente de reconnexion (15s)...

Joueur connecté: [new-socket-1]
Reconnexion du joueur [new-socket-1] (anciennement [socket-1]) à la partie 2241
Timer de déconnexion annulé pour [socket-1]

Joueur connecté: [new-socket-2]
Reconnexion du joueur [new-socket-2] (anciennement [socket-2]) à la partie 2241
Timer de déconnexion annulé pour [socket-2]

Joueur connecté: [new-socket-3]
Reconnexion du joueur [new-socket-3] (anciennement [socket-3]) à la partie 2241
Timer de déconnexion annulé pour [socket-3]

Joueur connecté: [new-socket-4]
Reconnexion du joueur [new-socket-4] (anciennement [socket-4]) à la partie 2241
Timer de déconnexion annulé pour [socket-4]

✅ Tous les joueurs reconnectés, la partie continue!
```

## Test

1. **Redémarrez le serveur** :
   ```bash
   cd /home/mateo/Documents/COURS/Morpion-JS/websocket
   node server.js
   ```

2. **Connectez 4 joueurs** avec des classes différentes

3. **Observez les logs** dans la console du serveur

4. **Vérifiez la console du navigateur** (F12) pour voir les logs de reconnexion

5. **La partie devrait démarrer** et tous les joueurs devraient rester connectés

## Si le problème persiste

Si certains joueurs ne se reconnectent toujours pas :

1. **Vérifiez la console du navigateur** pour voir les erreurs
2. **Augmentez encore le délai** de reconnexion côté serveur (20-30 secondes)
3. **Vérifiez la vitesse de connexion** des joueurs
4. **Testez en local** d'abord avant de tester sur le réseau

## Fichiers modifiés

- ✅ `/websocket/gameManager.js` - Délai 15s + logs améliorés
- ✅ `/front/js/game..js` - Reconnexion ultra-rapide (100ms)
- ✅ `/front/js/waiting.js` - Stockage du socket ID

## Bon jeu ! 🎮
