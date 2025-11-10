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
  LineChart,
  Line
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState({ stats: true, users: true });
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const [projects, setProjects] = useState([]);


  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  // 📊 Fetch stats
  const fetchStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const { data } = await api.get("/admin/stats");
      setStats(data);
    } catch {
      setMessage("Failed to load stats");
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // 👥 Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      setMessage("❌ Failed to load users");
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // 🚀 Promote user
  const promoteUser = async (id) => {
    try {
      await api.put(`/admin/promote/${id}`);
      setMessage("✅ User promoted successfully");
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("❌ Promotion failed");
    }
  };

  // 🔽 Demote user
  const demoteUser = async (id) => {
    try {
      await api.put(`/admin/demote/${id}`);
      setMessage("✅ User demoted successfully");
      fetchUsers();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("❌ Demotion failed");
    }
  };

  // Chart data
  const chartData = stats
    ? [
        { name: "Users", count: stats.users },
        { name: "Projects", count: stats.projects },
        { name: "Files", count: stats.files },
        { name: "Executions", count: stats.executions || 0 },
      ]
    : [];

  // User role distribution for pie chart
  const roleData = users.length > 0 ? [
    { name: 'Admins', value: users.filter(u => u.role_id === 2).length },
    { name: 'Users', value: users.filter(u => u.role_id === 1).length }
  ] : [];

  const COLORS = ['#4e54c8', '#8f94fb'];

  const [activity, setActivity] = useState([]);

const fetchActivity = async () => {
  try {
    const { data } = await api.get("/admin/activity");
    setActivity(data);
  } catch {
    setMessage("❌ Failed to load activity");
  }
};

const fetchProjects = async () => {
  try {
    const { data } = await api.get("/admin/projects");
    setProjects(data || []);
  } catch {
    setMessage("❌ Failed to load projects");
  }
};

const handleModerate = async (id, action) => {
  try {
    await api.put(`/admin/projects/${id}/${action}`);
    setMessage(`✅ Project ${action}d successfully`);
    fetchProjects();
    setTimeout(() => setMessage(""), 3000);
  } catch {
    setMessage(`❌ Failed to ${action} project`);
  }
};

const handleDeleteProject = async (id) => {
  try {
    await api.delete(`/admin/projects/${id}`);
    setMessage("🗑️ Project deleted");
    fetchProjects();
    setTimeout(() => setMessage(""), 3000);
  } catch {
    setMessage("❌ Failed to delete project");
  }
};


useEffect(() => {
  fetchStats();
  fetchUsers();
  fetchActivity();
  fetchProjects();
}, []);


  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🛠 Admin Dashboard</h1>
        <div style={styles.headerActions}>
          <button onClick={fetchStats} style={styles.refreshButton}>
            🔄 Refresh
          </button>
          <div style={styles.userCount}>
            👥 {users.length} Users Online
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div style={{
          ...styles.message,
          background: message.includes("❌") ? "#fee2e2" : "#d1fae5",
          color: message.includes("❌") ? "#dc2626" : "#065f46",
        }}>
          {message}
        </div>
      )}

      {/* Mobile Tabs */}
      {isMobile && (
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "overview" ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "users" ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab("users")}
          >
            👥 Users
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === "activity" ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab("activity")}
          >
            📈 Activity
          </button>
        </div>
      )}

      <div style={styles.content}>
        {/* Overview Section */}
        {(!isMobile || activeTab === "overview") && (
          <div style={styles.section}>
            {/* Stats Cards */}
            {loading.stats ? (
              <div style={styles.loadingGrid}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={styles.loadingCard}></div>
                ))}
              </div>
            ) : stats ? (
              <div style={styles.cards}>
                {[
                  { icon: "👤", label: "Total Users", value: stats.users, change: "+12%" },
                  { icon: "📁", label: "Projects", value: stats.projects, change: "+5%" },
                  { icon: "📝", label: "Files", value: stats.files, change: "+8%" },
                  { icon: "⚡", label: "Executions", value: stats.executions || 0, change: "+15%" },
                ].map((item, index) => (
                  <div key={index} style={styles.card}>
                    <div style={styles.cardIcon}>{item.icon}</div>
                    <div style={styles.cardContent}>
                      <div style={styles.cardValue}>{item.value}</div>
                      <div style={styles.cardLabel}>{item.label}</div>
                      <div style={styles.cardChange}>{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Charts Grid */}
            {stats && (
              <div style={styles.chartsGrid}>
                <div style={styles.chartContainer}>
                  <h3 style={styles.chartTitle}>📊 Platform Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#4e54c8" barSize={isMobile ? 40 : 60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

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
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={isMobile ? 80 : 100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>👥 User Management ({users.length})</h2>
              <div style={styles.userStats}>
                <span style={styles.statBadge}>
                  👑 {users.filter(u => u.role_id === 2).length} Admins
                </span>
                <span style={styles.statBadge}>
                  👤 {users.filter(u => u.role_id === 1).length} Users
                </span>
              </div>
            </div>

            {loading.users ? (
              <div style={styles.loadingTable}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={styles.loadingRow}></div>
                ))}
              </div>
            ) : isMobile ? (
              // Mobile User Cards
              <div style={styles.mobileUsers}>
                {users.map((user) => (
                  <div key={user.user_id} style={styles.userCard}>
                    <div style={styles.userHeader}>
                      <div style={styles.userAvatar}>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.userInfo}>
                        <div style={styles.userName}>{user.username}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                      </div>
                      <div style={{
                        ...styles.roleBadge,
                        ...(user.role_id === 2 ? styles.adminBadge : styles.userBadge)
                      }}>
                        {user.role_id === 2 ? "👑 Admin" : "👤 User"}
                      </div>
                    </div>
                    <div style={styles.userDetails}>
                      <div style={styles.userDetail}>
                        <strong>ID:</strong> #{user.user_id}
                      </div>
                      <div style={styles.userDetail}>
                        <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.userActions}>
                      {user.role_id === 1 ? (
                        <button 
                          onClick={() => promoteUser(user.user_id)}
                          style={styles.promoteButton}
                        >
                          👑 Promote to Admin
                        </button>
                      ) : (
                        <button 
                          onClick={() => demoteUser(user.user_id)}
                          style={styles.demoteButton}
                        >
                          👤 Demote to User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop Table
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Joined</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.user_id} style={styles.tr}>
                        <td style={styles.td}>#{user.user_id}</td>
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <div style={styles.tableAvatar}>
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                            {user.username}
                          </div>
                        </td>
                        <td style={styles.td}>{user.email}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.roleBadge,
                            ...(user.role_id === 2 ? styles.adminBadge : styles.userBadge)
                          }}>
                            {user.role_id === 2 ? "Admin" : "User"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {user.role_id === 1 ? (
                            <button 
                              onClick={() => promoteUser(user.user_id)}
                              style={styles.promoteButton}
                            >
                              Promote
                            </button>
                          ) : (
                            <button 
                              onClick={() => demoteUser(user.user_id)}
                              style={styles.demoteButton}
                            >
                              Demote
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

        {/* Project Moderation Section */}
<div style={styles.section}>
  <div style={styles.sectionHeader}>
    <h2 style={styles.sectionTitle}>📁 Project Moderation ({projects.length})</h2>
  </div>

  <div style={styles.tableContainer}>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Owner</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Created</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.project_id} style={styles.tr}>
            <td style={styles.td}>#{p.project_id}</td>
            <td style={styles.td}>{p.title || "Untitled"}</td>
            <td style={styles.td}>{p.username || "Unknown"}</td>
            <td style={styles.td}>
              <span
                style={{
                  ...styles.roleBadge,
                  ...(p.moderation_status === "approved"
                    ? styles.approvedBadge
                    : p.moderation_status === "rejected"
                    ? styles.rejectedBadge
                    : styles.pendingBadge),
                }}
              >
                {p.moderation_status || "pending"}
              </span>
            </td>
            <td style={styles.td}>
              {new Date(p.created_at).toLocaleDateString()}
            </td>
            <td style={styles.td}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleModerate(p.project_id, "approve")}
                  style={styles.promoteButton}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(p.project_id, "reject")}
                  style={styles.demoteButton}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleDeleteProject(p.project_id)}
                  style={{
                    ...styles.demoteButton,
                    background: "linear-gradient(135deg, #6b7280, #4b5563)",
                  }}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


        {/* Activity Section */}
        {(!isMobile || activeTab === "activity") && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📈 Recent Activity</h2>
            <div style={styles.activityGrid}>
              <div style={styles.activityList}>
                <h3 style={styles.activityTitle}>Latest Actions</h3>
                {activity.map((item, i) => (
  <div key={i} style={styles.activityItem}>
    <div style={styles.activityIcon}>⚡</div>
    <div style={styles.activityContent}>
      <div style={styles.activityAction}>{item.action}</div>
      <div style={styles.activityMeta}>
        by {item.username} • {new Date(item.created_at).toLocaleString()}
      </div>
    </div>
  </div>
))}

              </div>
              
              <div style={styles.quickStats}>
                <h3 style={styles.activityTitle}>Quick Stats</h3>
                <div style={styles.quickStatsGrid}>
  <div style={styles.quickStat}>
    <div style={styles.quickStatValue}>{users.length}</div>
    <div style={styles.quickStatLabel}>Active Users</div>
  </div>
  <div style={styles.quickStat}>
    <div style={styles.quickStatValue}>
      {stats ? `${Math.min(100, (stats.executions / 50).toFixed(0))}%` : "—"}
    </div>
    <div style={styles.quickStatLabel}>Uptime</div>
  </div>
  <div style={styles.quickStat}>
    <div style={styles.quickStatValue}>
      {stats ? stats.executions : "—"}
    </div>
    <div style={styles.quickStatLabel}>Executions</div>
  </div>
  <div style={styles.quickStat}>
    <div style={styles.quickStatValue}>
      {stats ? stats.projects : "—"}
    </div>
    <div style={styles.quickStatLabel}>New Projects</div>
  </div>
</div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', sans-serif",
    padding: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  refreshButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  userCount: {
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#4e54c8',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontWeight: '600',
  },
  message: {
    padding: '1rem 1.5rem',
    borderRadius: '10px',
    marginBottom: '2rem',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
  tabContainer: {
    display: 'flex',
    background: 'white',
    borderRadius: '12px',
    padding: '0.5rem',
    marginBottom: '2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    padding: '1rem',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  section: {
    marginBottom: '3rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  sectionTitle: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  userStats: {
    display: 'flex',
    gap: '1rem',
  },
  statBadge: {
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#4e54c8',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  loadingCard: {
    background: '#e5e7eb',
    borderRadius: '12px',
    padding: '2rem',
    animation: 'pulse 2s infinite',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  cardIcon: {
    fontSize: '3rem',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0.5rem 0',
  },
  cardChange: {
    fontSize: '0.875rem',
    color: '#10b981',
    fontWeight: '600',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
  },
  chartContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  chartTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  tableContainer: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  th: {
    background: '#f8fafc',
    padding: '1.25rem 1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.2s ease',
  },
  "tr:hover": {
    background: '#f9fafb',
  },
  td: {
    padding: '1.25rem 1rem',
    color: '#4b5563',
    fontSize: '0.95rem',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  tableAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem',
  },
  roleBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    textAlign: 'center',
    display: 'inline-block',
  },
  adminBadge: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
  },
  userBadge: {
    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    color: 'white',
  },
  promoteButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
  },
  demoteButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
  },
  mobileUsers: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  userAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: '1.25rem',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  userEmail: {
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  userDetail: {
    fontSize: '0.9rem',
    color: '#4b5563',
  },
  userActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  loadingTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  loadingRow: {
    height: '60px',
    background: '#e5e7eb',
    borderRadius: '8px',
    animation: 'pulse 2s infinite',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  activityList: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  activityTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: '1px solid #f3f4f6',
  },
  activityIcon: {
    fontSize: '1.5rem',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  activityMeta: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  quickStats: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
  },
  quickStat: {
    textAlign: 'center',
    padding: '1.5rem 1rem',
    background: 'rgba(102, 126, 234, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(102, 126, 234, 0.1)',
  },
  quickStatValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#4e54c8',
    marginBottom: '0.5rem',
  },
  approvedBadge: {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
},
rejectedBadge: {
  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
  color: 'white',
},
pendingBadge: {
  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  color: 'white',
},

  quickStatLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
};

// // Add CSS animations
// const globalStyles = `
//   @keyframes pulse {
//     0%, 100% { opacity: 1; }
//     50% { opacity: 0.5; }
//   }

//   button:hover:not(:disabled) {
//     transform: translateY(-2px);
//     box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
//   }

//   .card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
//   }

//   @media (max-width: 768px) {
//     .header {
//       flex-direction: column;
//       text-align: center;
//     }
    
//     .header-actions {
//       justify-content: center;
//     }
    
//     .charts-grid {
//       grid-template-columns: 1fr;
//     }
    
//     .chart-container {
//       padding: 1.5rem;
//     }
    
//     .activity-grid {
//       grid-template-columns: 1fr;
//     }
    
//     .user-actions {
//       flex-direction: column;
//     }
//   }

//   @media (max-width: 480px) {
//     .container {
//       padding: 0.5rem;
//     }
    
//     .title {
//       font-size: 2rem;
//     }
    
//     .card {
//       padding: 1.5rem;
//     }
    
//     .cards {
//       grid-template-columns: 1fr;
//     }
//   }
// `;
