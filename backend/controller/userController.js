import User from "../models/User.js";
import bcrypt from "bcrypt";

export const register = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username already exists"
            });
        }

    

        const newUser = await User.create({
            username,
            password, // Save the secure hash, never raw text!
        });

        const token = newUser.getJWTToken();

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // 2. Return the user payload so frontend can populate localStorage instantly
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                _id: newUser._id,
                username: newUser.username
            }
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {

            console.log("Login attempt with missing credentials:", { username, password });
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Explicitly selecting +password in case your Schema hides it by default
        const user = await User.findOne({ username }).select("+password");
       

        if (!user) {
            console.log(`Login attempt failed: User ${username} not found`);
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // 3. This will now evaluate to true because DB records are securely hashed
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`Comparing passwords for user ${username}:`, {
            inputPassword: password,
            storedHash: user.password,
            isValidPassword
        });
        
        
        if (!isValidPassword) {
            console.log(`Login attempt failed: Invalid password for user ${username}`);
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const token = user.getJWTToken();

         res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        console.log(`User ${username} logged in successfully`);
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            success: false,
            message: "Login failed: Internal server error"
        });
    }
};

export const allUsers = async (req, res, next) => {
    try {
        // req.user is populated automatically by your protect/verifyJWT middleware
        const currentUsername = req.user.username; 

        const users = await User.find({ username: { $ne: currentUsername } })
                                .select("-password");
        
        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};