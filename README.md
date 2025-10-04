# 🚀 Code Editor Platform  

[![React](https://img.shields.io/badge/Frontend-React-61dafb?logo=react&logoColor=white)](https://react.dev/)  
[![Node.js](https://img.shields.io/badge/Backend-Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/API-Express.js-black?logo=express&logoColor=white)](https://expressjs.com/)  
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)  
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)  
[![CodeMirror](https://img.shields.io/badge/Editor-CodeMirror-087EA4?logo=codemirror&logoColor=white)](https://codemirror.net/)  

A **full-stack collaborative code editor** built with **React + Node.js + MySQL**, featuring real-time rooms, project management, and secure code execution via **Judge0 API**.  

---

## 📌 Features  

### ✅ Milestone 1 – Core Features  
- 🔐 **Authentication** – Register, Login, Logout, Password Reset (with email link)  
- 👤 **Profile** – Update theme preference (Light/Dark)  
- 👥 **Friends** – Add friends, view list, accept/reject requests  
- 📂 **Projects** – Create, view, edit, and save projects per user  
- 📝 **Collab Rooms** – Real-time collaborative rooms  
- 💻 **Code Editor** – Multi-language support (JavaScript, Python, Java, C++)  
- ▶️ **Run Code** – Judge0 API execution (RapidAPI) or local Node/Python in dev  
- 🎨 **Themes** – User preference persisted in DB  
- 📜 **Execution History** – Track past runs and results  

---

### 🎯 Milestone 2 – Enhanced Editor  
- 👥 **Invite Friends** – Invite directly into rooms/workspaces  
- ⬆️ **Import / Export Code** – Save and upload snippets easily  
- 🖥️ **Full-Screen Mode** – Distraction-free coding  
- 🔄 **Input/Output Handling** – stdin → stdout support  
- 🌐 **Deployment** – Staging environment setup  
- 🎥 **Demo Video** – Showcase functional editor progress  

---

### 🔒 Milestone 3 – Admin + Security  
- 👑 **User Management (Admin)** – Manage user accounts and roles  
- 🛡️ **Project Moderation (Admin)** – Manage shared/public projects  
- 📊 **Analytics Dashboard** – Usage tracking & performance insights  
- 🔐 **Security** – SQL injection & XSS prevention  
- ♿ **Accessibility** – Keyboard navigation, ARIA roles, screen reader support  

---

### 🏁 Final Phase  
- ✅ Complete accessibility compliance  
- ✅ Unit, integration, and E2E testing  
- ⚡ Performance optimization  
- 💬 Discussion forums for collaboration  
- 🚢 Final deployment to production  

---

## 🛠️ Tech Stack  

- **Frontend**: React, React Router, CodeMirror  
- **Backend**: Node.js, Express.js, Passport.js  
- **Database**: MySQL (users, friends, projects, password reset tokens)  
- **Execution Engine**: Judge0 API (RapidAPI)  
- **Auth & Sessions**: express-session + MySQLStore  
- **Email Service**: Nodemailer (Gmail/dev console mode)  
- **Realtime**: Socket.IO  

---

## ⚙️ Setup & Installation  

### 1. Clone the repo  
```bash
git clone https://github.com/archit090301/cap.git
cd cap
