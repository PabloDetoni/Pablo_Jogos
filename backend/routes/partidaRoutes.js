const express = require('express');
const router = express.Router();

// Controller (crie depois em controllers/partidaController.js)
const partidaController = require('../controllers/partidaController');

// Rota para registrar uma nova partida
router.post('/', partidaController.registrarPartida);
// Listar todas partidas
router.get('/', partidaController.listarPartidas);
// Listar partidas por usuário
router.get('/usuario/:id_usuario', partidaController.listarPorUsuario);
// Listar partidas por jogo
router.get('/jogo/:id_jogo', partidaController.listarPorJogo);

module.exports = router;
