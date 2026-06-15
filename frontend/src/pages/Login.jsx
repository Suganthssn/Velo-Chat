import React, { useState } from "react";
import axios from "axios";
import '../style/Login.css'

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
  

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        try {
            const res = await axios.post("http://localhost:3000/api/user/login", {
                username,
                password
            }, {
                withCredentials: true
            });
            console.log("Success:", res.data);
          
            if(res.data.success){
                window.location.href = "/Home"; 
                localStorage.setItem("token", res.data.token); // Store token in localStorage
                localStorage.setItem("user", JSON.stringify(res.data.user)); // Store user info in localStorage
                alert("Login successful! Redirecting to the main page..."); // Show success message on successful login
            }
            else{
                alert("Login failed: " + res.data.message); // Show error message on failed login
            }
        } catch (err) {
            console.log("message :", err.message);
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Welcome Back</h2>
                <p>Please enter your details to sign in.</p>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            id="username"
                            type='text' 
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} // Fixed: passed 'e' and changed to onChange
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password"
                            type='password'
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} // Fixed: passed 'e' and changed to onChange
                            required
                        />
                    </div>

                    <button type='submit' className="submit-btn">Sign In</button>
                </form>
            </div>
        </div>
    );
}

export default Login;