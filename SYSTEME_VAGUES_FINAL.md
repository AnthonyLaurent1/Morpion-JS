# Système de vagues - Version finale

## Changements majeurs

### 1. Suppression complète du système de cooldown temporel
- Plus de cooldown en secondes
- Tout est basé sur les vagues

### 2. Nouveau système d'actions par vague

Chaque joueur peut effectuer **par vague** :
- **1 placement** de bloc (obligatoire)
- **1 destruction** de bloc (obligatoire)
- **1 utilisation de pouvoir** (si chargé à 3/3)

### 3. Système de charge des pouvoirs
- Les pouvoirs se rechargent de **+1 charge par vague**
- Maximum **3 charges**
- Utilisation possible quand 3/3 charges atteintes
- Après utilisation, retour à 0/3

### 4. Fin de vague automatique
- La vague se termine quand **tous les joueurs** ont placé ET détruit
- Ou après 60 secondes (timeout)
- Pause de 2 secondes entre les vagues

### 5. Nouvelle classe : L'Aléatoire
Remplace le Voyageur

**Caractéristiques** :
- Pouvoir aléatoire qui change après chaque utilisation
- Pouvoirs possibles : Bombman, Bombwoman, Parieur, Roulette, Shuffle
- Sélection aléatoire au début et après chaque utilisation

## Fichiers modifiés

### Backend

#### `/websocket/models/Player.js`
- Suppression de tous les cooldowns temporels
- Ajout de `hasPlacedThisWave` et `hasDestroyedThisWave`
- Ajout de `abilityCharges` (0-3)
- Nouvelle méthode `resetWave()` appelée au début de chaque vague
- Modification de `canPlace()`, `canDestroy()`, `canUseAbility()`

#### `/websocket/models/Game.js`
- Suppression de `playerActions` Map
- Modification de `startWave()` pour appeler `resetWave()` sur chaque joueur
- Simplification de `placeBlock()`, `destroyBlock()`, `useAbility()`
- Modification de `checkWaveComplete()` pour vérifier que tous ont placé ET détruit
- Mise à jour de `getGameState()` avec les nouvelles propriétés
- Mise à jour de `getPlayerClass()` pour inclure Aleatoire

#### `/websocket/models/classes/Aleatoire.js` (nouveau)
- Classe complète avec sélection aléatoire de pouvoir
- Implémentation de tous les pouvoirs possibles
- Changement de pouvoir après chaque utilisation

#### `/websocket/models/classes/index.js`
- Remplacement de Voyageur par Aleatoire

### Frontend

#### `/front/js/game.js`
- Mise à jour de `classInfo` avec Aleatoire
- Modification de `updatePlayersList()` pour afficher :
  - Actions disponibles (Placer / Detruire)
  - Charges du pouvoir (X/3)
- Modification de `updateCooldowns()` pour utiliser les nouvelles propriétés
- Affichage du statut : "Disponible: Placer / Detruire" ou "En attente..."

#### `/front/index.html`
- Remplacement de la carte Voyageur par Aleatoire

## Comportement du jeu

### Début de vague
```
Vague 1 commencée !
Disponible: Placer / Detruire
Pouvoir: 0/3
```

### Après placement
```
Disponible: Detruire
Pouvoir: 0/3
```

### Après destruction
```
En attente de la prochaine vague...
Pouvoir: 0/3
```

### Vague suivante
```
Vague 2 commencée !
Disponible: Placer / Detruire
Pouvoir: 1/3
```

### Après 3 vagues
```
Vague 4 commencée !
Disponible: Placer / Detruire
Pouvoir: 3/3 (utilisable !)
```

### Victoire
Dès qu'un joueur aligne 3 blocs de sa couleur, la partie s'arrête immédiatement et le gagnant est affiché.

## Test

1. Redémarrer le serveur
```bash
cd /home/mateo/Documents/COURS/Morpion-JS/websocket
node server.js
```

2. Connecter 4 joueurs avec des classes différentes

3. Chaque joueur doit :
   - Placer un bloc
   - Détruire un bloc
   - (Optionnel) Utiliser son pouvoir si chargé

4. La vague se termine automatiquement quand tous ont fini

5. Les charges de pouvoir augmentent de +1 à chaque vague

6. Aligner 3 blocs pour gagner

## Notes importantes

- Les joueurs DOIVENT placer ET détruire pour passer à la vague suivante
- Le pouvoir est optionnel et ne bloque pas la progression
- La classe Fast n'a plus d'avantage spécial (à ajuster si nécessaire)
- L'Aléatoire change de pouvoir après chaque utilisation réussie
