import { useEffect, useState } from "react";
import api from "../api";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await api.get("/friends/requests");
    setRequests(data);
  };

  const handleAction = async (id, action) => {
    await api.put(`/friends/${action}/${id}`);
    fetchRequests();
  };

  return (
    <div>
      <h2>Friend Requests</h2>
      {requests.length === 0 && <p>No pending requests</p>}
      {requests.map(req => (
        <div key={req.request_id}>
          <span>{req.sender_username}</span>
          <button onClick={() => handleAction(req.request_id, "accept")}>Accept</button>
          <button onClick={() => handleAction(req.request_id, "reject")}>Reject</button>
        </div>
      ))}
    </div>
  );
}
