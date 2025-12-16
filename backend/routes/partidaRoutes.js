const express = require('express');
const router = express.Router();

const partidaController = require('../controllers/partidaController');

// Rota para obter campos permitidos por jogo
router.get('/campos/:jogo', partidaController.getCamposPorJogo);

// Rota para registrar uma nova partida
router.post('/', partidaController.registrarPartida);

// Listar todas partidas (com filtros: userId, gameId, page, limit, includeDeleted)
router.get('/', partidaController.listarPartidas);

// Listar partidas por usuário - DEVE VIR ANTES DE /:id
router.get('/usuario/:id_usuario', partidaController.listarPorUsuario);

// Listar partidas por jogo - DEVE VIR ANTES DE /:id
router.get('/jogo/:id_jogo', partidaController.listarPorJogo);

// Atualizar partidas em massa (body: { ids: [], updates: {} }) - DEVE VIR ANTES DE /:id
router.put('/batch/update', partidaController.atualizarEmMassa);

// Buscar partida por ID - DEVE VIR APÓS ROTAS ESPECÍFICAS
router.get('/:id', partidaController.buscarPorId);

// Atualizar partida individual
router.put('/:id', partidaController.atualizarPartida);

// Restaurar partida excluída
router.patch('/:id/restore', partidaController.restaurarPartida);

// Excluir partida individual (?hard=true para delete físico)
router.delete('/:id', partidaController.excluirPartida);

// Excluir partidas em massa (?userId=&gameId=&ids=&hard=true)
router.delete('/', partidaController.excluirEmMassa);

module.exports = router;
