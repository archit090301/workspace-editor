import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./AuthContext";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import RedirectIfAuth from "./components/RedirectIfAuth";
import Files from "./pages/Files";
import ProjectEditor from "./pages/ProjectEditor";
import Friends from "./pages/Friends";
import CollabLobby from "./pages/CollabLobby";
import CollabRoom from "./pages/CollabRoom";
import AdminDashboard from "./pages/AdminDashboard";

// 🆕 Import the new popup component
import InvitePopup from "./components/InvitePopup";

// Small wrapper to restrict access to admins only
function AdminOnly() {
  const { user } = useAuth();
  if (!user || user.role_id !== 2) {
    return <Navigate to="/" replace />;
  }
  return <AdminDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public routes with redirect if logged in */}
          <Route element={<RedirectIfAuth />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/editor" element={<Editor />} /> {/* blank editor */}
            <Route path="/projects/:projectId/files" element={<Files />} />
            <Route path="/files/:fileId" element={<Editor />} />
            <Route path="/projects/:projectId/files/:fileId" element={<Editor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects/:projectId" element={<ProjectEditor />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/collab" element={<CollabLobby />} />
            <Route path="/collab/:roomId" element={<CollabRoom />} />

            {/* 🔒 Admin-only route */}
            <Route path="/admin" element={<AdminOnly />} />
          </Route>
        </Routes>

        {/* 🆕 Global invite listener (appears on any route) */}
        <InvitePopup />
      </Router>
    </AuthProvider>
  );
}

export default App;
