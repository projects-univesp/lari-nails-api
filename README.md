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

### 5. Catálogo de Serviços (`/services`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/services` | Admin | Cadastra serviço com `name`, `category`, `priceCents`, `durationMinutes`, `description?` e `active?` |
| `GET` | `/services?active=true` | Autenticado | Lista serviços; filtro `active=true` ou `false` é opcional |
| `GET` | `/services/:id` | Autenticado | Consulta serviço por UUID |
| `PATCH` | `/services/:id` | Admin | Atualiza campos do serviço; `active=false` retira o serviço do catálogo disponível |

O preço é armazenado em centavos inteiros e a duração em minutos inteiros (de 1 a 1440). A rota de listagem sem filtro retorna serviços ativos e inativos para permitir sua administração. Aplique a migração antes de usar o catálogo: `npm run prisma:migrate:deploy`.

### 6. Expediente, bloqueios e disponibilidade
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/business-hours` | Autenticado | Retorna os sete dias do expediente semanal |
| `PUT` | `/business-hours` | Admin | Substitui os sete dias em uma transação |
| `GET` | `/agenda-blocks?from=YYYY-MM-DD&to=YYYY-MM-DD` | Autenticado | Lista bloqueios no intervalo inclusivo |
| `POST` | `/agenda-blocks` | Admin | Cria bloqueio com `reason`, `date`, `startTime` e `endTime` |
| `PATCH` | `/agenda-blocks/:id` | Admin | Atualiza o bloqueio |
| `DELETE` | `/agenda-blocks/:id` | Admin | Exclui o bloqueio |
| `GET` | `/availability?serviceId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD` | Autenticado | Lista vagas para serviço ativo em até 31 dias |

Em `business-hours`, cada dia tem `dayOfWeek` (0 = domingo a 6 = sábado), `isOpen`, `openTime`, `closeTime`, `lunchStart` e `lunchEnd`. Horários usam `HH:mm` no fuso `America/Sao_Paulo`; campos de horário podem ser `null` nos dias fechados. A disponibilidade devolve `{ date, startTime, endTime }` para cada vaga futura em passos de 30 minutos, considerando duração do serviço, expediente, almoço, bloqueios e agendamentos ativos. Nenhuma vaga é oferecida antes que o expediente seja salvo.

### 7. Agendamentos e aprovação (`/appointments`)
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/appointments` | Autenticado | Cria pedido `AGUARDANDO` com `clientId`, `serviceId`, `requestedDate`, `requestedTime` e `source` (`MANUAL` ou `WHATSAPP_BOT`) |
| `GET` | `/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&status=AGUARDANDO` | Autenticado | Lista pedidos em até 31 dias; `status` é opcional |
| `GET` | `/appointments/pending` | Autenticado | Lista até 100 pedidos aguardando aprovação, em ordem de data e horário |
| `GET` | `/appointments/:id` | Autenticado | Consulta um pedido |
| `GET` | `/appointments/:id/history` | Autenticado | Consulta o histórico de criação e decisão |
| `POST` | `/appointments/:id/status` | Admin | Decide pedido com `status` (`CONFIRMADO`, `CANCELADO` ou `REAGENDAMENTO_SUGERIDO`), `reason?`, `proposedDate?` e `proposedTime?` |

`CANCELADO` exige `reason`; `REAGENDAMENTO_SUGERIDO` exige data e horário novos. A API grava o ator autenticado e o evento de histórico na mesma transação da decisão. `AGUARDANDO` e `CONFIRMADO` ocupam o intervalo no banco; pedidos pendentes permanecem ocupando até a decisão, sem expiração automática nesta etapa. A restrição de exclusão do PostgreSQL impede reservas sobrepostas mesmo sob requisições simultâneas. Uma sugestão libera o intervalo original e **não reserva** o horário proposto: ele será conferido novamente antes de uma futura aceitação pela cliente. As respostas usam datas locais `YYYY-MM-DD` e horários `HH:mm` de São Paulo.

### 8. Integração de automações (`/automation`)

As rotas abaixo exigem `X-Automation-Key` com a chave definida em `AUTOMATION_API_KEY` (mínimo de 32 caracteres). Elas não aceitam o cookie ou token de uma sessão humana.

As rotas de automação são destinadas a integrações externas autenticadas por `X-Automation-Key`; o backend não depende de um provedor de mensagens específico.

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/automation/services` | Serviços ativos para o bot |
| `GET` | `/automation/business-hours` | Expediente semanal |
| `GET` | `/automation/availability?serviceId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD` | Vagas reais |
| `POST` | `/automation/clients/resolve` | Encontra ou cria cliente por telefone brasileiro, aceitando JID `@s.whatsapp.net` |
| `GET` | `/automation/clients/:id` | Dados do cliente para a mensagem |
| `POST` | `/automation/appointments` | Cria pedido com origem fixa `WHATSAPP_BOT` |
| `GET` | `/automation/appointments/:id` | Consulta pedido |
| `POST` | `/automation/events/verify` | Verifica assinatura e prazo de evento externo recebido pela integração |

`clients/resolve` recebe `{ "nome": "...", "telefone": "..." }` e retorna `{ client, created }`. Telefones locais, internacionais e JIDs equivalentes recebem a mesma chave. A migração preserva cadastros legados duplicados sem uni-los; uma tentativa de resolver um desses telefones retorna conflito para revisão manual.

Cada decisão de agendamento grava `appointment.status_changed` na tabela `eventos_automacao` na mesma transação. Quando `AUTOMATION_EVENT_WEBHOOK_URL` e `AUTOMATION_EVENT_WEBHOOK_SECRET` (mínimo de 32 caracteres) estão definidos, a API entrega o evento por HTTP com retentativas e o mesmo ID. O corpo inclui `id`, `type`, `aggregateId`, `payload` e `createdAt`. `X-Lari-Signature` contém HMAC-SHA256 de `X-Lari-Timestamp + "." + corpo JSON`; `X-Lari-Webhook-Key` autentica o receptor configurado. A entrega é pelo menos uma vez: o receptor deve tratar repetições pelo ID do evento. Configure a URL receptora em HTTPS.

---

## ⚙️ Executando o Projeto

### Pré-requisitos
- Node.js 24.x
- npm
- Docker e Docker Compose

### Executar a versão de desenvolvimento com o frontend

Clone a branch `dev` dos dois repositórios em pastas lado a lado:

```bash
git clone --branch dev https://github.com/projects-univesp/lari-nails-api.git
git clone --branch dev https://github.com/projects-univesp/Lari-Nails.git
```

No backend, instale as dependências e configure o ambiente:

```bash
cd lari-nails-api
npm install
cp .env.example .env
```

No `.env`, defina um `JWT_SECRET` aleatório com pelo menos 32 caracteres e configure `CORS_ORIGIN=http://localhost:5173` para o frontend local. O `DATABASE_URL` de exemplo usa o PostgreSQL local na porta `5432`.

Suba o banco, gere o cliente Prisma, aplique as migrações e inicie a API:

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:dev
npm run start:dev
```

Em outro terminal, inicie o frontend conforme o README do repositório `Lari-Nails`. No primeiro acesso, a interface apresenta o formulário para criar o usuário administrador. A API ficará disponível em `http://localhost:3000`.

O Compose deste repositório sobe a API e o PostgreSQL. As migrações precisam ser aplicadas antes de usar as rotas de negócio.

### 1. Subir o Banco de Dados com Docker
```bash
docker compose up -d postgres
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Edite o arquivo `.env` para ajustar senhas e a chave `JWT_SECRET`. Para desenvolvimento local com o frontend Vite, use `CORS_ORIGIN=http://localhost:5173`. Em outros ambientes, informe a origem publicada da interface; para várias origens, separe-as por vírgula. A sessão usa cookie HTTP-only.

### 3. Rodar as Migrações do Banco
```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

No primeiro acesso, crie o administrador pelo formulário inicial do frontend. Ele usa os endpoints públicos `/auth/setup-status` e `/auth/setup`.

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

Ou subir a API e o PostgreSQL via Compose (depois de aplicar as migrações):
```bash
docker compose up -d --build
```

---

## 📄 Histórico de Versões

Consulte o arquivo [CHANGELOG.md](./CHANGELOG.md) para detalhes completos sobre as versões, mudanças e notas de release.
