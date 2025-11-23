// Rotas para endpoint de ranking
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');

router.get('/', rankingController.listarRanking);

// Arquivo de rotas /ranking desabilitado pois a tabela estatistica_usuario_jogo não existe mais
// Nenhuma rota exportada

module.exports = {};
