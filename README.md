# � Savit - Salve suas ideias

Uma aplicação mobile-first inspirada no WhatsApp para salvar suas ideias, tarefas e pensamentos organizados por categorias.

## ✨ Funcionalidades

- 📝 **Mensagens/Ideias** - Salve suas ideias como mensagens em um chat
- 🏷️ **Categorias/Temas** - Organize suas ideias com cores personalizadas
- ✅ **Tarefas** - Transforme ideias em tarefas com data e hora
- 🔍 **Busca Avançada** - Pesquise por texto, data ou categoria
- 📊 **Dashboard** - Visualize métricas e estatísticas
- 👤 **Perfil** - Gerencie sua conta e preferências
- 🔐 **Autenticação** - Login seguro com JWT
- 📱 **PWA** - Instale como app no celular

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/savit.git
cd savit
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/savit"
JWT_SECRET="seu-jwt-secret-super-seguro"
PORT=3000
NODE_ENV=development
```

### 4. Crie o banco de dados

```bash
# Crie o banco PostgreSQL (se ainda não existir)
createdb savit

# Execute as migrations do Prisma
npx prisma db push
```

### 5. Inicie o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

### 6. Acesse a aplicação

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## �️ Deploy no Railway

### 1. Crie uma conta no Railway

Acesse [railway.app](https://railway.app) e faça login com GitHub.

### 2. Crie um novo projeto

1. Clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Conecte seu repositório

### 3. Adicione PostgreSQL

1. No projeto, clique em "New"
2. Selecione "Database" → "PostgreSQL"
3. Copie a `DATABASE_URL` gerada

### 4. Configure as variáveis

No painel do Railway, adicione:

- `DATABASE_URL` - URL do PostgreSQL do Railway
- `JWT_SECRET` - Sua chave secreta JWT
- `NODE_ENV` - `production`

### 5. Deploy automático

O Railway fará deploy automaticamente quando você fizer push no GitHub.

## 📁 Estrutura do Projeto

```
savit/
├── prisma/
│   └── schema.prisma      # Schema do banco de dados
├── public/
│   ├── css/
│   │   └── styles.css     # Estilos da aplicação
│   ├── js/
│   │   ├── api.js         # Cliente API
│   │   └── app.js         # Lógica principal
│   ├── index.html         # Página principal
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service Worker
├── server/
│   ├── middleware/
│   │   └── auth.js        # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.js        # Rotas de autenticação
│   │   ├── categories.js  # CRUD de categorias
│   │   ├── messages.js    # CRUD de mensagens
│   │   └── stats.js       # Dashboard stats
│   └── index.js           # Servidor Express
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências
└── README.md              # Este arquivo
```

## 🔧 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Perfil do usuário |
| PUT | `/api/auth/profile` | Atualizar perfil |
| PUT | `/api/auth/password` | Alterar senha |

### Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/messages` | Listar mensagens |
| POST | `/api/messages` | Criar mensagem |
| PUT | `/api/messages/:id` | Atualizar mensagem |
| DELETE | `/api/messages/:id` | Deletar mensagem |
| PATCH | `/api/messages/:id/toggle` | Toggle tarefa |

### Categorias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/categories` | Listar categorias |
| POST | `/api/categories` | Criar categoria |
| PUT | `/api/categories/:id` | Atualizar categoria |
| DELETE | `/api/categories/:id` | Deletar categoria |

### Dashboard

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/stats` | Estatísticas do dashboard |

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Deploy**: Railway

## 📝 Licença

MIT © 2024 Savit

---

Feito com 💚 para organizar suas ideias
