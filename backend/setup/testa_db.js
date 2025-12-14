const db = require('./database');
(async () => {
  console.log('Testando conexão com o banco via database.js...');
  const ok = await db.testConnection();
  if (ok) {
    console.log('Conexão OK!');
  } else {
    console.log('Falha na conexão!');
  }
})();
