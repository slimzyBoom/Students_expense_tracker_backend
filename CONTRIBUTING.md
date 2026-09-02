# Contributing to Student Expense Tracker API

Thank you for your interest in contributing to the **Student Expense Tracker API**! We welcome contributions from developers of all skill levels. 

Please take a moment to review this guide to ensure smooth collaboration.

---

## 📋 Table of Contents
1. [Code of Conduct](#-code-of-conduct)
2. [Development Setup](#-development-setup)
3. [Branching & Workflow](#-branching--workflow)
4. [Coding Standards & Architecture Guidelines](#-coding-standards--architecture-guidelines)
5. [Submitting a Pull Request](#-submitting-a-pull-request)
6. [Reporting Bugs & Suggesting Features](#-reporting-bugs--suggesting-features)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please treat all contributors and maintainers with respect and professionalism.

---

## 💻 Development Setup

### 1. Fork & Clone
Fork the repository and clone your fork locally:
```bash
git clone https://github.com/<your-username>/review-x20-2.git
cd review-x20-2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create your local `.env` configuration:
```bash
cp .env.example .env
```
Make sure MongoDB is running locally or provide a remote MongoDB connection string in `.env`.

### 4. Run Development Server
```bash
npm run dev
```

---

## 🌿 Branching & Workflow

* Always branch off the `main` (or `develop`) branch.
* Use descriptive branch names:
  * `feature/add-budget-export`
  * `fix/debit-amount-parsing`
  * `refactor/token-helpers`
  * `docs/update-api-reference`

---

## 📐 Coding Standards & Architecture Guidelines

To keep the codebase maintainable, secure, and clean, please adhere to these core conventions:

### 1. Architecture Layering
Follow the strict layered architecture:
* **Routes (`src/routes/`):** Define HTTP routes and mount validation middlewares (`validateBody`, `validateQuery`, `validateParams`).
* **Controllers (`src/controllers/`):** Handle HTTP request/response lifecycles, read validated inputs from `res.locals`, and call services. Keep controllers thin.
* **Services (`src/services/`):** Contain all core business logic, database calculations, and transactional operations.
* **Models (`src/models/`):** Define Mongoose schemas, indexes, and type exports.
* **Validations (`src/validations/`):** Define Zod schemas for all inbound payloads.

### 2. TypeScript & Strict Typing
* **No `any` unless strictly unavoidable.** Use proper TypeScript generics and Mongoose types (`Types.ObjectId`, `FilterQuery<T>`, etc.).
* Run `npm run build` locally before committing to verify that there are **zero TypeScript compilation errors**.

### 3. Financial Integrity & Multi-Document Transactions
* All balance-modifying operations across multiple documents (transactions, accounts, users) **must** use MongoDB ACID sessions:
  ```typescript
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // database operations with { session }
    });
  } finally {
    await session.endSession();
  }
  ```

### 4. Security & Sanitization
* Never log raw passwords, JWT tokens, or sensitive user secrets.
* Always sanitize user-submitted spreadsheet/CSV text using `src/utils/csvSanitizer.ts` to prevent CSV formula injection.
* Validate all ObjectIds and query parameters using Zod.

---

## 🚀 Submitting a Pull Request

1. **Verify your code compiles:**
   ```bash
   npm run build
   ```
2. **Commit your changes with clear, concise commit messages:**
   ```bash
   git commit -m "feat(budget): add monthly rollover calculation"
   ```
3. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
4. **Open a Pull Request:**
   * Describe the problem your PR solves.
   * List the specific changes made.
   * Detail the testing/verification steps you performed.

---

## 🐛 Reporting Bugs & Suggesting Features

* **Bug Reports:** Open an issue describing the bug, reproduction steps, expected vs. actual behavior, and error logs/screenshots.
* **Feature Requests:** Open an issue outlining the motivation, proposed solution, and potential impact on students/users.

---

Thank you for helping build a better financial tool for students! 🚀
