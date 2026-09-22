# Lari Nails API

API desenvolvida em **NestJS** utilizando os conceitos de **Arquitetura Hexagonal (Ports and Adapters)** e **Domain-Driven Design (DDD)**.

O projeto organiza as funcionalidades de negócio em módulos independentes desacoplados de bibliotecas externas e banco de dados, utilizando o **Prisma ORM** com **PostgreSQL** na camada de infraestrutura, autenticação com **JWT** via cookies HTTP-only e controle de acesso baseado em papéis (**RBAC**).

---

## 🏛️ Arquitetura

O projeto divide cada módulo em quatro camadas bem delimitadas:

- **domain**: Contém as entidades de negócio ricas (`Client`, `User`), regras invariantes de validação e as portas de saída (`IClientRepository`, `IUserRepository`, `IPasswordHasher`). Não possui dependências do framework ou de banco de dados.
- **application**: Contém os casos de uso (`CreateClientUseCase`, `LoginUseCase`, etc.). Orquestra a execução das regras de negócio usando exclusivamente as portas do domínio.
- **presentation**: Camada de entrada HTTP contendo Controllers, DTOs tipados com validação (`class-validator`), Presenters (com links HATEOAS e sanitização de dados) e Filters de exceção de domínio.
- **infra**: Camada de adaptadores secundários contendo implementações de repositórios com Prisma (`PrismaClientRepository`, `PrismaUserRepository`), hash de senhas (`BcryptHasher`), guards de segurança e middlewares HTTP.

A infraestrutura compartilhada inclui:
- `src/infra/database`: Conexão, serviço do Prisma e migrations.
- `src/infra/security`: Guards globais (`AuthGuard`, `RolesGuard`, `ThrottlerGuard`) e decorators (`@Public`, `@Roles`).
- `src/infra/http`: Middlewares globais (`CorrelationIdMiddleware`, `RequestLoggerMiddleware`).

---

## 🚀 Endpoints da API

### 1. Health Check
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/health` | Público | Verifica a saúde da API, uptime e timestamp atual |

### 2. Autenticação & Setup (`/auth`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/auth/setup-status` | Público | Informa se o setup inicial já foi realizado |
| `POST` | `/auth/setup` | Público | Cria o primeiro usuário administrador inicial |
| `POST` | `/auth/login` | Público | Realiza autenticação e define o cookie HTTP-only `access_token` |
| `POST` | `/auth/logout` | Autenticado | Encerra a sessão removendo o cookie de autenticação |
| `GET` | `/auth/me` | Autenticado | Retorna os dados do usuário autenticado atual |

### 3. Gestão de Usuários (`/users`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/users` | Admin | Cadastra um novo usuário no sistema |
| `GET` | `/users` | Admin | Lista todos os usuários ativos |
| `GET` | `/users/:id` | Autenticado | Obtém detalhes de um usuário por ID (UUID v4) |
| `PATCH` | `/users/:id` | Autenticado | Atualiza nome ou e-mail de um usuário |
| `PATCH` | `/users/:id/restore` | Admin | Restaura um usuário previamente desativado |
| `DELETE` | `/users/:id` | Admin | Realiza exclusão lógica (soft delete) do usuário |

### 4. Gestão de Clientes (`/clients`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/clients` | Autenticado | Cadastra um novo cliente |
| `GET` | `/clients` | Autenticado | Lista todos os clientes ativos com links HATEOAS |
| `GET` | `/clients/:id` | Autenticado | Busca um cliente específico por ID (UUID v4) |
| `PATCH` | `/clients/:id` | Autenticado | Atualiza dados cadastrais de um cliente |
| `PATCH` | `/clients/:id/restore` | Autenticado | Restaura um cliente desativado |
| `DELETE` | `/clients/:id` | Autenticado | Realiza exclusão lógica (soft delete) do cliente |

---

## ⚙️ Executando o Projeto

### Pré-requisitos
- Node.js 24.x
- Docker e Docker Compose

### 1. Subir o Banco de Dados com Docker
```bash
docker compose up -d postgres
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Edite o arquivo `.env` para ajustar senhas e a chave `JWT_SECRET`.

### 3. Rodar as Migrações do Banco
```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

*(Opcional)* Popular banco com dados iniciais:
```bash
npm run seed
```

### 4. Iniciar a Aplicação
```bash
# Modo de desenvolvimento com hot-reload
npm run start:dev

# Modo de produção
npm run build
npm run start:prod
```

---

## 🧪 Testes e Qualidade

```bash
# Executar todos os testes unitários
npm test

# Executar testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:cov

# Testes de ponta a ponta (E2E)
npm run test:e2e

# Linter e formatação de código
npm run lint
npm run format
```

---

## 🐳 Deploy com Contêiner Distroless

O projeto possui um `Dockerfile` multi-stage:
1. Etapa de compilação em imagem Chainguard Node.
2. Imagem final enxuta em Google Distroless (`gcr.io/distroless/nodejs24-debian13`), otimizada para segurança máxima e sem shell no contêiner final.

Para construir a imagem Docker:
```bash
docker build -t lari-nails-api .
```

Ou subir o ecossistema completo via Compose:
```bash
docker compose up -d --build
```

---

## 📄 Histórico de Versões

Consulte o arquivo [CHANGELOG.md](./CHANGELOG.md) para detalhes completos sobre as versões, mudanças e notas de release.
