try {
  const db = require('./database');
  console.log('Importação de database.js OK!');
} catch (e) {
  console.error('Erro ao importar database.js:', e);
}
