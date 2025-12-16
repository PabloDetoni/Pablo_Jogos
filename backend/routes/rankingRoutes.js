// Rotas para endpoint de ranking - DESCONTINUADO
// Rankings agora são calculados no frontend a partir de GET /api/partida
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

// Rota mantida para compatibilidade, retorna mensagem de descontinuado
router.get('/', rankingController.listarRanking);

module.exports = router;

