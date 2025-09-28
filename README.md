# 🚀 Code Editor Platform

A full-stack collaborative code editor built with **React + Node.js + MySQL**.  
Milestone 1 covers **user authentication, project creation, editor, theme selection, and basic code execution** (via Judge0 API).

---

## 📌 Features (Milestone 1)

- 🔐 **Authentication** – Register, Login, Logout, Password Reset (with email link)
- 👤 **Profile** – Update theme preference (Light/Dark)
- 📂 **Projects** – Create, view, edit, and save projects per user
- 💻 **Code Editor** – Multi-language support (JavaScript, Python, Java, C++) with syntax highlighting
- ▶️ **Run Code** – Execute code using Judge0 API (production) or Node/Python (dev mode)
- 🎨 **Theme** – User preference persisted in DB and applied to editor

---

## 🛠️ Tech Stack

- **Frontend**: React, React Router, CodeMirror
- **Backend**: Node.js, Express.js, Passport.js
- **Database**: MySQL (users, projects, password reset tokens)
- **Execution Engine**: Judge0 API (RapidAPI)
- **Auth & Sessions**: Express-session + MySQLStore
- **Email Service**: Nodemailer (Gmail / Dev console mode)

---

## ⚙️ Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/archit090301/cap.git
cd cap
