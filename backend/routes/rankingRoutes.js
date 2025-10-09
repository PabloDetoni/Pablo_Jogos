// Rotas para endpoint de ranking
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

router.get('/', rankingController.listarRanking);

module.exports = router;
