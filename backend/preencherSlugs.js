const db = require('./database');

function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function preencherSlugs() {
  const { rows } = await db.query('SELECT id, titulo FROM jogo WHERE slug IS NULL OR slug = ''' );
  for (const jogo of rows) {
    const slug = slugify(jogo.titulo);
    // Garante unicidade
    const existe = await db.query('SELECT 1 FROM jogo WHERE slug = $1', [slug]);
    let slugFinal = slug;
    let i = 2;
    while (existe.rows.length) {
      slugFinal = `${slug}-${i}`;
      const existeNovo = await db.query('SELECT 1 FROM jogo WHERE slug = $1', [slugFinal]);
      if (!existeNovo.rows.length) break;
      i++;
    }
    await db.query('UPDATE jogo SET slug = $1 WHERE id = $2', [slugFinal, jogo.id]);
    console.log(`Jogo ${jogo.titulo} atualizado com slug: ${slugFinal}`);
  }
  console.log('Slugs preenchidos!');
  process.exit();
}

preencherSlugs();
