// Rotas para ranking avançado
const express = require('express');
const router = express.Router();
const rankingAvancadoController = require('../controllers/rankingAvancadoController');

router.post('/advanced', rankingAvancadoController.buscarRanking);
router.post('/advanced/add', rankingAvancadoController.adicionarOuAtualizar);

module.exports = router;
