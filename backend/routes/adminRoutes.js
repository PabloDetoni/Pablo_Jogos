// Rotas para CRUD de admin
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Listar todos admins
router.get('/', adminController.listarAdmins);

// Buscar admin por ID de usuário
router.get('/:id_usuario', adminController.buscarPorId);

// Promover usuário a admin
router.post('/', adminController.criarAdmin);

// Atualizar nível de permissão
router.put('/:id_usuario', adminController.atualizarAdmin);

// Remover admin (rebaixar)
router.delete('/:id_usuario', adminController.deletarAdmin);

module.exports = router;
