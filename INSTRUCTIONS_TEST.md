# Instructions de test - Morpion Multijoueur

## Problème résolu

Le problème était que les joueurs se déconnectaient immédiatement après le démarrage de la partie. Cela était dû à :

1. **Mauvaise URL WebSocket** : Utilisation de `ws://` au lieu de `http://` pour Socket.IO
2. **Pas de gestion de reconnexion** : Quand les joueurs changeaient de page (waiting.html → game.html), ils créaient une nouvelle connexion et l'ancienne se déconnectait
3. **Rejet des reconnexions** : Le serveur rejetait les tentatives de rejoindre une partie déjà démarrée

## Solutions implémentées

### 1. Correction de l'URL WebSocket
- ✅ Utilisation de `window.location.origin` (http://) au lieu de `ws://`
- ✅ Configuration correcte de Socket.IO avec reconnexion automatique

### 2. Système de reconnexion
- ✅ Délai de 5 secondes avant de supprimer un joueur déconnecté
- ✅ Détection automatique de la reconnexion basée sur la classe du joueur
- ✅ Mise à jour du socket ID lors de la reconnexion

### 3. Serveur accessible sur le réseau
- ✅ Écoute sur `0.0.0.0` pour accepter les connexions externes
- ✅ Serveur de fichiers statiques intégré
- ✅ Configuration CORS complète

## Comment tester

### 1. Démarrer le serveur

```bash
cd /home/mateo/Documents/COURS/Morpion-JS/websocket
node server.js
```

Vous devriez voir :
```
========================================
Serveur lancé sur le port 8080

Accès local: http://localhost:8080

Pour accéder depuis un autre appareil:
1. Trouvez votre adresse IP locale avec: hostname -I
2. Utilisez: http://[VOTRE_IP]:8080
========================================
```

### 2. Trouver votre adresse IP

```bash
hostname -I
```

Exemple de résultat : `192.168.1.100`

### 3. Tester en local

1. Ouvrez votre navigateur à `http://localhost:8080`
2. Sélectionnez une classe
3. Cliquez sur "Rejoindre une partie"
4. Vous devriez voir votre carte de joueur dans la salle d'attente

### 4. Tester avec des amis

**Sur votre machine (serveur)** :
- Accédez à `http://localhost:8080`

**Sur les autres machines** :
- Accédez à `http://192.168.1.100:8080` (remplacez par votre IP)

**Pour rejoindre la même partie** :
1. Le premier joueur crée une partie (laisse le champ vide)
2. Note le code de partie affiché (ex: 1234)
3. Les autres joueurs entrent ce code dans le champ "Code de partie"
4. Tous sélectionnent une classe différente
5. La partie démarre automatiquement quand 4 joueurs sont connectés

## Logs attendus

Quand tout fonctionne correctement, vous devriez voir dans la console du serveur :

```
Joueur connecté: [socket-id-1]
Nouvelle partie créée: 1234
Joueur [socket-id-1] a rejoint la partie 1234 avec la classe shuffle

Joueur connecté: [socket-id-2]
Joueur [socket-id-2] a rejoint la partie 1234 avec la classe bombman

Joueur connecté: [socket-id-3]
Joueur [socket-id-3] a rejoint la partie 1234 avec la classe voyageur

Joueur connecté: [socket-id-4]
Joueur [socket-id-4] a rejoint la partie 1234 avec la classe bombwoman

Partie 1234 démarrée avec 4 joueurs

Joueur [socket-id-1] déconnecté, attente de reconnexion (5s)...
Reconnexion du joueur [new-socket-id-1] (anciennement [socket-id-1]) à la partie 1234
Timer de déconnexion annulé pour [socket-id-1]

[... même chose pour les autres joueurs ...]
```

## Dépannage

### Les joueurs ne voient pas leur carte
- Vérifiez la console du navigateur (F12)
- Vérifiez que le serveur est bien démarré
- Vérifiez l'URL utilisée

### Erreur "Partie déjà commencée"
- Ce message ne devrait plus apparaître avec les corrections
- Si vous le voyez, vérifiez que le `gameId` est bien stocké dans sessionStorage

### Déconnexions immédiates
- Vérifiez que tous les fichiers ont été modifiés correctement
- Redémarrez le serveur
- Videz le cache du navigateur (Ctrl+Shift+R)

### Pare-feu / Réseau
Si les autres appareils ne peuvent pas se connecter :

1. **Vérifiez le pare-feu** :
   ```bash
   sudo ufw allow 8080
   ```

2. **Vérifiez que vous êtes sur le même réseau** :
   - Tous les appareils doivent être connectés au même WiFi/réseau

3. **Testez la connectivité** :
   ```bash
   ping [IP_DU_SERVEUR]
   ```

## Fichiers modifiés

- ✅ `/websocket/server.js` - Serveur de fichiers statiques + écoute sur 0.0.0.0
- ✅ `/websocket/gameManager.js` - Système de reconnexion
- ✅ `/front/js/waiting.js` - Correction URL + stockage gameId
- ✅ `/front/js/game..js` - Correction URL + gestion erreurs
- ✅ `/front/js/home.js` - Correction URL

## Bon jeu ! 🎮
