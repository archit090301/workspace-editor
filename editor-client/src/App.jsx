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

import InvitePopup from "./components/InvitePopup";

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
          <Route element={<RedirectIfAuth />}>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/editor" element={<Editor />} /> 
            <Route path="/projects/:projectId/files" element={<Files />} />
            <Route path="/files/:fileId" element={<Editor />} />
            <Route path="/projects/:projectId/files/:fileId" element={<Editor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects/:projectId" element={<ProjectEditor />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/collab" element={<CollabLobby />} />
            <Route path="/collab/:roomId" element={<CollabRoom />} />

            <Route path="/admin" element={<AdminOnly />} />
          </Route>
        </Routes>

        <InvitePopup />
      </Router>
    </AuthProvider>
  );
}

export default App;
