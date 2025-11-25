const fs = require('fs');
const path = require('path');

const HTML_TEMPLATE = path.join(__dirname, '../../frontend/html/template-jogo.html');
const CSS_TEMPLATE = path.join(__dirname, '../../frontend/css/template-jogo.css');
const JS_TEMPLATE = path.join(__dirname, '../../frontend/js/template-jogo.js');

const HTML_DIR = path.join(__dirname, '../../frontend/html');
const CSS_DIR = path.join(__dirname, '../../frontend/css');
const JS_DIR = path.join(__dirname, '../../frontend/js');

function criarArquivosJogo(slug, titulo) {
  try {
    // HTML
    const htmlDestino = path.join(HTML_DIR, `${slug}.html`);
    let html = fs.readFileSync(HTML_TEMPLATE, 'utf8');
    html = html.replace(/__TITULO__/g, titulo)
               .replace(/__CSS__/g, `${slug}.css`)
               .replace(/__JS__/g, `${slug}.js`);
    fs.writeFileSync(htmlDestino, html);
    // CSS
    fs.copyFileSync(CSS_TEMPLATE, path.join(CSS_DIR, `${slug}.css`));
    // JS
    fs.copyFileSync(JS_TEMPLATE, path.join(JS_DIR, `${slug}.js`));
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
