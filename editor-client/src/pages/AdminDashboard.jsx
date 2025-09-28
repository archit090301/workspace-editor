import { useEffect, useState } from "react";
import api from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // 📊 Fetch stats
  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {
      setMessage("❌ Failed to load stats");
    }
  };

  // 👥 Fetch users
  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      setMessage("❌ Failed to load users");
    }
  };

  // 🚀 Promote user
  const promoteUser = async (id) => {
    try {
      await api.put(`/admin/promote/${id}`);
      setMessage("✅ User promoted");
      fetchUsers();
    } catch {
      setMessage("❌ Promotion failed");
    }
  };

  // Chart data
  const chartData = stats
    ? [
        { name: "Users", count: stats.users },
        { name: "Projects", count: stats.projects },
        { name: "Files", count: stats.files },
      ]
    : [];

  return (
    <div style={styles.container}>
      <h1>🛠 Admin Dashboard</h1>
      {message && <p>{message}</p>}

      {/* ✅ Stats cards */}
      {stats && (
        <div style={styles.cards}>
          <div style={styles.card}>👤 Users: <strong>{stats.users}</strong></div>
          <div style={styles.card}>📁 Projects: <strong>{stats.projects}</strong></div>
          <div style={styles.card}>📝 Files: <strong>{stats.files}</strong></div>
        </div>
      )}

      {/* ✅ Chart */}
      {stats && (
        <div style={{ marginTop: "2rem", height: "300px" }}>
          <h2>📊 Usage Overview</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4e54c8" barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ✅ User Management */}
      <h2 style={{ marginTop: "2rem" }}>👥 Manage Users</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role_id === 2 ? "Admin" : "User"}</td>
              <td>
                {u.role_id === 1 && (
                  <button style={styles.btn} onClick={() => promoteUser(u.user_id)}>
                    Promote to Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: "2rem" },
  cards: { display: "flex", gap: "1rem", marginBottom: "2rem" },
  card: {
    flex: 1,
    background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
    color: "#fff",
    padding: "1rem",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "1.2rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  btn: {
    padding: "0.3rem 0.8rem",
    border: "none",
    borderRadius: "5px",
    background: "green",
    color: "#fff",
    cursor: "pointer",
  },
};
