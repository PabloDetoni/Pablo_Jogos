// BACKEND Node.js/Express para login e registro
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Para armazenar usuários em memória (apenas para testes!)
// Em produção, use um banco de dados real.
const users = [];

const app = express();
const PORT = 3001;

// Permite requisições do frontend tanto de localhost quanto de 127.0.0.1
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(bodyParser.json());

function validateEmail(email) {
  // Regex simples só para exemplo
  return /\S+@\S+\.\S+/.test(email);
}

app.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || nome.length > 20) {
    return res.json({ success: false, message: 'Nome inválido.' });
  }
  if (!validateEmail(email)) {
    return res.json({ success: false, message: 'Email inválido.' });
  }
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 20) {
    return res.json({ success: false, message: 'A senha deve ter entre 8 e 20 caracteres.' });
  }
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: 'Email já cadastrado.' });
  }

  users.push({ nome, email, senha }); // Nunca salve senha assim em produção!
  // Retorne user: { nome, email } para o frontend funcionar corretamente
  return res.json({ success: true, user: { nome, email } });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (user) {
    // Retorne user: { nome, email } para o frontend funcionar corretamente
    return res.json({ success: true, user: { nome: user.nome, email: user.email } });
  } else {
    return res.json({ success: false, message: 'Email ou senha inválidos.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});