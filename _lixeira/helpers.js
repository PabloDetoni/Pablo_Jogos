// backend/helpers.js
// Funções utilitárias para o backend

const bcrypt = require('bcryptjs');

// Gera hash seguro para senha
async function gerarHashSenha(senha) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

// Compara senha com hash
async function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

// Gera payload JWT para autenticação
function gerarPayloadJWT(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    isadmin: usuario.isadmin
  };
}

module.exports = {
  gerarHashSenha,
  compararSenha,
  gerarPayloadJWT
};
