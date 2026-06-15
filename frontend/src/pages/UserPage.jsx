import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "../style/Main.css";


const socket = io("http://localhost:3000", {
  withCredentials: true,
  autoConnect: true
});

const Main = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // 1. Handle initial setup (Fetch users and register socket)
  useEffect(() => {
    if (currentUser?._id) {
      fetchUsers();
      socket.emit("addUser", currentUser._id);
    }
  }, []);

  // 2. Separate Socket Listener tracking active user changes cleanly
  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      // Append the message if it comes from the currently opened chat window
      if (selectedUser && message.sender === selectedUser._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [selectedUser]);

  // 3. Auto-scroll mechanism
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/user/all", {
        withCredentials: true,
      });
      const filteredUsers = res.data.users.filter((u) => u._id !== currentUser._id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/message/${currentUser._id}/${user._id}`,
        { withCredentials: true }
      );
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Error pulling history:", err);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;

    const messageData = {
      sender: currentUser._id,
      receiver: selectedUser._id,
      text: text.trim(),
    };

    try {
      // Optimistically emit socket first for real-time responsiveness
      socket.emit("sendMessage", messageData);
      setMessages((prev) => [...prev, messageData]);
      setText("");

      await axios.post(
        "http://localhost:3000/api/message/send",
        messageData,
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to sync message state to db:", err);
    }
  };

  return (
    <div className="main-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>{currentUser?.username || "Chat App"}</h2>
        </div>
        <div className="users">
          {users.map((user) => (
            <div
              key={user._id}
              className={`user-card ${selectedUser?._id === user._id ? "active" : ""}`}
              onClick={() => selectUser(user)}
            >
              <div className="avatar">
                {user.username ? user.username[0].toUpperCase() : "?"}
              </div>
              <h4>{user.username}</h4>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-section">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>{selectedUser.username}</h3>
            </div>

            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === currentUser._id ? "sent" : "received"}`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={bottomRef}></div>
            </div>

            <div className="input-container">
              <input
                type="text"
                value={text}
                placeholder="Type message..."
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="empty-chat">Select a user to begin chatting</div>
        )}
      </div>
    </div>
  );
};

export default Main;