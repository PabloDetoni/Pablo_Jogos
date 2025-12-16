// Rotas para Dashboard e Ferramentas Administrativas
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// ==================== MÉTRICAS DO DASHBOARD ====================

// Métricas gerais (totais)
router.get('/metricas', dashboardController.getMetricasGerais);

// Métricas por jogo
router.get('/metricas/jogos', dashboardController.getMetricasPorJogo);

// Métricas de atividade
router.get('/metricas/atividade', dashboardController.getMetricasAtividade);

// Top ranking
router.get('/ranking/top', dashboardController.getTopRanking);

// ==================== FERRAMENTAS ====================

// Backup JSON
router.get('/backup/json', dashboardController.gerarBackup);

// Backup SQL
router.get('/backup/sql', dashboardController.gerarBackupSQL);

// Reset do sistema (POST com confirmação)
router.post('/reset', dashboardController.resetSistema);

// Limpar partidas por jogo
router.post('/limpar/jogo', dashboardController.limparPartidasPorJogo);

// Limpar partidas por usuário
router.post('/limpar/usuario', dashboardController.limparPartidasPorUsuario);

// Verificar/recalcular ranking
router.post('/ranking/verificar', dashboardController.recalcularRanking);

module.exports = router;
