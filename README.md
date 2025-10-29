🎮 Morpion (Tic-Tac-Toe)
📝 Description
Le Morpion est un jeu de plateau classique pour 2 joueurs. Chaque joueur choisit un symbole : ❌ X ou ⭕ O.
Le but : aligner 3 symboles horizontalement, verticalement ou en diagonale avant l’adversaire.

🎲 Règles du jeu0
✅ Le jeu se joue sur une grille 3x3.
🔄 Les joueurs jouent à tour de rôle :
Joueur 1 → ❌
Joueur 2 → ⭕
🚫 Chaque case ne peut contenir qu’un seul symbole.
🏆 Le jeu se termine quand :
Un joueur aligne 3 symboles → Victoire
Toutes les cases sont remplies sans alignement → Égalité

💻 Fonctionnement du programme
Le morpion est développé avec HTML, CSS et JavaScript :
1️⃣ Grille de jeu
Une grille 3x3 est affichée sur l’écran.
Chaque case est cliquable et reçoit le symbole du joueur actif.
2️⃣ Tour par tour
Variable currentPlayer → détermine le joueur en cours.
Après chaque coup : X → O → X → ...
3️⃣ Détection de victoire
Après chaque coup, le programme vérifie :
🟰 Horizontalement
🟰 Verticalement
🟰 Diagonalement
Si un joueur gagne → message "Joueur ❌/⭕ gagne !"
4️⃣ Match nul
Toutes les cases remplies + pas de gagnant → Égalité.
5️⃣ Redémarrage
🔄 Bouton Recommencer → réinitialise la grille pour une nouvelle partie.
