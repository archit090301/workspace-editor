# Code Editor Platform

[![React](https://img.shields.io/badge/Frontend-React-61dafb?logo=react&logoColor=white)](https://react.dev/)  
[![Node.js](https://img.shields.io/badge/Backend-Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/API-Express.js-black?logo=express&logoColor=white)](https://expressjs.com/)  
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)  
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)  
[![CodeMirror](https://img.shields.io/badge/Editor-CodeMirror-087EA4?logo=codemirror&logoColor=white)](https://codemirror.net/)

A full-stack collaborative code editor built with React, Node.js, and MySQL, featuring real-time rooms, project management, and secure code execution via Judge0 API.

---

## Features

### Milestone 1 – Core Features

- Authentication: Register, Login, Logout, Password Reset via email link
- Profile Management: Update theme preference (Light/Dark)
- Friends System: Add, view, accept, or reject requests
- Projects: Create, view, edit, and save user-specific projects
- Collaborative Rooms: Real-time multi-user editing
- Code Editor: JavaScript, Python, Java, C++ support
- Run Code: Execute via Judge0 API or local runtime during development
- Themes: User preferences stored in database
- Execution History: Track previous run results

---

### Milestone 2 – Enhanced Editor

- Invite Friends directly into rooms/workspaces
- Import and Export Code snippets
- Full-Screen Editor Mode
- Input/Output Handling (stdin → stdout)
- Deployment-ready staging environment
- Demo video showcasing editor functionality

---

### Milestone 3 – Admin and Security

- Admin User Management (roles, access control)
- Admin Project Moderation
- Analytics Dashboard for insights and usage metrics
- Security enhancements: SQL injection + XSS protection
- Accessibility: Keyboard navigation, ARIA roles, screen reader compliance

---

### Final Phase

- Full accessibility compliance
- Unit, integration, and end-to-end testing
- Performance optimization
- Discussion forums for collaboration
- Final production deployment

---

## Tech Stack

- **Frontend**: React, React Router, CodeMirror
- **Backend**: Node.js, Express.js, Passport.js
- **Database**: MySQL
- **Execution Engine**: Judge0 API (RapidAPI)
- **Authentication**: express-session with MySQLStore
- **Email Service**: Nodemailer
- **Realtime Communication**: Socket.IO

---

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/archit090301/cap.git
cd cap
```
