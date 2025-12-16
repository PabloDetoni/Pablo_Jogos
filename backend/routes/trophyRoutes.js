// Rotas para trophy
const express = require('express');
const router = express.Router();
const trophyController = require('../controllers/trophyController');

router.get('/', trophyController.listar);
router.get('/usuario/:id_usuario', trophyController.listarPorUsuario);
router.post('/', trophyController.criar);
router.delete('/:id', trophyController.deletar);

module.exports = router;
