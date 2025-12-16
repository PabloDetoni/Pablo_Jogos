const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./database');
const initializerController = require('./controllers/initializerController');

const HOST = 'localhost';
const PORT_FIXA = 3001;

const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));
// Serve a pasta frontend também sob o prefixo /frontend — isso permite que
// URLs como /frontend/css/... e /frontend/js/... funcionem corretamente
// sem alterar a estrutura dos arquivos.
app.use('/frontend', express.static(caminhoFrontend));
app.use(cookieParser());

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// --- ROTAS DO SISTEMA --- //
console.log('Importando rotas...');
const jogoRoutes = require('./routes/jogoRoutes');
console.log('jogoRoutes OK');
const usuarioRoutes = require('./routes/usuarioRoutes');
console.log('usuarioRoutes OK');
const estatisticaRoutes = require('./routes/estatisticaRoutes');
console.log('estatisticaRoutes OK');
const adminRoutes = require('./routes/adminRoutes');
console.log('adminRoutes OK');
const rankingAvancadoRoutes = require('./routes/rankingAvancadoRoutes');
console.log('rankingAvancadoRoutes OK');
const partidaRoutes = require('./routes/partidaRoutes');
console.log('partidaRoutes OK');
const trophyTypeRoutes = require('./routes/trophyTypeRoutes');
console.log('trophyTypeRoutes OK');
const trophyRoutes = require('./routes/trophyRoutes');
console.log('trophyRoutes OK');
const dashboardRoutes = require('./routes/dashboardRoutes');
console.log('dashboardRoutes OK');

app.use('/jogo', jogoRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/estatistica', estatisticaRoutes);
app.use('/admin', adminRoutes);
app.use('/rankings', rankingAvancadoRoutes);
app.use('/api/partida', partidaRoutes);
app.use('/trophy_type', trophyTypeRoutes);
app.use('/trophy', trophyRoutes);
app.use('/dashboard', dashboardRoutes);
console.log('Todas as rotas aplicadas');

// Rota padrão
app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar a conexão com o banco
defaultHealth = false;
app.get('/health', async (req, res) => {
  try {
    if (defaultHealth) console.log('Entrou na rota /health');
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();
    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }
    console.log('✅ PostgreSQL conectado com sucesso');
    // Garante que admin e jogos padrões existem
    await initializerController.init();
    const PORT = process.env.PORT || PORT_FIXA;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

startServer();
