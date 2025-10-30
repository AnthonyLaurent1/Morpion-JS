import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rankingsPath = path.join(__dirname, '../rankings.json');

class RankingManager {
  constructor() {
    this.ensureRankingsFile();
  }

  ensureRankingsFile() {
    if (!fs.existsSync(rankingsPath)) {
      fs.writeFileSync(rankingsPath, JSON.stringify({ players: [] }));
    }
  }

  loadRankings() {
    try {
      const data = fs.readFileSync(rankingsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors de la lecture des classements:', error);
      return { players: [] };
    }
  }

  saveRankings(rankings) {
    try {
      fs.writeFileSync(rankingsPath, JSON.stringify(rankings, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des classements:', error);
    }
  }

  calculateEloChange(playerElo, opponentElo, isWinner) {
    // Calculer la différence d'ELO
    const eloDiff = opponentElo - playerElo;
    
    if (isWinner) {
      // Pour une victoire
      if (eloDiff > 0) {
        // Gagner contre un plus fort : bonus basé sur la différence
        return Math.min(30, Math.max(10, 15 + Math.floor(eloDiff / 50)));
      } else {
        // Gagner contre un plus faible : gain minimum
        return 10;
      }
    } else {
      // Pour une défaite
      if (eloDiff < 0) {
        // Perdre contre un plus faible : malus basé sur la différence
        return Math.max(-30, Math.min(-10, -15 + Math.floor(eloDiff / 50)));
      } else {
        // Perdre contre un plus fort : perte minimum
        return -10;
      }
    }
  }

  updatePlayerScore(pseudo, isWinner, opponents) {
    if (!pseudo) return;

    const rankings = this.loadRankings();
    let playerIndex = rankings.players.findIndex(p => p.pseudo === pseudo);

    // Calculer l'ELO moyen des adversaires
    const averageOpponentElo = opponents
      .filter(o => o !== pseudo)
      .map(o => {
        const p = rankings.players.find(pl => pl.pseudo === o);
        return p ? p.elo : 1000;
      })
      .reduce((sum, elo) => sum + elo, 0) / (opponents.length - 1);

    // Récupérer ou créer le joueur
    let player;
    if (playerIndex === -1) {
      // Nouveau joueur - commence avec un ELO de 1000
      player = {
        pseudo: pseudo,
        elo: 1000,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        gamesPlayed: 1
      };
      rankings.players.push(player);
      playerIndex = rankings.players.length - 1;
    } else {
      player = rankings.players[playerIndex];
      player.wins = (player.wins || 0) + (isWinner ? 1 : 0);
      player.losses = (player.losses || 0) + (isWinner ? 0 : 1);
      player.gamesPlayed = (player.gamesPlayed || 0) + 1;
    }

    // Calculer et appliquer le changement d'ELO
    const eloChange = this.calculateEloChange(
      player.elo || 1000,
      averageOpponentElo,
      isWinner
    );
    player.elo = Math.max(0, (player.elo || 1000) + eloChange);
    // Stocker le dernier changement d'ELO pour l'affichage
    player.lastEloChange = eloChange;

    this.saveRankings(rankings);
  }

  // Mise à jour en batch pour tous les joueurs d'une partie
  updateGameResults(winner, allPlayers) {
    const winnerPseudo = winner ? winner.pseudo : null;
    const allPseudos = allPlayers.map(p => p.pseudo).filter(p => p);
    
    allPlayers.forEach(player => {
      if (player.pseudo) {
        this.updatePlayerScore(
          player.pseudo,
          player.pseudo === winnerPseudo,
          allPseudos
        );
      }
    });
  }

  getRankings() {
    const rankings = this.loadRankings();
    return rankings.players || [];
  }
}

export default new RankingManager();