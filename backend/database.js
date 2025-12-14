require('dotenv').config();
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL (lida de backend/.env ou usa valores padrão)
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'pablodetoni',
  password: process.env.PGPASSWORD || '123mudar',
  database: process.env.PGDATABASE || 'pablo_jogos',
  // Se PGSSL=true no .env, ativa ssl com rejectUnauthorized false (útil para alguns ambientes locais/containers)
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
};

// Pool de conexões para melhor performance — opções do pool também podem ser ajustadas via .env
const pool = new Pool({
  ...dbConfig,
  max: Number(process.env.PG_POOL_MAX || 10),
  // tempo em ms antes de fechar uma conexão ociosa
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10000),
  // tempo máximo em ms para estabelecer conexão
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 30000)
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso!');
    await client.query('SET search_path TO public');
    client.release();
    return true;
  } catch (err) {
    console.error('Erro ao conectar com o PostgreSQL:', err.message || err);
    return false;
  }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO public');
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO public');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};

// ALTER USER pablodetoni WITH PASSWORD '123mudar';
// \q
