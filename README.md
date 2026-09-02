# 🎓 Student Expense Tracker API

A secure, scalable RESTful API designed specifically for student financial management. It features a dual-account ledger (Cash Wallet vs. Main Bank Account), CSV bank statement streaming and parsing with automated keyword categorization, monthly budget threshold monitoring, and spending analytics.

---

## 🚀 Key Features

* **🔐 Authentication & Security:**
  * Stateless JWT access tokens (15m expiry) with secure, HttpOnly rotating refresh token cookies (7d expiry).
  * Refresh token reuse detection that automatically revokes compromised sessions.
  * Strong password hashing using `bcrypt` (12 salt rounds).
  * Rate-limiting on authentication routes to mitigate brute-force attacks.
  * Security headers via `helmet` and configurable CORS origin controls.

* **💰 Dual-Account Ledger & ACID Transactions:**
  * Automatically provisions two default accounts upon registration: **Cash Wallet** (`CASH`) and **Main Bank Account** (`BANK`).
  * Double-entry balance synchronization powered by MongoDB multi-document transactions (`session.withTransaction`).
  * Real-time balance updates with automatic rollbacks on updates and deletions.

* **📝 Transaction Tracking & Daily Cash Logs:**
  * Quick cash entry logging for manual out-of-pocket expenses.
  * Bulk end-of-day cash log endpoint (`/transactions/cash/daily-log`) for efficient batch logging.
  * Filtered and paginated transaction history (by date range, category, and type).

* **📄 CSV Bank Statement Parser & Rule Engine:**
  * Memory-only multipart file parsing via Multer—no temporary files written to disk.
  * High-performance in-memory batch processing: preloads rules and executes a single batched duplicate check.
  * CSV formula injection defense via automated narrative sanitization.
  * Customizable keyword-based categorization rule engine.

* **🎯 Monthly Budgets & Spending Thresholds:**
  * Category-based monthly spending limits.
  * Real-time aggregation pipeline calculating budget usage, percentages, and status indicators:
    * `Safe` (< 80%)
    * `Warning` (80% – 99%)
    * `Exceeded` ($\ge$ 100%)

* **📊 Financial Analytics & Insights:**
  * **Summary:** Total income, total expenses, net savings, and burn rate percentage.
  * **Category Breakdown:** Aggregated expense spending grouped by category with percentages.
  * **Daily Trends:** Day-by-day cash flow trends over custom date ranges.

---

## 🛠️ Tech Stack

* **Runtime & Framework:** [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/)
* **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
* **Database & ODM:** [MongoDB](https://www.mongodb.com/), [Mongoose 8+](https://mongoosejs.com/)
* **Validation:** [Zod](https://zod.dev/)
* **Security & Tokens:** `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `cookie-parser`
* **File & Date Processing:** `csv-parse`, `multer`, `dayjs`

---

## 📂 Project Architecture

```
src/
├── app.ts                  # Express application setup, global middlewares, route mounting
├── server.ts               # Server entry point and database connection listener
├── @types/                 # Custom TypeScript definitions for Express
├── config/                 # Environment validation (Zod) and MongoDB connection
│   ├── db.ts
│   └── env.ts
├── constants/              # System constants and default categories
├── controllers/            # Request handlers orchestrating validation and services
├── middlewares/            # Auth, validation, error handler, rate limiter, and upload middlewares
├── models/                 # Mongoose schemas (User, Account, Category, Rule, Transaction, Budget, Token)
├── routes/                 # Express route definitions
├── services/               # Core business logic (auth, transaction ledger, parser, budget, analytics)
├── utils/                  # Helper utilities (token, csvSanitizer, hashGenerator, apiResponse, logger)
└── validations/            # Zod validation schemas for request bodies, queries, and params
```

---

## 📡 API Reference

All routes are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | No | Register a new user and provision default accounts |
| `POST` | `/auth/login` | No | Login with email and password |
| `POST` | `/auth/refresh-token` | No (Cookie) | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | No (Cookie) | Revoke refresh token and clear cookie |
| `GET` | `/auth/me` | Bearer Token | Retrieve authenticated user profile |

### 2. Accounts (`/api/v1/accounts`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/accounts` | Bearer Token | List all user accounts with current balances |

### 3. Categories & Categorization Rules (`/api/v1`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/categories` | Bearer Token | List all global and user-defined categories |
| `POST` | `/categories` | Bearer Token | Create a custom category |
| `GET` | `/rules` | Bearer Token | List user's auto-categorization rules |
| `POST` | `/rules` | Bearer Token | Create an auto-categorization rule |
| `DELETE` | `/rules/:id` | Bearer Token | Delete an auto-categorization rule |

### 4. Transactions (`/api/v1/transactions`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/transactions` | Bearer Token | Paginated list of transactions with filters |
| `POST` | `/transactions` | Bearer Token | Create a manual transaction |
| `POST` | `/transactions/cash` | Bearer Token | Record quick Cash Wallet income/expense |
| `POST` | `/transactions/cash/daily-log` | Bearer Token | Bulk record end-of-day cash expenses |
| `PUT` | `/transactions/:id` | Bearer Token | Update a manual transaction (with balance rollback) |
| `DELETE` | `/transactions/:id` | Bearer Token | Delete a manual transaction (with balance rollback) |

### 5. Bank Statements (`/api/v1/statements`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/statements/parse` | Bearer Token | Upload CSV statement (`file` field) for parsing & duplicate detection |
| `POST` | `/statements/confirm` | Bearer Token | Confirm and import parsed statement items into ledger |

### 6. Budgets (`/api/v1/budgets`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/budgets?month=YYYY-MM` | Bearer Token | List monthly budgets with usage and status (`Safe`/`Warning`/`Exceeded`) |
| `POST` | `/budgets` | Bearer Token | Set or update monthly budget limit for a category |

### 7. Analytics (`/api/v1/analytics`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/analytics/summary?month=YYYY-MM` | Bearer Token | Monthly financial summary (Income, Expense, Savings, Burn Rate) |
| `GET` | `/analytics/category-breakdown?month=YYYY-MM` | Bearer Token | Expense breakdown grouped by category |
| `GET` | `/analytics/daily-trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | Bearer Token | Daily cash flow trend analysis over a date range |

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_ACCESS_SECRET=your-secure-32-plus-char-access-secret-key
JWT_REFRESH_SECRET=your-secure-32-plus-char-refresh-secret-key
CLIENT_ORIGIN=http://localhost:3000
```

| Variable | Description | Default / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `PORT` | Port number the API will listen on | `3000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_ACCESS_SECRET` | Secret key used to sign Access Tokens | $\ge$ 32 characters |
| `JWT_REFRESH_SECRET`| Secret key used to sign Refresh Tokens | $\ge$ 32 characters |
| `CLIENT_ORIGIN` | Allowed client URL for CORS and cookies | `http://localhost:3000` |

---

## 🚦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) instance running locally or on MongoDB Atlas

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd review-x20-2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your secrets and MongoDB URI
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔒 Security Best Practices Implemented

* **Strict Input Validation:** All endpoint bodies, path parameters, and query strings are parsed and sanitized using Zod schemas before reaching controller logic.
* **ACID Transactions:** Account balance adjustments and transaction writes are wrapped in MongoDB sessions to eliminate race conditions and orphaned balances.
* **Token Rotation:** Refresh tokens are hashed using SHA-256 before storage and rotated on every refresh. Reuse of an old token revokes all active sessions for that user.
* **CSV Formula Injection Defense:** Strips hazardous spreadsheet formula trigger characters (`=`, `+`, `-`, `@`) during statement parsing.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

