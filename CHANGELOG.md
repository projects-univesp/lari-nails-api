# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.1.0] - 2026-09-22

### Release Inicial

Primeira versão funcional da **Lari Nails API**, implementada com NestJS 11, TypeScript, Prisma ORM e PostgreSQL, seguindo os princípios de **Arquitetura Hexagonal (Ports & Adapters)** e **Domain-Driven Design (DDD)**.

### Adicionado

#### 🏗️ Arquitetura e Estrutura do Projeto
- Estrutura desacoplada em 4 camadas bem delimitadas:
  - **Domain**: Entidades ricas com validações de invariantes de negócio e interfaces de portas de saída (repositórios e serviços de criptografia).
  - **Application**: Casos de uso orquestrando a lógica de negócio de forma isolada do framework.
  - **Presentation**: Controladores REST, DTOs tipados com validação automática (`class-validator`), formatação de respostas HATEOAS (`Presenters`) e filtros de exceção de domínio.
  - **Infra**: Adaptadores secundários para persistência (Prisma ORM), hashing de senhas (Bcrypt) e serviços externos.

#### 👥 Módulo de Clientes (`/clients`)
- Entidade rica `Client` com validações de nome, telefone e contadores de faltas.
- Suporte a soft delete (campo `deletedAt`) e restauração.
- Casos de uso:
  - `CreateClientUseCase`: Cadastro com validações e formatação de dados.
  - `FindAllClientUseCase`: Listagem de clientes ativos com links HATEOAS.
  - `FindClientUseCase`: Busca por identificador único (UUID v4).
  - `UpdateClientUseCase`: Atualização parcial de dados cadastrais.
  - `DeleteClientUseCase`: Exclusão lógica (soft delete).
  - `RestoreClientUseCase`: Restauração de clientes desativados.
- Filtro de exceção `DomainExceptionFilter` mapeando erros de domínio para status HTTP correspondentes.

#### 🔐 Módulo de Autenticação e Usuários (`/auth` e `/users`)
- Entidade rica `User` com controle de papéis (`admin` e `user`) e hash de senha.
- Sistema de First-Run Setup:
  - `GET /auth/setup-status`: Verifica se a aplicação já possui usuários cadastrados.
  - `POST /auth/setup`: Permite criar o primeiro usuário administrador inicial com emissão imediata de token.
- Autenticação e Gestão de Sessão:
  - `POST /auth/login`: Autenticação por e-mail e senha, com emissão de JWT gravado em cookie HTTP-Only seguro.
  - `POST /auth/logout`: Revogação/limpeza do cookie de sessão.
  - `GET /auth/me`: Retorna os dados do usuário autenticado no contexto da requisição.
- CRUD Completo de Usuários (`/users`):
  - Casos de uso para criação, listagem, busca por ID, edição, soft delete e restauração.
  - Proteção de rotas administrativas via RBAC (`@Roles('admin')`).
  - Sanitização de campos sensíveis (senhas nunca são expostas na resposta).

#### 🛡️ Segurança e Infraestrutura HTTP
- **Autenticação JWT Global (`AuthGuard`)**: Protege todos os endpoints por padrão, com suporte a extração via cookie seguro (`access_token`) ou header `Authorization: Bearer <token>`.
- **Bypass Público (`@Public()`)**: Decorator para liberar rotas abertas (como `/health`, `/auth/login` e `/auth/setup`).
- **Controle de Acesso Baseado em Perfis (`RolesGuard` & `@Roles`)**: Restringe rotas sensíveis a usuários administradores.
- **Rate Limiting Global (`ThrottlerGuard`)**: Proteção contra ataques de força bruta e sobrecarga na API.
- **Rastreabilidade com Correlation ID (`CorrelationIdMiddleware`)**: Gera ou propaga o header `X-Correlation-Id` em cada requisição.
- **Logging Estruturado (`RequestLoggerMiddleware`)**: Log padronizado de requisições HTTP exibindo método, rota, status code, tempo de execução e correlation ID.

#### 🗄️ Banco de Dados e Persistência
- Modelagem no Prisma ORM com PostgreSQL (`ClientModel` e `UserModel`).
- Suporte a soft delete em nível de repositório e schema.
- Migrações automáticas estruturadas no diretório `prisma/migrations`.
- Script de seed para inserção de dados iniciais (`npm run seed`).

#### 🧪 Testes e Qualidade de Código
- Suíte completa de 25 arquivos de testes unitários cobrindo 100% dos casos de uso, entidades e guards (75 testes com Jest).
- Configuração de testes End-to-End (E2E) com Supertest.
- Padronização de código com ESLint v9 (flat config) e Prettier.

#### 🐳 DevOps e Contêineres
- Multi-stage `Dockerfile` com imagem base Chainguard Node para build e imagem final minimalista Google Distroless (`gcr.io/distroless/nodejs24-debian13`).
- `docker-compose.yml` orquestrando PostgreSQL 16 Alpine e o serviço da API.
- Arquivo `requests.http` configurado para testes rápidos de endpoints via VS Code REST Client.
