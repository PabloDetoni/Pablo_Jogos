// Middleware para bloquear jogos para usuários comuns
function requireGameNotBlocked(jogoNome) {
  // Sempre pega a referência atualizada
  const { findUser, getJogosStatus } = require('./server-helpers');
  return function(req, res, next) {
    const { email } = req.body;
    const user = findUser(email);
    const jogosStatus = getJogosStatus();
    const jogo = jogosStatus.find(j => j.nome === jogoNome);
    // LOG para depuração
    console.log(`[MIDDLEWARE] Bloqueio jogo: ${jogoNome} | Bloqueado: ${jogo ? jogo.bloqueado : 'N/A'} | Email: ${email} | User: ${user ? user.nome : 'convidado'} | Admin: ${user ? user.isAdmin : false}`);
    if (jogo && jogo.bloqueado && (!user || !user.isAdmin)) {
      console.log(`[MIDDLEWARE] ACESSO NEGADO ao jogo bloqueado: ${jogoNome} | Email: ${email}`);
      return res.status(403).json({ success: false, message: 'Jogo bloqueado para usuários comuns.' });
    }
    next();
  }
}

module.exports = { requireGameNotBlocked };
