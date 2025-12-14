const fs = require('fs');
const path = require('path');

// Templates agora ficam em frontend/html/estrutura, css e js de template em frontend/css/estrutura e frontend/js/estrutura
const HTML_TEMPLATE = path.join(__dirname, '../../frontend/html/estrutura/template-jogo.html');
const CSS_TEMPLATE = path.join(__dirname, '../../frontend/css/estrutura/template-jogo.css');
const JS_TEMPLATE = path.join(__dirname, '../../frontend/js/estrutura/template-jogo.js');

// Arquivos gerados para cada jogo vão para as pastas frontend/html/jogos, frontend/css/jogos e frontend/js/jogos
const HTML_DIR = path.join(__dirname, '../../frontend/html/jogos');
const CSS_DIR = path.join(__dirname, '../../frontend/css/jogos');
const JS_DIR = path.join(__dirname, '../../frontend/js/jogos');

function criarArquivosJogo(slug, titulo) {
  try {
    // Garante que diretórios existem
    [HTML_DIR, CSS_DIR, JS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // HTML
    const htmlDestino = path.join(HTML_DIR, `${slug}.html`);
    let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');
    // Substitui placeholders e ajusta paths para apontar para /frontend/.../jogos/
    html = html.replace(/__TITULO__/g, titulo)
               .replace(/__CSS__/g, `jogos/${slug}.css`)
               .replace(/__JS__/g, `jogos/${slug}.js`);
    fs.writeFileSync(htmlDestino, html, 'utf8');

    // CSS
    fs.copyFileSync(CSS_TEMPLATE, path.join(CSS_DIR, `${slug}.css`));
    // JS
    fs.copyFileSync(JS_TEMPLATE, path.join(JS_DIR, `${slug}.js`));

    console.log(`Arquivos do jogo '${titulo}' (${slug}) criados em frontend/html/jogos, frontend/css/jogos, frontend/js/jogos`);
    return true;
  } catch (err) {
    throw new Error('Falha ao criar arquivos do jogo: ' + err.message);
  }
}

function removerArquivosJogo(slug) {
  try {
    fs.unlinkSync(path.join(HTML_DIR, `${slug}.html`));
    fs.unlinkSync(path.join(CSS_DIR, `${slug}.css`));
    fs.unlinkSync(path.join(JS_DIR, `${slug}.js`));
    return true;
  } catch (err) {
    throw new Error('Falha ao remover arquivos do jogo: ' + err.message);
  }
}

module.exports = { criarArquivosJogo, removerArquivosJogo };
