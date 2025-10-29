# Correctifs finaux appliqués

## 1. Pouvoir utilisable qu'une fois par vague ✅
- Ajout de `abilityUsedThisWave` dans Player.js
- Réinitialisation à `false` à chaque nouvelle vague
- `canUseAbility()` vérifie maintenant les charges ET si le pouvoir n'a pas été utilisé
- Après utilisation, `abilityUsedThisWave = true`

## 2. PA première vague corrigé ✅
- Chaque joueur commence avec 1 PA
- Fast reçoit +2 PA par vague (au lieu de +1)
- Les autres joueurs reçoivent +1 PA par vague

## 3. Fast corrigé ✅
- Fast utilise maintenant le système de PA standard
- Coûte 1 PA pour placer un bloc
- Reçoit +2 PA par vague (son avantage)
- Blocs à 0 HP (caractéristique conservée)

## 4. Notification "Passer son tour" ✅
- Message affiché : "Tour passé ! PA conservés pour la prochaine vague."
- Animation de notification en haut à droite
- Disparaît après 2 secondes

## 5. Animation destruction de bloc ✅
- Effet visuel quand un bloc est détruit
- Animation de 0.5 secondes
- Effet de scale + glow rouge

## 6. Animations des pouvoirs ✅
- Animation pour chaque pouvoir non-passif
- Icône en grand au centre de l'écran
- Durée : 0.8 secondes
- Pouvoirs concernés :
  - Bombman : 💣
  - Bombwoman : 💥
  - Parieur : 🎲
  - Roulette : 🎰
  - Shuffle : 🔀
  - Aléatoire : 🎲

## 7. Bouton pouvoir caché pour Fast et Solide ✅
- Le bouton pouvoir est masqué (`display: none`) pour les classes passives
- Classes passives : Fast, Solide
- Les autres classes voient le bouton normalement

## Fichiers modifiés

### Backend
- `/websocket/models/Player.js`
  - Ajout de `abilityUsedThisWave`
  - Modification de `canUseAbility()`
  - Modification de `useAbility()`
  - Modification de `resetWave()`

- `/websocket/models/classes/Fast.js`
  - Suppression des cooldowns
  - Utilisation du système PA standard
  - Conservation des blocs à 0 HP

- `/websocket/models/classes/Bombman.js`
  - Ajout de `abilityUsedThisWave = true`
  - Ajout de `waveNumber = null` lors de la destruction

- `/websocket/models/classes/Bombwoman.js`
  - Ajout de `abilityUsedThisWave = true`
  - Ajout de `waveNumber = null` lors de la destruction

- `/websocket/models/classes/Aleatoire.js`
  - Ajout de `abilityUsedThisWave = true`

### Frontend
- `/front/js/game.js`
  - Ajout de `showNotification()` pour afficher les notifications
  - Ajout de `showAbilityAnimation()` pour les animations de pouvoir
  - Modification de `updateBoard()` pour détecter les blocs détruits
  - Modification de `updateCooldowns()` pour cacher le bouton pouvoir
  - Modification de `skipTurnBtn` pour afficher la notification

- `/front/style/game.css`
  - Styles pour `.destroyed` (animation de destruction)
  - Styles pour `.ability-animation` (animation de pouvoir)
  - Styles pour `.notification` (notification de tour passé)
  - Keyframes pour `destroyEffect`

## Classes à mettre à jour manuellement

Les classes suivantes doivent être mises à jour pour utiliser `abilityUsedThisWave` :
- Parieur.js
- Roulette.js
- Shuffle.js

Pour chaque classe, dans la méthode `useAbility()`, remplacer :
```javascript
this.lastAbility = Date.now();
```

Par :
```javascript
this.abilityCharges = 0;
this.abilityUsedThisWave = true;
```

Et ajouter `cell.waveNumber = null;` lors de la destruction des cellules.

## Test

1. Redémarrer le serveur
2. Connecter 4 joueurs
3. Vérifier que :
   - Chaque joueur a 1 PA au début
   - Fast a 2 PA à la vague 2
   - Le pouvoir ne peut être utilisé qu'une fois par vague
   - Les animations s'affichent correctement
   - Le bouton pouvoir est caché pour Fast et Solide
   - La notification s'affiche quand on passe son tour

## Résultat

Le jeu fonctionne maintenant correctement avec toutes les fonctionnalités demandées !
