import { useState, useEffect } from "react";
import api from "../api";

export default function Friends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [loading, setLoading] = useState({
    search: false,
    friends: true,
    requests: true
  });

  // 🔍 Search users
  const searchUsers = async () => {
    if (!query.trim()) return;
    
    setLoading(prev => ({ ...prev, search: true }));
    try {
      const { data } = await api.get(`/friends/search?q=${query}`);
      setResults(data);
    } catch {
      setMessage("Search failed");
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  // ➕ Send friend request
  const addFriend = async (friendId, username) => {
    try {
      await api.post(`/friends/add/${friendId}`);
      setMessage(`Friend request sent to ${username}`);
      setResults(prev => prev.filter(user => user.user_id !== friendId));
    } catch {
      setMessage("Failed to send request");
    }
  };

  // 👥 Load current friends and requests
  const fetchFriends = async () => {
    setLoading(prev => ({ ...prev, friends: true, requests: true }));
    try {
      const { data } = await api.get("/friends");
      setFriends(data.filter((f) => f.status === "accepted"));
      setRequests(data.filter((f) => f.status === "pending"));
    } catch {
      setMessage("Failed to load friends");
    } finally {
      setLoading(prev => ({ ...prev, friends: false, requests: false }));
    }
  };

  // ✅ Accept request
  const acceptFriend = async (userId, username) => {
    try {
      await api.put(`/friends/accept/${userId}`);
      setMessage(`Accepted friend request from ${username}`);
      fetchFriends();
    } catch {
      setMessage("Failed to accept request");
    }
  };

  // ❌ Reject request
  const rejectFriend = async (userId, username) => {
    try {
      await api.put(`/friends/reject/${userId}`);
      setMessage(`Rejected friend request from ${username}`);
      fetchFriends();
    } catch {
      setMessage("Failed to reject request");
    }
  };

  // ❌ Remove friend
  const removeFriend = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from your friends?`)) return;

    try {
      await api.delete(`/friends/remove/${userId}`);
      setMessage(`Removed ${username} from friends`);
      fetchFriends();
    } catch {
      setMessage("Failed to remove friend");
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      searchUsers();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Friends</h1>
            <p style={styles.subtitle}>Connect and collaborate with other developers</p>
          </div>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{friends.length}</span>
              <span style={styles.statLabel}>Friends</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNumber}>{requests.length}</span>
              <span style={styles.statLabel}>Requests</span>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={styles.message}>
            <span style={styles.messageIcon}>💡</span>
            {message}
          </div>
        )}

        {/* Search Section */}
        <div style={styles.searchSection}>
          <div style={styles.searchContainer}>
            <div style={styles.searchInputContainer}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search developers by username..."
                style={styles.searchInput}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={styles.clearButton}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={searchUsers}
              disabled={!query.trim() || loading.search}
              style={{
                ...styles.searchButton,
                ...((!query.trim() || loading.search) && styles.searchButtonDisabled)
              }}
            >
              {loading.search ? (
                <div style={styles.buttonContent}>
                  <div style={styles.spinner}></div>
                  Searching...
                </div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Search Results</h3>
            <div style={styles.resultsGrid}>
              {results.map((user) => (
                <div key={user.user_id} style={styles.userCard}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.userDetails}>
                      <span style={styles.username}>{user.username}</span>
                      <span style={styles.email}>{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addFriend(user.user_id, user.username)}
                    style={styles.addButton}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("friends")}
            style={{
              ...styles.tab,
              ...(activeTab === "friends" && styles.tabActive)
            }}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            style={{
              ...styles.tab,
              ...(activeTab === "requests" && styles.tabActive)
            }}
          >
            Requests ({requests.length})
          </button>
        </div>

        {/* Content based on active tab */}
        <div style={styles.tabContent}>
          {activeTab === "friends" ? (
            <div style={styles.section}>
              {loading.friends ? (
                <div style={styles.loading}>
                  <div style={styles.spinner}></div>
                  Loading friends...
                </div>
              ) : friends.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>👥</div>
                  <h3 style={styles.emptyTitle}>No friends yet</h3>
                  <p style={styles.emptyText}>
                    Search for developers above to start building your network
                  </p>
                </div>
              ) : (
                <div style={styles.friendsGrid}>
                  {friends.map((friend) => (
                    <div key={friend.user_id} style={styles.friendCard}>
                      <div style={styles.friendInfo}>
                        <div style={styles.avatar}>
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.friendDetails}>
                          <span style={styles.friendName}>{friend.username}</span>
                          <span style={styles.friendStatus}>Friends</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFriend(friend.user_id, friend.username)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.section}>
              {loading.requests ? (
                <div style={styles.loading}>
                  <div style={styles.spinner}></div>
                  Loading requests...
                </div>
              ) : requests.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📨</div>
                  <h3 style={styles.emptyTitle}>No pending requests</h3>
                  <p style={styles.emptyText}>
                    When someone sends you a friend request, it will appear here
                  </p>
                </div>
              ) : (
                <div style={styles.requestsList}>
                  {requests.map((request) => (
                    <div key={request.user_id} style={styles.requestCard}>
                      <div style={styles.requestInfo}>
                        <div style={styles.avatar}>
                          {request.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.requestDetails}>
                          <span style={styles.requestName}>{request.username}</span>
                          <span style={styles.requestText}>Wants to be your friend</span>
                        </div>
                      </div>
                      <div style={styles.requestActions}>
                        <button
                          onClick={() => acceptFriend(request.user_id, request.username)}
                          style={styles.acceptButton}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectFriend(request.user_id, request.username)}
                          style={styles.rejectButton}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem 1rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "white",
    borderRadius: "20px",
    padding: "2.5rem",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
    animation: "slideUp 0.5s ease-out"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1.5rem"
  },
  headerContent: {
    flex: 1
  },
  title: {
    fontSize: "2.25rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
    color: "#1e293b",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
    margin: 0
  },
  stats: {
    display: "flex",
    gap: "1.5rem"
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1rem 1.5rem",
    background: "#f8fafc",
    borderRadius: "12px",
    minWidth: "80px"
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#667eea"
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginTop: "0.25rem"
  },
  message: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#dbeafe",
    color: "#1e40af",
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    marginBottom: "2rem",
    fontWeight: "500"
  },
  messageIcon: {
    fontSize: "1.1rem"
  },
  searchSection: {
    marginBottom: "2.5rem"
  },
  searchContainer: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  searchInputContainer: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center"
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    fontSize: "1.1rem",
    color: "#94a3b8"
  },
  searchInput: {
    width: "100%",
    padding: "1rem 1rem 1rem 3rem",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#fff"
  },
  clearButton: {
    position: "absolute",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "0.25rem"
  },
  searchButton: {
    padding: "1rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minWidth: "120px"
  },
  searchButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  section: {
    marginBottom: "2rem"
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 1rem 0",
    color: "#1e293b"
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem"
  },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1.5px solid #e2e8f0"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
    fontSize: "1.1rem"
  },
  userDetails: {
    display: "flex",
    flexDirection: "column"
  },
  username: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem"
  },
  email: {
    fontSize: "0.875rem",
    color: "#64748b"
  },
  addButton: {
    padding: "0.5rem 1rem",
    border: "1.5px solid #667eea",
    background: "transparent",
    color: "#667eea",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  tabs: {
    display: "flex",
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "0.25rem",
    marginBottom: "2rem"
  },
  tab: {
    flex: 1,
    padding: "0.875rem 1rem",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#64748b"
  },
  tabActive: {
    background: "white",
    color: "#667eea",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
  },
  tabContent: {
    minHeight: "200px"
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "3rem",
    color: "#64748b"
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem 2rem",
    color: "#64748b"
  },
  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem"
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 0.5rem 0",
    color: "#475569"
  },
  emptyText: {
    margin: 0,
    fontSize: "1rem"
  },
  friendsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem"
  },
  friendCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem",
    background: "#f0fdf4",
    borderRadius: "12px",
    border: "1.5px solid #bbf7d0"
  },
  friendInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  friendDetails: {
    display: "flex",
    flexDirection: "column"
  },
  friendName: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem"
  },
  friendStatus: {
    fontSize: "0.875rem",
    color: "#16a34a"
  },
  removeButton: {
    padding: "0.5rem 1rem",
    border: "1.5px solid #ef4444",
    background: "transparent",
    color: "#ef4444",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  requestsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  requestCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.25rem",
    background: "#fffbeb",
    borderRadius: "12px",
    border: "1.5px solid #fde68a"
  },
  requestInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  requestDetails: {
    display: "flex",
    flexDirection: "column"
  },
  requestName: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "0.25rem"
  },
  requestText: {
    fontSize: "0.875rem",
    color: "#d97706"
  },
  requestActions: {
    display: "flex",
    gap: "0.75rem"
  },
  acceptButton: {
    padding: "0.5rem 1rem",
    border: "1.5px solid #16a34a",
    background: "transparent",
    color: "#16a34a",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  rejectButton: {
    padding: "0.5rem 1rem",
    border: "1.5px solid #dc2626",
    background: "transparent",
    color: "#dc2626",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

// Add CSS animations
// const styleSheet = document.styleSheets[0];
const keyframes = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .card {
      padding: 1.5rem;
      border-radius: 16px;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .stats {
      align-self: stretch;
      justify-content: space-around;
    }
    
    .search-container {
      flex-direction: column;
    }
    
    .search-button {
      width: 100%;
    }
    
    .results-grid,
    .friends-grid {
      grid-template-columns: 1fr;
    }
    
    .user-card,
    .friend-card,
    .request-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .request-actions {
      align-self: stretch;
      justify-content: stretch;
    }
    
    .request-actions button {
      flex: 1;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1rem 0.75rem;
    }
    
    .card {
      padding: 1.25rem;
      border-radius: 12px;
    }
    
    .title {
      font-size: 1.75rem;
    }
    
    .user-info,
    .friend-info,
    .request-info {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    
    .avatar {
      align-self: center;
    }
  }

  /* Enhanced Interactions */
  .card input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .card button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  .add-button:hover {
    background: #667eea;
    color: white;
  }

  .accept-button:hover {
    background: #16a34a;
    color: white;
  }

  .reject-button:hover {
    background: #dc2626;
    color: white;
  }

  .remove-button:hover {
    background: #ef4444;
    color: white;
  }

  .clear-button:hover {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .user-card:hover,
  .friend-card:hover,
  .request-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

// Inject styles
const style = document.createElement('style');
style.textContent = keyframes;
document.head.appendChild(style);