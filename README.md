# HealthLink

A full-stack healthcare management platform built with **Next.js** (frontend) and **NestJS + Prisma** (backend).

---

## Prerequisites

Make sure you have these installed before getting started:

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [PostgreSQL](https://www.postgresql.org/) (running locally or a hosted instance)

---

## Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd HealthLink
```

---

### 2. Backend Setup

```bash
cd backend
```

**Install dependencies**
```bash
npm install
```

**Configure environment variables**
```bash
cp .env.example .env
```

Open `.env` and fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Any random secret string |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `PORT` | Server port (default `3001`) |
| `STRIPE_SECRET_KEY` | Stripe secret key from dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (usually `587`) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender email address |
| `PHARMACY_NAME` | Your pharmacy name (for invoices) |
| `PHARMACY_ADDRESS` | Your pharmacy address (for invoices) |

**Run database migrations**
```bash
npx prisma migrate deploy
```

**Generate Prisma client**
```bash
npx prisma generate
```

**Start the backend**
```bash
npm run start:dev
```

Backend runs at `http://localhost:3001`

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
```

**Install dependencies**
```bash
npm install
```

**Start the frontend**
```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Running Both Together

You need **two terminals** running simultaneously:

| Terminal | Command | URL |
|---|---|---|
| Backend | `cd backend && npm run start:dev` | http://localhost:3001 |
| Frontend | `cd frontend && npm run dev` | http://localhost:3000 |

---

## Project Structure

```
HealthLink/
├── backend/        # NestJS API + Prisma ORM
│   ├── prisma/     # Database schema & migrations
│   └── src/        # Application source code
└── frontend/       # Next.js app with Tailwind CSS
    └── src/        # Pages, components, and lib
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, TanStack Query |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| Auth | JWT (Passport.js) |
| Payments | Stripe |
| Email | Nodemailer |
