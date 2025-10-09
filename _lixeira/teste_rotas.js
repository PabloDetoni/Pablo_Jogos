const rotas = [
  './routes/jogoRoutes',
  './routes/usuarioRoutes',
  './routes/estatisticaRoutes',
  './routes/adminRoutes',
  './routes/rankingRoutes'
];

for (const rota of rotas) {
  try {
    require(rota);
    console.log(`Importação de ${rota} OK!`);
  } catch (e) {
    console.error(`Erro ao importar ${rota}:`, e);
  }
}
