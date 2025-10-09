// Rotas para CRUD de jogo
const express = require('express');
const router = express.Router();
const jogoController = require('../controllers/jogoController');

router.get('/', jogoController.listar);
router.post('/', jogoController.criar);
router.put('/:id', jogoController.editar);
router.delete('/:id', jogoController.excluir);

module.exports = router;
