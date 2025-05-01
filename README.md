# myshop-backend-nestjs

A backend API for the **MyShop** eCommerce platform, built with [NestJS](https://nestjs.com) and [Prisma](https://www.prisma.io).  
It supports both **member-facing features** (e.g. product browsing, orders) and **admin features** (e.g. product/category/slide management).

---

## 🚀 Features

- ✅ **Authentication**

  - JWT + HttpOnly Cookie
  - Role-based access (Prisma enum: `MEMBER`, `ADMIN`, `SUPERVISOR`)

- 🛒 **Member APIs**

  - Browse products & categories
  - Add to cart, checkout
  - Manage address & payment methods
  - View order history

- 🧑‍💼 **Admin APIs**

  - Manage products, categories, slides
  - Manage orders & users (admin/member)

- 🗃️ **Prisma Models**
  - Users, Products, Orders, Cart
  - Addresses, Payments, Categories, Slides

---

## 🧱 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (via Docker)
- **Validation**: `class-validator`, `class-transformer`
- **File Upload**: `Multer` (for product & slide images)

---

## 🛠️ Getting Started

### 🔧 Install dependencies

```bash
npm install
```

### ⚙️ Configure environment variables

Create a `.env` file based on `.env.example`

```bash
cp .env.example .env
```

Then edit DB credentials, JWT secret, etc.

### 🧪 Run in development mode

```bash
npm run start:dev
```

---

## 🧪 Run Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

---

## 📂 Project Structure (src/)

```
src/
├── auth/
├── users/
├── products/
├── categories/
├── orders/
├── cart/
├── addresses/
├── payments/
├── slides/
└── common/
```
