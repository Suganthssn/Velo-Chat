import React, { useState } from 'react';
import axios from "axios";
import '../style/Register.css';

const Register = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => { 
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/register`, {
                username,
                password
            });
            console.log(res.data);
        } catch (error) {
            console.error("Error registering user:", error);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2>Create Account</h2>
                <p>Join us today! Please fill in your details below.</p>
                
                <form onSubmit={handleSubmit} className="register-form">
                    <div className="input-group">
                        <label htmlFor="reg-username">Username</label>
                        <input
                            id="reg-username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="submit-btn">Register</button>
                </form>
            </div>
        </div>
    );
}

export default Register;