# Système de Points d'Action (PA) - Version finale

## Vue d'ensemble

Le jeu utilise maintenant un système de **Points d'Action (PA)** au lieu de cooldowns temporels.

## Fonctionnement des PA

### Attribution des PA
- Chaque joueur commence avec **1 PA**
- À chaque nouvelle vague : **+1 PA** pour tous les joueurs
- Classe Fast : **+2 PA** par vague

### Coût des actions
- **Placer un bloc** : 1 PA
- **Détruire un bloc** : 1 PA
- **Utiliser un pouvoir** : 0 PA (nécessite 3 charges)
- **Passer son tour** : 0 PA (conserve les PA pour la vague suivante)

### Accumulation des PA
Les joueurs peuvent **stocker leurs PA** en passant leur tour, permettant des stratégies à long terme.

## Protection des blocs

### Blocs protégés
- Les blocs posés pendant la vague en cours sont **protégés**
- Affichage d'un **emoji bouclier 🛡️** sur les blocs protégés
- Impossible de détruire un bloc protégé
- La protection disparaît à la vague suivante

## Fin de vague

### Conditions
La vague se termine quand :
1. **Tous les joueurs ont 0 PA** (ont utilisé tous leurs points)
2. Ou après **60 secondes** (timeout)

### Animation
- Affichage en plein écran : **"Vague X"**
- Animation de **1 seconde**
- Fondu d'entrée et de sortie

## Interface utilisateur

### Boutons d'action
- **Placer (1 PA)** - Désactivé si PA < 1
- **Détruire (1 PA)** - Désactivé si PA < 1
- **Pouvoir** - Désactivé si charges < 3
- **Passer son tour** - Désactivé si PA = 0

### Affichage des informations
- **PA du joueur** : Affiché en gros dans la barre de statut
- **Liste des joueurs** : PA et charges de pouvoir pour chaque joueur
- **Message de statut** :
  - "A vous de jouer !" si PA > 0
  - "En attente des autres joueurs..." si PA = 0

### Grille
- Blocs protégés : Bordure dorée + emoji bouclier
- Blocs normaux : Affichage standard

## Système de pouvoirs

### Rechargement
- **+1 charge** par vague
- Maximum **3 charges**
- Utilisable à 3/3
- Retour à 0/3 après utilisation

### Classe Fast
Avantage spécial : **+2 PA par vague** au lieu de +1

## Fichiers modifiés

### Backend
- `/websocket/models/Player.js`
  - Ajout de `actionPoints`
  - Modification de `resetWave()` pour ajouter les PA
  - Ajout de `skipTurn()`
  - Ajout de `waveNumber` aux cellules
  - Protection des blocs de la vague en cours

- `/websocket/models/Game.js`
  - Ajout de `waveNumber` dans `generateGrid()`
  - Modification de `checkWaveComplete()` pour vérifier PA = 0
  - Ajout de `skipTurn()`
  - Ajout de `actionPoints` dans `getGameState()`

- `/websocket/gameManager.js`
  - Ajout de `handleSkipTurn()`

- `/websocket/server.js`
  - Ajout de l'événement `skip_turn`

### Frontend
- `/front/game.html`
  - Ajout du bouton "Passer son tour"
  - Ajout de l'affichage des PA
  - Ajout de l'overlay d'animation de vague

- `/front/js/game.js`
  - Ajout de `skipTurnBtn` et `actionPointsDisplay`
  - Modification de `updatePlayersList()` pour afficher les PA
  - Modification de `updateCooldowns()` pour gérer les PA
  - Modification de `updateBoard()` pour afficher les boucliers
  - Ajout de `showWaveAnimation()`
  - Gestion de l'événement `skip_turn`

- `/front/style/game.css`
  - Styles pour `.wave-overlay`
  - Animation `pulse`
  - Styles pour `.protected` et `.shield-icon`
  - Styles pour `.action-points` et `.skip-btn`

## Exemple de partie

### Vague 1
```
Joueur 1 : 1 PA
Joueur 2 : 1 PA
Joueur 3 : 1 PA
Joueur 4 (Fast) : 1 PA

Joueur 1 : Place un bloc (0 PA)
Joueur 2 : Passe son tour (1 PA stocké)
Joueur 3 : Détruit un bloc (0 PA)
Joueur 4 : Place un bloc (0 PA)

Tous les joueurs sauf Joueur 2 ont 0 PA
Joueur 2 doit jouer ou passer
```

### Vague 2
```
Joueur 1 : 1 PA
Joueur 2 : 2 PA (1 stocké + 1 nouveau)
Joueur 3 : 1 PA
Joueur 4 (Fast) : 2 PA

Les blocs de la vague 1 ne sont plus protégés
Les nouveaux blocs posés seront protégés
```

### Vague 4
```
Pouvoir: 3/3 (utilisable !)
```

## Stratégies possibles

1. **Économie** : Passer son tour pour accumuler des PA
2. **Agression** : Utiliser tous ses PA immédiatement
3. **Fast** : Profiter des +2 PA par vague pour dominer
4. **Timing** : Attendre d'avoir assez de PA pour une combo

## Test

```bash
cd /home/mateo/Documents/COURS/Morpion-JS/websocket
node server.js
```

Le système est maintenant complet et fonctionnel !
