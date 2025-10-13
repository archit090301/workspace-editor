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
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  // 📱 Detect mobile screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 📊 Initial data load
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // 📈 Fetch stats
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

  // 📊 Chart data
  const chartData = stats
    ? [
        { name: "Users", count: stats.users },
        { name: "Projects", count: stats.projects },
        { name: "Files", count: stats.files },
      ]
    : [];

  // 🥧 Pie chart data
  const roleData =
    users.length > 0
      ? [
          { name: "Admins", value: users.filter((u) => u.role_id === 2).length },
          { name: "Users", value: users.filter((u) => u.role_id === 1).length },
        ]
      : [];

  const COLORS = ["#4e54c8", "#8f94fb"];

  return (
    <div style={styles.container}>
      {/* Header */}
      {isMobile ? (
        <div style={styles.mobileHeader}>
          <h1 style={styles.mobileTitle}>🛠 Admin Dashboard</h1>
        </div>
      ) : (
        <h1 style={styles.title}>🛠 Admin Dashboard</h1>
      )}

      {/* Message */}
      {message && (
        <div
          style={{
            ...styles.message,
            background: message.includes("❌") ? "#fed7d7" : "#c6f6d5",
            color: message.includes("❌") ? "#9b2c2c" : "#276749",
          }}
        >
          {message}
        </div>
      )}

      {/* Tabs (mobile only) */}
      {isMobile && (
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "overview" ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "users" ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab("users")}
          >
            👥 Users
          </button>
        </div>
      )}

      <div style={styles.content}>
        {/* Overview Section */}
        {(!isMobile || activeTab === "overview") && (
          <div style={styles.section}>
            {/* Stats Cards */}
            {stats && (
              <div style={styles.cards}>
                {[
                  { icon: "👤", label: "Total Users", value: stats.users },
                  { icon: "📁", label: "Projects", value: stats.projects },
                  { icon: "📝", label: "Files", value: stats.files },
                ].map((item) => (
                  <div key={item.label} style={styles.card}>
                    <div style={styles.cardIcon}>{item.icon}</div>
                    <div>
                      <div style={styles.cardLabel}>{item.label}</div>
                      <div style={styles.cardValue}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts */}
            {stats && (
              <div style={styles.chartsSection}>
                {/* Bar Chart */}
                <div style={styles.chartContainer}>
                  <h3 style={styles.chartTitle}>📊 Usage Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#4e54c8"
                        barSize={isMobile ? 40 : 60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                {roleData.length > 0 && (
                  <div style={styles.chartContainer}>
                    <h3 style={styles.chartTitle}>👥 User Roles</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={roleData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        {(!isMobile || activeTab === "users") && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              👥 Manage Users ({users.length})
            </h2>

            {/* Mobile Cards */}
            {isMobile ? (
              <div style={styles.mobileUsers}>
                {users.map((u) => (
                  <div key={u.user_id} style={styles.userCard}>
                    <div style={styles.userHeader}>
                      <div style={styles.userName}>{u.username}</div>
                      <div
                        style={{
                          ...styles.roleBadge,
                          background:
                            u.role_id === 2 ? "#4e54c8" : "#718096",
                        }}
                      >
                        {u.role_id === 2 ? "Admin" : "User"}
                      </div>
                    </div>
                    <div style={styles.userDetails}>
                      <div>
                        <strong>ID:</strong> {u.user_id}
                      </div>
                      <div>
                        <strong>Email:</strong> {u.email}
                      </div>
                    </div>
                    {u.role_id === 1 && (
                      <button
                        style={styles.promoteBtn}
                        onClick={() => promoteUser(u.user_id)}
                      >
                        Promote to Admin
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Username</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} style={styles.tr}>
                        <td style={styles.td}>{u.user_id}</td>
                        <td style={styles.td}>{u.username}</td>
                        <td style={styles.td}>{u.email}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.roleBadge,
                              background:
                                u.role_id === 2 ? "#4e54c8" : "#718096",
                            }}
                          >
                            {u.role_id === 2 ? "Admin" : "User"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {u.role_id === 1 && (
                            <button
                              style={styles.promoteBtn}
                              onClick={() => promoteUser(u.user_id)}
                            >
                              Promote to Admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Styles
const styles = {
  container: {
    minHeight: "100vh",
    background: "#f7fafc",
    fontFamily: "'Inter', sans-serif",
  },
  mobileHeader: {
    background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
    color: "white",
    padding: "1.5rem 1rem",
    textAlign: "center",
  },
  mobileTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "700",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    textAlign: "center",
    margin: "2rem 0",
    color: "#2d3748",
  },
  message: {
    padding: "1rem",
    margin: "1rem",
    borderRadius: "8px",
    fontWeight: "500",
    textAlign: "center",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
  },
  tab: {
    flex: 1,
    padding: "1rem",
    border: "none",
    background: "white",
    fontSize: "1rem",
    cursor: "pointer",
  },
  activeTab: {
    background: "#4e54c8",
    color: "white",
  },
  content: {
    padding: "1rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  section: { marginBottom: "2rem" },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "1.5rem",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  card: {
    background: "linear-gradient(135deg, #4e54c8, #8f94fb)",
    color: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  cardIcon: { fontSize: "2.5rem" },
  cardLabel: { fontSize: "0.9rem", opacity: 0.9 },
  cardValue: { fontSize: "2rem", fontWeight: "700" },
  chartsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "2rem",
  },
  chartContainer: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  chartTitle: {
    textAlign: "center",
    marginBottom: "1.5rem",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  tableContainer: {
    background: "white",
    borderRadius: "12px",
    overflow: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "600px" },
  th: {
    background: "#f8fafc",
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
  },
  td: { padding: "1rem", color: "#4a5568" },
  tr: { borderBottom: "1px solid #e2e8f0" },
  roleBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  promoteBtn: {
    padding: "0.5rem 1rem",
    background: "#48bb78",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  mobileUsers: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  userCard: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  userHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  userName: {
    fontSize: "1.25rem",
    fontWeight: "600",
  },
};

