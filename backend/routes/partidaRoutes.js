const express = require('express');
const router = express.Router();

// Controller (crie depois em controllers/partidaController.js)
const partidaController = require('../controllers/partidaController');

// Rota para registrar uma nova partida
router.post('/', partidaController.registrarPartida);

// Outras rotas de partida podem ser adicionadas aqui

module.exports = router;
