const express = require('express');
const router = express.Router();

const partidaController = require('../controllers/partidaController');

// Rota para obter campos permitidos por jogo
router.get('/campos/:jogo', partidaController.getCamposPorJogo);

// Rota para registrar uma nova partida
router.post('/', partidaController.registrarPartida);

// Listar todas partidas (com filtros: userId, gameId, page, limit, includeDeleted)
router.get('/', partidaController.listarPartidas);

// Buscar partida por ID
router.get('/:id', partidaController.buscarPorId);

// Listar partidas por usuário
router.get('/usuario/:id_usuario', partidaController.listarPorUsuario);

// Listar partidas por jogo
router.get('/jogo/:id_jogo', partidaController.listarPorJogo);

// Atualizar partida individual
router.put('/:id', partidaController.atualizarPartida);

// Atualizar partidas em massa (body: { ids: [], updates: {} })
router.put('/batch/update', partidaController.atualizarEmMassa);

// Restaurar partida excluída
router.patch('/:id/restore', partidaController.restaurarPartida);

// Excluir partida individual (?hard=true para delete físico)
router.delete('/:id', partidaController.excluirPartida);

// Excluir partidas em massa (?userId=&gameId=&ids=&hard=true)
router.delete('/', partidaController.excluirEmMassa);

module.exports = router;
