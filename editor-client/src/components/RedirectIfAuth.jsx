import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function RedirectIfAuth() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (user) return <Navigate to="/editor" />;

  return <Outlet />;
}
