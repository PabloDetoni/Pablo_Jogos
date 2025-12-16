// Rotas para trophy_type
const express = require('express');
const router = express.Router();
const trophyTypeController = require('../controllers/trophyTypeController');

router.get('/', trophyTypeController.listar);
router.post('/', trophyTypeController.criar);
router.put('/:id', trophyTypeController.atualizar);
router.delete('/:id', trophyTypeController.deletar);

module.exports = router;
