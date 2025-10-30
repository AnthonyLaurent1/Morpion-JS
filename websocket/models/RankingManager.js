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

  updatePlayerScore(pseudo, isWinner) {
    if (!pseudo) return;

    const rankings = this.loadRankings();
    const playerIndex = rankings.players.findIndex(p => p.pseudo === pseudo);
    const trophyChange = isWinner ? 50 : -30;

    if (playerIndex === -1) {
      // Nouveau joueur
      rankings.players.push({
        pseudo: pseudo,
        trophies: Math.max(0, trophyChange),
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1
      });
    } else {
      // Joueur existant
      const player = rankings.players[playerIndex];
      player.trophies = Math.max(0, player.trophies + trophyChange);
      if (isWinner) {
        player.wins = (player.wins || 0) + 1;
      } else {
        player.losses = (player.losses || 0) + 1;
      }
    }

    this.saveRankings(rankings);
  }

  // Mise à jour en batch pour tous les joueurs d'une partie
  updateGameResults(winner, allPlayers) {
    const winnerPseudo = winner ? winner.pseudo : null;
    
    allPlayers.forEach(player => {
      if (player.pseudo) {
        this.updatePlayerScore(player.pseudo, player.pseudo === winnerPseudo);
      }
    });
  }

  getRankings() {
    const rankings = this.loadRankings();
    return rankings.players || [];
  }
}

export default new RankingManager();