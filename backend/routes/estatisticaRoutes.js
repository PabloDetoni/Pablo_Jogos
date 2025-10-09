// Rotas para CRUD de estatistica
const express = require('express');
const router = express.Router();
const estatisticaController = require('../controllers/estatisticaController');

router.get('/', estatisticaController.listar);
router.get('/:id', estatisticaController.getById);
router.post('/', estatisticaController.criar);
router.put('/:id', estatisticaController.atualizar);
router.delete('/:id', estatisticaController.deletar);

module.exports = router;
