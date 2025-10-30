import express from 'express';
import RankingManager from '../models/RankingManager.js';

const router = express.Router();

// Route pour récupérer le classement
router.get('/leaderboard', async (req, res) => {
  try {
    const rankings = await RankingManager.getRankings();
    if (!rankings || rankings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Aucun classement trouvé',
        data: []
      });
    }
    
    // Trier par ELO décroissant
    const sortedRankings = rankings.sort((a, b) => b.elo - a.elo);
    
    // Ne retourner que les 10 premiers
    const top10 = sortedRankings.slice(0, 10);
    
    res.status(200).json({
      success: true,
      message: 'Classement récupéré avec succès',
      data: top10
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement',
      error: error.message
    });
  }
});

export default router;