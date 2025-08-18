# 📚 Projeto Tech Challenge – Atividade 2 (FIAP Pós-Tech Full Stack Dev)

**Autor:** Marcelo A. de Góes  
**Data:** Ago/2025

---

## 📌 Problema de Negócio
Na fase 1, foi criada uma plataforma de blog educacional utilizando **OutSystems** (ferramenta no-code).  
Devido ao sucesso da plataforma, surgiu a necessidade de **refatorar o back-end** para suportar **uma nova escala** e possibilitar maior flexibilidade no desenvolvimento.

Esta fase 2 migrará a aplicação para uma arquitetura baseada em **Node.js + Express + MongoDB Atlas**, com suporte a conteinerização e deploy na AWS.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** – runtime do back-end
- **Express** – framework para roteamento e middleware
- **MongoDB Atlas** – banco de dados NoSQL em cloud
- **Mongoose** – ODM para interação com MongoDB
- **Docker** – conteinerização
- **Swagger** – documentação dos serviços REST
- **Jest + Supertest** – testes unitários e de integração
- **GitHub + GitHub Actions** – versionamento e CI/CD
- **Postman** – testes de desenvolvimento dos endpoints
- **JetBrains WebStorm** – IDE de desenvolvimento

Ferramentas auxiliares:
- **Microsoft Word** – documentação textual e explicações técnicas
- **OBS Studio** – gravação e apresentação final da aplicação

Repositório no GitHub: [fiap-fsd-blog-backend](https://github.com/vanquirius/fiap-fsd-blog-backend)

---

## 🏗️ Arquitetura da Solução

A aplicação segue uma arquitetura de serviços **RESTful** com os seguintes endpoints principais:

- `GET /posts` → lista de posts
- `GET /posts/:id` → detalhe de um post
- `POST /posts` → criação de post
- `PUT /posts/:id` → edição de post
- `DELETE /posts/:id` → exclusão de post
- `GET /posts/search` → busca de posts por palavra-chave

### Containers

- **blog-backend-posts** → serviço Node.js com rotas de posts
- **MongoDB Atlas** → banco de dados em cloud (não há container local para produção)

---

## 🗄️ Modelo de Dados

A aplicação utiliza MongoDB, armazenando dados em formato **JSON**.  
Coleção principal: **posts**

Exemplo de documento:

```json
{
  "_id": "64f1b2c9e4a5c8d2a1b23c45",
  "title": "Introdução à Revolução Francesa",
  "content": "A Revolução Francesa foi um marco na história...",
  "author": "Prof. João da Silva",
  "creationDate": "2025-08-16T14:35:22.000Z"
}
