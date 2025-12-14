// Rotas para CRUD de usuario
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const initializerController = require('../controllers/initializerController');

router.get('/', usuarioController.listarUsuarios);
router.post('/', usuarioController.criarUsuario);
router.put('/:id', usuarioController.atualizarUsuario);
router.delete('/:id', usuarioController.deletarUsuario);
router.post('/login', initializerController.login);
router.post('/register', initializerController.register);
router.get('/:id', usuarioController.listarUsuarioPorId);

module.exports = router;
