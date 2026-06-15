import React from "react";

const Sidebar = ({ currentUser, users, onlineUsers, selectedUser, onSelectUser }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="current-user-profile">
          <div className="avatar current-avatar">
            {currentUser?.username ? currentUser.username[0].toUpperCase() : "?"}
          </div>
          <div>
            <h2>{currentUser?.username}</h2>
            <span className="user-tag">My Account</span>
          </div>
        </div>
      </div>

      <div className="users-list-section">
        <p className="section-title">Direct Messages</p>
        <div className="users-stack">
          {users.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;

            return (
              <div
                key={user._id}
                className={`user-card ${isSelected ? "active" : ""}`}
                onClick={() => onSelectUser(user)}
              >
                <div className="avatar-wrapper">
                  <div className="avatar">
                    {user.username ? user.username[0].toUpperCase() : "?"}
                  </div>
                  <span className={`status-dot ${isOnline ? "online" : "offline"}`}></span>
                </div>

                <div className="user-card-info">
                  <h4>{user.username}</h4>
                  <small className="status-text">{isOnline ? "Active now" : "Offline"}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;