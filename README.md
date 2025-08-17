# 📚 Projeto Tech Challenge – Atividade 2 (FIAP Pós-Tech Full Stack Dev)

**Autor:** Marcelo A. de Góes  
**Data:** Ago/2025  

---

## 📌 Problema de Negócio
Na fase 1, foi criada uma plataforma de blog educacional utilizando **OutSystems**.  
Devido ao sucesso da plataforma, surgiu a necessidade de **refatorar o back-end** para suportar uma nova escala.  

Este repositório contém a fase 2, onde a aplicação foi migrada para uma arquitetura baseada em **Node.js + Express + MongoDB**.

---

## 🛠️ Tecnologias Utilizadas

- **Node.js** – runtime do back-end  
- **Express** – framework de roteamento e middleware  
- **MongoDB Atlas** – banco de dados NoSQL (MongoDB em cloud)  
- **Mongoose** – ODM para interação com MongoDB  
- **Jest + Supertest** – testes unitários e de integração  
- **Docker** – conteinerização  
- **Swagger** – documentação dos serviços  
- **GitHub Actions** – CI/CD automatizado  
- **Postman** – testes de desenvolvimento dos endpoints  
- **JetBrains WebStorm** – IDE de desenvolvimento  

Ferramentas auxiliares:  
- **Microsoft Word** para documentação textual  
- **OBS Studio** para gravação/apresentação final  

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

- **blog-mongodb** → instância MongoDB (imagem oficial `mongo:6.0`)  
- **blog-backend-posts** → serviço com rotas de `posts`  

---

## 🗄️ Modelo de Dados

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
