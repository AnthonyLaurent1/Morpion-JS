# Nouvelles fonctionnalités - Système de vagues et détection de victoire

## 1. Détection de victoire automatique

### Fonctionnement
- Après chaque action (placement, destruction, pouvoir), le système vérifie automatiquement si 3 blocs de la même couleur sont alignés
- Si un alignement est détecté, la partie s'arrête immédiatement et le gagnant est affiché
- Vérification dans toutes les directions : horizontal, vertical, diagonale haut-droite, diagonale bas-droite

### Implémentation
- La fonction `checkWin()` est appelée après chaque action réussie
- Si un gagnant est trouvé, `endGame('victory', winner)` est appelé
- L'écran de fin de partie affiche le gagnant avec sa couleur et sa classe

## 2. Système de vagues avec actions limitées

### Fonctionnement
- Chaque joueur dispose d'un nombre limité d'actions par vague :
  - **1 action** pour tous les joueurs
  - **2 actions** pour la classe "Fast"
- Une fois qu'un joueur a utilisé toutes ses actions, il doit attendre la vague suivante
- Quand tous les joueurs ont terminé leurs actions, la vague se termine automatiquement
- Sinon, la vague se termine après 60 secondes

### Implémentation

#### Backend (`Game.js`)
- Ajout de `playerActions` (Map) pour suivre les actions restantes de chaque joueur
- Au début de chaque vague, les actions sont réinitialisées
- Chaque action (place, destroy, ability) décrémente le compteur d'actions
- `checkWaveComplete()` vérifie si tous les joueurs ont fini et passe à la vague suivante

#### Frontend (`game.js`)
- Affichage du nombre d'actions restantes pour chaque joueur
- Désactivation des boutons d'action quand le joueur n'a plus d'actions
- Message de statut : "X action(s) restante(s)" ou "En attente des autres joueurs..."

## Fichiers modifiés

### Backend
- `/websocket/models/Game.js`
  - Ajout de `playerActions` Map
  - Modification de `startWave()` pour initialiser les actions
  - Modification de `placeBlock()`, `destroyBlock()`, `useAbility()` pour vérifier et décrémenter les actions
  - Ajout de `checkWaveComplete()` pour terminer la vague automatiquement
  - Appel de `checkWin()` après chaque action avec fin de partie si victoire
  - Ajout de `actionsLeft` dans `getGameState()`

### Frontend
- `/front/js/game.js`
  - Modification de `updatePlayersList()` pour afficher les actions restantes
  - Modification de `updateCooldowns()` pour désactiver les boutons sans actions
  - Ajout du message de statut pour informer le joueur

## Test

1. Démarrer le serveur
2. Connecter 4 joueurs
3. Chaque joueur peut faire 1 action (2 pour Fast)
4. Une fois les actions terminées, attendre que tous les joueurs finissent
5. La vague suivante démarre automatiquement
6. Aligner 3 blocs de la même couleur pour gagner

## Comportement attendu

### Début de vague
```
Vague 1 commencée !
1 action(s) restante(s)
```

### Après une action
```
En attente des autres joueurs...
```

### Tous les joueurs ont fini
```
Vague 1 terminée !
[2 secondes de pause]
Vague 2 commencée !
1 action(s) restante(s)
```

### Victoire
```
[Un joueur aligne 3 blocs]
Partie terminée
Écran de victoire affiché
```

## Notes techniques

- Le système de cooldown reste actif (2.5s entre chaque action)
- Les actions sont comptées séparément des cooldowns
- La classe Fast a toujours 2 actions par vague
- La vague se termine soit quand tous ont fini, soit après 60 secondes
- La détection de victoire est prioritaire sur la fin de vague
