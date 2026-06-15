import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import "../style/Main.css";

const socket = io("http://localhost:3000", {
  withCredentials: true,
  autoConnect: true,
});

const Main = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null); // Managed image selection state

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!currentUser?._id) return;
    socket.emit("addUser", currentUser._id);
    fetchUsers();
  }, []);

  useEffect(() => {
    socket.on("getUsers", (usersList) => {
      setOnlineUsers(usersList);
    });
    return () => {
      socket.off("getUsers");
    };
  }, []);

  useEffect(() => {
    socket.on("receive_message", (message) => {
      if (
        (selectedUser && String(message.sender) === String(selectedUser._id)) ||
        String(message.sender) === String(currentUser?._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          const cleanPrev = prev.filter((m) => m._id !== "temp-id");
          return [...cleanPrev, message];
        });
      }
    });

    socket.on("message_edited", ({ messageId, newText }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, text: newText, isEdited: true } : msg
        )
      );
    });

    socket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
    };
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/user/all",
        {},
        { withCredentials: true }
      );
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/message/${currentUser._id}/${user._id}`,
        { withCredentials: true }
      );
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = () => {
    if (!selectedUser || (!text.trim() && !image)) return;

    const messageData = {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      text: text.trim(),
      image: image // Sends Base64 string payload over WebSocket
    };

    setMessages((prev) => [
      ...prev,
      {
        _id: "temp-id",
        sender: currentUser._id,
        receiver: selectedUser._id,
        text: text.trim(),
        images: image ? [image] : [],
        createdAt: new Date(),
      },
    ]);

    socket.emit("send_message", messageData);
    setText("");
    setImage(null);
  };

  return (
    <div className="main-container">
      <Sidebar
        currentUser={currentUser}
        users={users}
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={messages}
        currentUser={currentUser}
        text={text}
        setText={setText}
        image={image}
        setImage={setImage}
        onSendMessage={handleSendMessage}
        socket={socket}
      />
    </div>
  );
};

export default Main;