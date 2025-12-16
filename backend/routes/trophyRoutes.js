// Rotas para trophy (instâncias de troféus atribuídos a usuários)
const express = require('express');
const router = express.Router();
const trophyController = require('../controllers/trophyController');

// ========== Instâncias de Troféu (atribuições) ==========

// Listar todos os troféus atribuídos
router.get('/', trophyController.listar);

// Listar troféus de um usuário específico
router.get('/usuario/:id_usuario', trophyController.listarPorUsuario);

// Buscar troféu por ID
router.get('/:id', trophyController.buscarPorId);

// Atribuir troféu a usuário
router.post('/assign', trophyController.atribuir);

// Revogar (remover) troféu
router.delete('/revoke/:id', trophyController.revogar);

// Alias para compatibilidade
router.post('/', trophyController.atribuir);
router.delete('/:id', trophyController.revogar);

// ========== Tipos de Troféu (catálogo) ==========

// Listar todos os tipos
router.get('/types', trophyController.listarTipos);

// Buscar tipo por ID
router.get('/types/:id', trophyController.buscarTipoPorId);

// Criar novo tipo
router.post('/types', trophyController.criarTipo);

// Atualizar tipo
router.put('/types/:id', trophyController.atualizarTipo);

// Excluir tipo
router.delete('/types/:id', trophyController.excluirTipo);

module.exports = router;
