import { useState, useEffect } from "react";
import api from "../api";

export default function Friends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");

  // 🔍 Search users
  const searchUsers = async () => {
    try {
      const { data } = await api.get(`/friends/search?q=${query}`);
      setResults(data);
    } catch {
      setMessage("Search failed ❌");
    }
  };

  // ➕ Send friend request
  const addFriend = async (friendId) => {
    try {
      await api.post(`/friends/add/${friendId}`);
      setMessage("Friend request sent ✅");
      searchUsers();
    } catch {
      setMessage("Request failed ❌");
    }
  };

  // 👥 Load current friends
  const fetchFriends = async () => {
    try {
      const { data } = await api.get("/friends");
      setFriends(data.filter((f) => f.status === "accepted"));
      setRequests(data.filter((f) => f.status === "pending"));
    } catch {
      setMessage("Could not load friends ❌");
    }
  };

  // ✅ Accept request
  const acceptFriend = async (userId) => {
    try {
      await api.put(`/friends/accept/${userId}`);
      fetchFriends();
    } catch {
      setMessage("Failed to accept ❌");
    }
  };

  // ❌ Reject request
  const rejectFriend = async (userId) => {
    try {
      await api.put(`/friends/reject/${userId}`);
      fetchFriends();
    } catch {
      setMessage("Failed to reject ❌");
    }
  };

  // ❌ Remove friend
  const removeFriend = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await api.delete(`/friends/remove/${userId}`);
      setMessage("Friend removed ❌");
      fetchFriends();
    } catch {
      setMessage("Failed to remove friend ❌");
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "1rem",
            color: "#333",
          }}
        >
          👥 Friends
        </h2>

        {message && (
          <div
            style={{
              background: "#e0f2fe",
              color: "#0369a1",
              padding: "0.75rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {message}
          </div>
        )}

        {/* Search */}
        <div
          style={{
            display: "flex",
            marginBottom: "1.5rem",
            gap: "0.5rem",
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search by username"
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none",
              fontSize: "1rem",
            }}
          />
          <button
            onClick={searchUsers}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              background: "#667eea",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              Results
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {results.map((u) => (
                <li
                  key={u.user_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f9fafb",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>
                    <strong>{u.username}</strong>{" "}
                    <span style={{ color: "#666" }}>({u.email})</span>
                  </span>
                  <button
                    onClick={() => addFriend(u.user_id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ➕ Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pending Requests */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Friend Requests
          </h3>
          {requests.length === 0 && (
            <p style={{ color: "#666" }}>No pending requests</p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {requests.map((r) => (
              <li
                key={r.user_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff7ed",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                }}
              >
                <span>
                  <strong>{r.username}</strong>{" "}
                  <span style={{ color: "#666" }}>(pending)</span>
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => acceptFriend(r.user_id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => rejectFriend(r.user_id)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Accepted Friends */}
        <div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Your Friends
          </h3>
          {friends.length === 0 && (
            <p style={{ color: "#666" }}>No friends yet</p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {friends.map((f) => (
              <li
                key={f.user_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ecfdf5",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                }}
              >
                <span>{f.username}</span>
                <button
                  onClick={() => removeFriend(f.user_id)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ❌ Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
