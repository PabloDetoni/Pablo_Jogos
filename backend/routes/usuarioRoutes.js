// Rotas para CRUD de usuario
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const usuarioAuthController = require('../controllers/usuarioAuthController');

router.get('/', usuarioController.listarUsuarios);
router.post('/', usuarioController.criarUsuario);
router.put('/:id', usuarioController.atualizarUsuario);
router.delete('/:id', usuarioController.deletarUsuario);
router.post('/login', usuarioAuthController.login);
router.post('/register', usuarioAuthController.register);
router.get('/:id', usuarioController.listarUsuarioPorId);

module.exports = router;
