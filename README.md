# Movie Set

Plataforma web de eventos e ingressos desenvolvida como solução para o **Desafio Elite Dev 2026**.

O sistema permite que organizadores criem eventos a partir de filmes obtidos por uma API externa, enquanto clientes podem visualizar eventos publicados, selecionar assentos, realizar um pagamento simulado e receber ingressos digitais com QR Code.

Na entrada do evento, um usuário de portaria pode validar o ingresso utilizando a câmera do dispositivo ou digitando manualmente o código.

---

## Aplicação publicada

A aplicação está disponível em:

**Produção:**  
https://movie-set-nzh938hsd-gui-fga.vercel.app/

> O deploy foi realizado utilizando Vercel e banco PostgreSQL hospedado no Neon.

---

# Funcionalidades

## Autenticação

A aplicação possui autenticação baseada em JWT e três perfis distintos:

### ORGANIZER

O organizador pode:

- acessar o catálogo de filmes;
- criar eventos;
- definir data e horário;
- definir local;
- definir sala;
- definir capacidade;
- definir preço do ingresso;
- visualizar seus próprios eventos;
- acompanhar quantidade de assentos vendidos;
- acompanhar receita;
- acompanhar percentual de ocupação;
- cancelar eventos.

---

### CUSTOMER

O cliente pode:

- visualizar eventos publicados;
- consultar informações do evento;
- visualizar mapa de assentos;
- selecionar assentos disponíveis;
- realizar uma reserva;
- realizar pagamento simulado;
- receber um ingresso para cada assento;
- visualizar seus ingressos;
- visualizar QR Code do ingresso;
- acessar o ingresso por um link compartilhável.

---

### GATE

O usuário da portaria pode:

- selecionar um evento;
- validar ingressos;
- utilizar a câmera para leitura do QR Code;
- utilizar código manual como alternativa;
- identificar ingresso válido;
- identificar ingresso inválido;
- identificar ingresso já utilizado;
- identificar ingresso pertencente a outro evento.

---

# Catálogo externo

Os filmes utilizados na criação dos eventos são obtidos através da:

**The Movie Database API (TMDb)**

A integração é feita exclusivamente pelo Back-End da aplicação.

A chave da API não é exposta ao navegador.

Os dados utilizados incluem:

- título;
- descrição;
- imagem do pôster;
- identificador do filme no TMDb.

---

# Fluxo principal

O fluxo principal da aplicação é:

```text
TMDb
  ↓
Organizador escolhe filme
  ↓
Criação do evento
  ↓
Geração dos assentos
  ↓
Evento publicado
  ↓
Cliente seleciona assento
  ↓
Reserva temporária
  ↓
Pagamento simulado
  ↓
Ingresso gerado
  ↓
QR Code
  ↓
Validação na portaria
  ↓
Ingresso marcado como utilizado
```

---

# 💺 Reserva de assentos

Cada evento possui um mapa de assentos.

Os assentos são gerados automaticamente no momento da criação do evento.

Exemplo:

```text
A1 A2 A3 A4 A5 A6 A7 A8 A9 A10
B1 B2 B3 B4 B5 B6 B7 B8 B9 B10
C1 C2 C3 C4 C5 C6 C7 C8 C9 C10
```

A aplicação impede que o mesmo assento seja reservado simultaneamente por clientes diferentes.

Isso é garantido também no banco de dados através de uma restrição de unicidade sobre o assento associado à reserva.

Dessa forma, a proteção contra venda duplicada não depende apenas da interface.

---

#  Expiração das reservas

Reservas pendentes possuem tempo limitado.

Atualmente uma reserva possui duração de:

```text
5 minutos
```

Ao criar uma reserva:

```text
PENDING
↓
5 minutos
↓
pagamento não realizado
↓
CANCELLED
↓
assentos liberados novamente
```

Isso evita que um cliente abandone o processo de pagamento e mantenha os assentos bloqueados indefinidamente.

---

# Pagamento

O pagamento é completamente simulado.

Não existe qualquer transação financeira real.

O fluxo contempla dois resultados:

```text
APPROVED
```

ou

```text
DECLINED
```

### Pagamento aprovado

Quando aprovado:

```text
Reserva
PENDING
↓
CONFIRMED
↓
Tickets criados
↓
QR Codes disponibilizados
```

### Pagamento recusado

Quando recusado:

```text
Reserva
PENDING
↓
CANCELLED
↓
Assentos liberados
```

Após uma recusa, o cliente pode retornar ao evento e selecionar novamente os assentos disponíveis.

---

# Ingressos

Um ingresso é criado para cada assento adquirido.

Cada ingresso possui:

- identificador;
- reserva;
- assento;
- código manual;
- token de QR Code;
- status;
- data de utilização.

Os principais estados são:

```text
ACTIVE
USED
CANCELLED
```

---

# Segurança do QR Code

O conteúdo do QR Code não utiliza apenas o ID numérico do ingresso.

Durante a criação de cada ingresso é gerado um token aleatório utilizando geração criptograficamente segura no servidor.

Exemplo conceitual:

```ts
crypto.randomBytes(32).toString("hex");
```

O QR Code contém esse identificador aleatório.

A validação real sempre ocorre no servidor.

Isso significa que alterar visualmente ou fabricar um QR Code sem possuir um token válido não gera um ingresso válido.

---

# Compartilhamento de ingresso

Cada ingresso possui um endereço público baseado em seu token.

Exemplo:

```text
/ingresso/:token
```

Esse endereço pode ser compartilhado pelo cliente.

O link permite visualizar o ingresso e seu QR Code sem expor diretamente o ID sequencial do registro.

---

# Validação na portaria

A portaria pode validar o ingresso de duas formas:

### QR Code

A câmera do dispositivo realiza a leitura diretamente pela aplicação.

### Código manual

Caso a câmera não esteja disponível, o código do ingresso pode ser digitado manualmente.

A API de validação pode retornar:

```text
VALID
INVALID
ALREADY_USED
WRONG_EVENT
```

---

## Proteção contra dupla utilização

A validação do ingresso acontece no Back-End.

Após uma validação bem-sucedida:

```text
ACTIVE
↓
VALID
↓
USED
```

Uma nova tentativa de utilizar o mesmo ingresso retorna:

```text
ALREADY_USED
```

A validação utiliza transação no banco para evitar que duas requisições simultâneas validem o mesmo ingresso.

---

# Cancelamento de eventos

O organizador pode cancelar seus próprios eventos.

Ao cancelar um evento:

- o evento recebe status `CANCELLED`;
- reservas relacionadas são canceladas;
- ingressos ativos são cancelados;
- assentos deixam de permanecer vinculados às reservas.

Eventos cancelados deixam de aparecer como disponíveis para compra.

---

# Painel do organizador

Ao acessar um evento próprio, o organizador recebe informações adicionais.

São apresentadas métricas como:

- assentos vendidos;
- receita;
- ocupação do evento.

Exemplo:

```text
Assentos vendidos: 20

Receita:
R$ 600,00

Ocupação:
40%
```

Clientes não recebem essas informações através da mesma interface.

---

# Tecnologias utilizadas

## Front-End

- React
- Next.js
- TypeScript
- CSS
- React QR Code
- html5-qrcode

## Back-End

- Node.js
- Next.js Route Handlers
- Sequelize
- JWT
- bcryptjs

## Banco de dados

- PostgreSQL
- Neon

## Serviços externos

- TMDb API

## Infraestrutura

- Vercel
- Docker

## Desenvolvimento

- Git
- GitHub
- npm
- tsx

---

# Banco de dados

O projeto utiliza **PostgreSQL** através do Sequelize.

Durante o desenvolvimento foi utilizado o **Neon PostgreSQL**, porém qualquer banco PostgreSQL compatível pode ser utilizado.

A conexão é definida através da variável:

```env
DATABASE_URL=
```

Exemplo:

```env
DATABASE_URL=postgresql://usuario:senha@host/database?sslmode=require
```



---

# Principais entidades

A aplicação possui, entre outras, as seguintes entidades:

```text
User
Event
Seat
Reservation
ReservationSeat
Payment
Ticket
TicketValidation
```

Relacionamento simplificado:

```text
User
 ├── organiza → Event
 ├── realiza → Reservation
 └── valida → TicketValidation

Event
 ├── possui → Seat
 └── possui → Reservation

Reservation
 ├── possui → ReservationSeat
 ├── possui → Payment
 └── gera → Ticket

Ticket
 ├── pertence → Reservation
 ├── pertence → Seat
 └── possui → TicketValidation
```

---

# Variáveis de ambiente

Crie um arquivo:

```text
.env.local
```

na raiz do projeto.

Adicione:

```env
DATABASE_URL=
TMDB_API_KEY=
JWT_SECRET=
```

### DATABASE_URL

URL de conexão com PostgreSQL.

### TMDB_API_KEY

API Key v3 obtida no TMDb.

### JWT_SECRET

Chave utilizada para assinatura dos tokens JWT.

Exemplo para desenvolvimento:

```env
JWT_SECRET=minha-chave-de-desenvolvimento
```
---

# Executando localmente

## Pré-requisitos

É necessário possuir:

```text
- Node.js
- npm
- acesso a um banco PostgreSQL

```
O projeto utiliza PostgreSQL hospedado no Neon. Não é necessário instalar PostgreSQL localmente caso seja utilizada uma instância em nuvem.

## 1. Clone o repositório

```bash
git clone https://github.com/guiFGA/movie-set-web.git
```

Entre na pasta:

```bash
cd movie-set-web
```

---

## 2. Instale as dependências

```bash
npm install
```

ou:

```bash
npm ci
```

---

## 3. Configure as variáveis

Crie:

```text
.env.local
```

com:

```env
DATABASE_URL=SUA_URL_POSTGRES
TMDB_API_KEY=SUA_API_KEY_TMDB
JWT_SECRET=SUA_CHAVE_JWT
```

---

## 4. Sincronize o banco

Para simplificar a configuração dentro do escopo do desafio, foi utilizado `sequelize.sync({ alter: true })` em vez de migrations versionadas.

Em um ambiente de produção com evolução contínua do schema, o recomendado seria utilizar migrations para ter maior controle sobre alterações no banco de dados.

Ao iniciar a aplicação, o Sequelize sincroniza os models com o PostgreSQL através de:

```ts
sequelize.sync({ alter: true })
```

Na primeira execução, as tabelas necessárias serão criadas automaticamente. Em execuções posteriores, o Sequelize compara os models com a estrutura existente e realiza os ajustes necessários.

---

## 5. Execute as seeds

```bash
npm run seed
```

A seed cria automaticamente:

- 1 organizador;
- 2 clientes;
- 1 usuário de portaria;
- 1 evento publicado;
- assentos disponíveis para o evento.

O evento semeado utiliza informações obtidas através da API do TMDb.

---

## 6. Inicie a aplicação

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

---

# Usuários para teste

Todos os usuários abaixo são criados automaticamente pelo comando:

```bash
npm run seed
```

## Organizador

```text
E-mail: organizer@movieset.com
Senha: 12345678
```

## Cliente 1

```text
E-mail: cliente1@movieset.com
Senha: 12345678
```

## Cliente 2

```text
E-mail: cliente2@movieset.com
Senha: 12345678
```

## Portaria

```text
E-mail: portaria@movieset.com
Senha: 12345678
```
---

# Roteiro sugerido 

Para testar o fluxo completo:

### 1. Cliente

Faça login com:

```text
cliente1@movieset.com
```

Selecione o evento semeado.

Escolha um assento disponível.

Realize a reserva.

Simule um pagamento aprovado.

Abra **Meus ingressos**.

Visualize o QR Code.

---

### 2. Portaria

Em outro dispositivo ou navegador, entre com:

```text
portaria@movieset.com
```

Abra a área da portaria.

Selecione o evento correspondente.

Leia o QR Code pela câmera.

O sistema deverá retornar:

```text
Ingresso válido
```

Tente validar novamente.

O sistema deverá retornar:

```text
Ingresso já utilizado
```

---

### 3. Pagamento recusado

Utilize outro cliente:

```text
cliente2@movieset.com
```

Realize uma reserva.

Escolha a opção de pagamento recusado.

A reserva será cancelada e os assentos voltarão a ficar disponíveis.

---

### 4. Organizador

Entre com:

```text
organizer@movieset.com
```

Acesse **Meus eventos**.

Será possível:

- visualizar eventos;
- criar eventos;
- consultar métricas;
- cancelar eventos.

---

# Docker

O projeto também possui um `Dockerfile`.

Para gerar a imagem:

```bash
docker build -t movie-set-web .
```

Execute utilizando as variáveis presentes no `.env.local`:

```bash
docker run --name movie-set-web -p 3000:3000 \ --env-file .env.local movie-set-web
```

Acesse:

```text
http://localhost:3000
```

Para remover o container:

```bash
docker rm -f movie-set-web
```

O build Docker utiliza a saída `standalone` do Next.js exclusivamente dentro do container.

A configuração é separada do deploy da Vercel.

---

# ☁️ Deploy

A aplicação está publicada utilizando:

```text
Vercel
```

O banco de dados utilizado em produção está hospedado no:

```text
Neon PostgreSQL
```

As seguintes variáveis precisam ser configuradas na plataforma de deploy:

```env
DATABASE_URL
TMDB_API_KEY
JWT_SECRET
```

Nenhuma credencial está armazenada diretamente no código-fonte.

---

# Decisões técnicas

## Por que Next.js?

A aplicação possui Front-End e Back-End no mesmo projeto.

O App Router e os Route Handlers permitiram manter uma estrutura única para:

- interface;
- autenticação;
- regras de negócio;
- integração com banco;
- integração com API externa.

Para o tamanho do desafio, separar inicialmente Front-End e Back-End em dois projetos adicionaria complexidade sem maiores beneficios, inclusive para o deploy.

---

## Por que PostgreSQL?

O domínio possui muitos relacionamentos:

```text
evento → assentos
reserva → assentos
reserva → pagamento
reserva → ingressos
ingresso → validações
```

Um banco relacional facilita a utilização de:

- foreign keys;
- transações;
- constraints;
- índices;
- unicidade.

Isso também foi importante para impedir a venda duplicada de assentos.

---

## Por que Sequelize?

O Sequelize fornece integração simples entre TypeScript/Node.js e PostgreSQL, permitindo representar as entidades do domínio através de models.

O banco continua sendo responsável por regras importantes de integridade, em vez de manter toda a proteção apenas na aplicação.

---

## Por que JWT?

A aplicação possui três tipos de usuários e diversas rotas protegidas.

O JWT permite armazenar no token informações mínimas de autenticação, como:

```text
id
role
```

O token é armazenado em cookie `HttpOnly`.

Em produção o cookie também utiliza a flag:

```text
Secure
```

---

## Por que gerar um ingresso por assento?

Uma reserva pode possuir vários assentos.

Gerar um `Ticket` individual permite que cada ingresso:

- tenha seu próprio QR Code;
- tenha seu próprio código manual;
- seja compartilhado individualmente;
- tenha seu próprio estado;
- seja validado independentemente.

---

## Por que a disponibilidade não fica armazenada em Seat?

Não existe um campo simples:

```text
available = true/false
```

como fonte principal da disponibilidade.

A disponibilidade é obtida através das relações entre assentos e reservas.

Isso reduz inconsistências entre:

```text
Seat
Reservation
ReservationSeat
```

---

# Considerações de segurança

Algumas decisões adotadas:

- senhas armazenadas utilizando hash com bcrypt;
- autenticação através de JWT;
- JWT armazenado em cookie HttpOnly;
- cookie Secure em produção;
- chave do TMDB utilizada apenas no servidor;
- validação de permissões por papel;
- validação de propriedade dos eventos;
- QR Code baseado em token aleatório;
- validação do ingresso realizada no Back-End;
- proteção contra utilização dupla do ingresso;
- proteção contra venda duplicada de assentos;
- transações nas operações críticas;
- secrets configurados através de variáveis de ambiente.

---

# 📁 Estrutura simplificada

```text
movie-set-web/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── gate/
|   |   ├── movies/
│   │   ├── organizer/
|   |   ├── payment/
│   │   ├── reservations/
│   │   ├── tickets/
│   │   |── tmdb/
│   │   |── ...
│   │
│   ├── eventos/
│   ├── ingresso/
│   ├── meus-eventos/
│   ├── meus-ingressos/
│   ├── pagamento/
│   ├── portaria/
│   └── ...
│
├── scripts/
│   ├── seed.ts
│   
│
├── Dockerfile
├── .dockerignore
├── next.config.ts
├── package.json
└── README.md
```

---

#  Uso de Inteligência Artificial

Inteligência Artificial foi utilizada durante o desenvolvimento como ferramenta de apoio.

A principal ferramenta utilizada foi:

```text
ChatGPT Plus
```

Ela foi utilizada principalmente para:

- discussão de arquitetura;
- revisão de implementações;
- sugestões de modelagem do banco;
- análise de erros;
- debugging;
- sugestões para autenticação e autorização;
- revisão do fluxo de reservas;
- discussão de concorrência na reserva de assentos;
- implementação e revisão do fluxo de QR Code;
- debugging da configuração do Docker;
- debugging do deploy na Vercel;
- organização da documentação.

A IA não foi utilizada apenas para gerar o projeto inteiro a partir do enunciado.

O desenvolvimento ocorreu de maneira incremental, com implementação, execução, identificação de erros, testes e ajustes ao longo do processo.

Diversos problemas encontrados durante o desenvolvimento exigiram análise do comportamento real da aplicação, entre eles:

- concorrência e bloqueio de assentos;
- reservas abandonadas mantendo assentos ocupados;
- expiração das reservas;
- criação de um ingresso para cada assento;
- invalidação do ingresso após sua utilização;
- leitura consecutiva de QR Codes;
- diferenças entre ambiente local, Docker e Vercel;
- carregamento de variáveis de ambiente;
- conexão PostgreSQL no ambiente serverless;
- configuração específica do Next.js para execução standalone no Docker.

As decisões finais de arquitetura, regras de negócio e comportamento da aplicação foram avaliadas considerando o escopo e os requisitos do desafio.

---

# Limitações conhecidas

O projeto foi desenvolvido dentro do período e do escopo propostos para o desafio.

Atualmente:

- o pagamento é uma simulação;
- não existe envio de ingresso por e-mail;
- não existe recuperação de senha;
- não existe revenda de ingressos;
- não existe emissão de nota fiscal;
- não existe aplicativo mobile nativo;
- o mapa não possui atualização por WebSocket;
- Docker Compose não foi implementado;
- testes automatizados ainda não foram adicionados.

As funcionalidades relacionadas a nota fiscal, revenda, aplicativo nativo, recuperação de senha e envio de ingressos por e-mail estão propositalmente fora do escopo.

---

# Requisitos atendidos

## Front-End

- [x] Navegação por eventos publicados
- [x] Exibição de data, local e preço
- [x] Criação de eventos pelo organizador
- [x] Gerenciamento de eventos pelo organizador
- [x] Seleção de lugar através de mapa de assentos
- [x] Reserva de ingressos
- [x] Pagamento simulado aprovado
- [x] Pagamento simulado recusado
- [x] Área "Meus ingressos"
- [x] QR Code do ingresso
- [x] Tela de portaria
- [x] Resultado de ingresso válido
- [x] Resultado de ingresso inválido
- [x] Resultado de ingresso já utilizado
- [x] Resultado de evento incorreto
- [x] Leitura do QR Code pela câmera
- [x] Digitação manual do código

## Back-End

- [x] Integração com API externa
- [x] TMDb
- [x] Autenticação
- [x] Papel Organizador
- [x] Papel Cliente
- [x] Papel Portaria
- [x] Persistência de eventos
- [x] Persistência de reservas
- [x] Persistência de ingressos
- [x] Proteção contra venda duplicada
- [x] QR Code com token não previsível
- [x] Link compartilhável de ingresso
- [x] Proteção contra validação dupla
- [x] Pagamento sem transação financeira real

## Dados de avaliação

- [x] 1 organizador semeado
- [x] 2 clientes semeados
- [x] 1 usuário de portaria semeado
- [x] Evento publicado
- [x] Assentos disponíveis

## Opcionais implementados

- [x] Painel do organizador
- [x] Cancelamento de evento
- [x] Devolução dos assentos ao estoque
- [x] Aplicação publicada
- [x] Dockerfile

## Opcionais não implementados

- [ ] Atualização de assentos via WebSocket
- [ ] Docker Compose
- [ ] Testes automatizados

---

# Possíveis evoluções

Com mais tempo, algumas melhorias possíveis seriam:

- testes unitários;
- testes de integração;
- testes end-to-end;
- WebSockets para atualização de assentos em tempo real;
- Docker Compose;
- migrations formais do banco;
- rate limiting;
- refresh tokens;
- observabilidade;
- logs estruturados;
- pipeline de CI/CD;
- filas para tarefas assíncronas.

---

# 👨‍💻 Autor

**Guilherme Ribeiro de Azevedo**
