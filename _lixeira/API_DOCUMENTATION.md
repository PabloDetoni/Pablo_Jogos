# API REST – Sistema de Jogos

## Endpoints e Exemplos de Uso

---

## Usuário

### Listar todos
- **GET** `/usuario`
- **Response:**
```json
[
  { "id": 1, "nome": "João", "status": "ativo", "criado_em": "2025-09-25T12:00:00Z" },
  ...
]
```

### Buscar por ID
- **GET** `/usuario/{id}`
- **Response:**
```json
{ "id": 1, "nome": "João", "status": "ativo", "criado_em": "2025-09-25T12:00:00Z" }
```

### Criar
- **POST** `/usuario`
- **Body:**
```json
{ "nome": "João", "status": "ativo" }
```
- **Response:**
```json
{ "id": 1, "nome": "João", "status": "ativo", "criado_em": "2025-09-25T12:00:00Z" }
```

### Atualizar
- **PUT** `/usuario/{id}`
- **Body:**
```json
{ "nome": "João da Silva", "status": "ativo" }
```

### Excluir
- **DELETE** `/usuario/{id}`

---

## Jogo

### Listar todos
- **GET** `/jogo`

### Buscar por ID
- **GET** `/jogo/{id}`

### Criar
- **POST** `/jogo`
- **Body:**
```json
{ "titulo": "2048", "genero": "Puzzle", "descricao": "Jogo de lógica" }
```

### Atualizar
- **PUT** `/jogo/{id}`
- **Body:**
```json
{ "titulo": "2048", "genero": "Puzzle", "descricao": "Jogo de lógica atualizado" }
```

### Excluir
- **DELETE** `/jogo/{id}`

---

## Estatística Usuário x Jogo

### Listar todas
- **GET** `/estatistica`

### Buscar por ID
- **GET** `/estatistica/{id}`

### Criar
- **POST** `/estatistica`
- **Body:**
```json
{
  "id_usuario": 1,
  "id_jogo": 2,
  "id_dificuldade": 1,
  "vitorias": 10,
  "vitorias_consecutivas": 3,
  "pontuacao": 2000,
  "menor_tempo": 120,
  "erros": 2
}
```

### Atualizar
- **PUT** `/estatistica/{id}`
- **Body:** igual ao POST

### Excluir
- **DELETE** `/estatistica/{id}`

---

## Admin

### Listar todos
- **GET** `/admin`

### Buscar por ID de usuário
- **GET** `/admin/{id_usuario}`

### Promover usuário a admin
- **POST** `/admin`
- **Body:**
```json
{ "id_usuario": 1, "nivel_permissao": 1 }
```

### Alterar permissão
- **PUT** `/admin/{id_usuario}`
- **Body:**
```json
{ "nivel_permissao": 2 }
```

### Remover admin
- **DELETE** `/admin/{id_usuario}`

---

## Ranking

### Listar ranking geral
- **GET** `/ranking`
- **Query params opcionais:** `?id_jogo=2&tipo_ranking=maior_pontuacao&id_dificuldade=1`
- **Response:**
```json
[
  { "posicao": 1, "id_usuario": 1, "id_jogo": 2, "pontuacao": 2000, "vitorias": 10, "menor_tempo": 120 },
  ...
]
```

---

## Observações
- Todos os endpoints retornam JSON.
- Para erros, o backend retorna `{ "error": "mensagem" }` e status HTTP adequado.
- Os campos obrigatórios estão destacados nos exemplos de body.

---

Dúvidas ou sugestões? Consulte o README ou abra uma issue.
