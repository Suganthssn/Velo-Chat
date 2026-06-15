import React, { useEffect, useRef, useState } from "react";

import EmojiPicker from "emoji-picker-react";

const ChatWindow = ({ 
  selectedUser, 
  messages, 
  currentUser, 
  text, 
  setText, 
  image, 
  setImage, 
  onSendMessage,
  socket 
}) => {
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiMenuRef = useRef(null);

  // CONTEXT MENU & INLINE EDIT STATES
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetMessage: null });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  
  // EMOJI PICKER STATE
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click outside listener for both Context Menu AND Emoji Picker
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Close context menu
      setContextMenu((prev) => ({ ...prev, visible: false }));
      
      // Close emoji picker if clicking outside of its container
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };

    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleContextMenu = (e, msg) => {
    if (String(msg.sender) !== String(currentUser?._id) || msg._id === "temp-id") return;
    
    e.preventDefault(); 
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetMessage: msg
    });
  };

  const startEditing = () => {
    setEditingMessageId(contextMenu.targetMessage._id);
    setEditText(contextMenu.targetMessage.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    socket.emit("edit_message", {
      messageId: editingMessageId,
      newText: editText,
      receiverId: selectedUser._id
    });
    setEditingMessageId(null);
  };

  const deleteMsg = () => {
    if (!contextMenu.targetMessage) return;
    if (window.confirm("Delete this message?")) {
      socket.emit("delete_message", {
        messageId: contextMenu.targetMessage._id,
        receiverId: selectedUser._id
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for emoji-picker-react selection
  const onEmojiClick = (emojiData) => {
    setText((prevText) => prevText + emojiData.emoji);
  };

  if (!selectedUser) {
    return (
      <div className="chat-section empty">
        <div className="empty-chat-state">
          <div className="chat-icon-placeholder">💬</div>
          <h2>Your Workspace</h2>
          <p>Select a contact from the sidebar to start a real-time conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-section">
      <div className="chat-header">
        <div className="header-info">
          <div className="avatar header-avatar">
            {selectedUser.username ? selectedUser.username[0].toUpperCase() : "?"}
          </div>
          <div>
            <h3>{selectedUser.username}</h3>
            <span className="status-subtext">Active chat window</span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isMe = String(msg.sender) === String(currentUser?._id);
          const isEditing = editingMessageId === msg._id;

          return (
            <div 
              key={msg._id || index} 
              className={`message-wrapper ${isMe ? "sent" : "received"}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              {!isMe && (
                <div className="msg-avatar">
                  {selectedUser.username ? selectedUser.username[0].toUpperCase() : "?"}
                </div>
              )}
              <div className="message-bubble">
                {isEditing ? (
                  <div className="edit-box">
                    <input 
                      type="text" 
                      className="edit-bubble-input"
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                    <small>
                      <span onClick={saveEdit} style={{ cursor: "pointer", color: "green" }}>Save</span> •{" "}
                      <span onClick={() => setEditingMessageId(null)} style={{ cursor: "pointer" }}>Cancel</span>
                    </small>
                  </div>
                ) : (
                  <>
                    {msg.text && <p className="msg-text">{msg.text}</p>}
                    
                    {msg.images && msg.images.map((imgUrl, i) => (
                      <img 
                        key={i}
                        src={imgUrl} 
                        alt="Sent attachment" 
                        className="chat-image-attachment" 
                        style={{ maxWidth: "250px", borderRadius: "8px", display: "block", marginTop: "5px" }} 
                      />
                    ))}
                  </>
                )}
                <span className="msg-time">
                  {msg.isEdited && <span style={{ fontSize: '9px', opacity: 0.6 }}> (edited) • </span>}
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* Floating Context Dropdown */}
      {contextMenu.visible && (
        <div className="custom-context-menu" style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px`, position: "fixed" }}>
          <div className="menu-option" onClick={startEditing}>✏️ Edit</div>
          <div className="menu-option delete" onClick={deleteMsg}>🗑️ Delete</div>
        </div>
      )}

      {/* Image Upload Preview Bar */}
      {image && (
        <div className="image-preview-bar" style={{ padding: "10px", background: "#f0f0f0", display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="preview-container" style={{ position: "relative" }}>
            <img src={image} alt="Preview" style={{ height: "50px", borderRadius: "4px" }} />
            <button className="remove-preview" onClick={() => setImage(null)} style={{ position: "absolute", top: "-5px", right: "-5px", background: "red", color: "white", border: "none", borderRadius: "50%", cursor: "pointer" }}>×</button>
          </div>
        </div>
      )}

      <div className="input-container" style={{ position: "relative" }}>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleImageChange}
        />
        
        <button className="icon-btn" onClick={() => fileInputRef.current.click()} title="Attach a Picture">
          📷
        </button>

        {/* Emoji Trigger and Wrapper */}
        <div ref={emojiMenuRef} style={{ display: "inline-block", position: "relative" }}>
          <button 
            className="icon-btn" 
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Prevents instant closing via window listener
              setShowEmojiPicker(!showEmojiPicker);
            }} 
            title="Insert Emoji"
          >
            😀
          </button>

          {showEmojiPicker && (
            <div className="emoji-picker-container" style={{
              position: "absolute",
              bottom: "45px",
              left: "0",
              zIndex: 100
            }}>
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                autoFocusSearch={false}
                skinTonesDisabled
                width={300}
                height={400}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          className="chat-input"
          placeholder={`Message @${selectedUser.username}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSendMessage();
          }}
        />
        <button className="send-btn" onClick={onSendMessage} disabled={!text.trim() && !image}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;