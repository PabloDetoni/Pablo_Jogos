// Rotas para CRUD de admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.listarAdmins);
router.post('/', adminController.criarAdmin);
router.put('/:id_usuario', adminController.atualizarAdmin);
router.delete('/:id_usuario', adminController.deletarAdmin);

module.exports = router;
