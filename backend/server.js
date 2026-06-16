import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";


import Message from "./models/Message.js";
import userRoute from "./route/userRoute.js";
import messageRoute from "./routes/messageRoutes.js";



dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
// INCREASE PAYLOAD LIMITS FOR BASE64 STRINGS
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    })
);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

let onlineUsers = new Map();

app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);

app.get("/", (req, res) => {
  res.send("Velo Chat Backend Running");
});

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("Connected to MongoDB");
    server.listen(process.env.PORT || 3000, () => {
        console.log("Server running on port " + (process.env.PORT || 3000));
        console.log("CLIENT_URL =", process.env.CLIENT_URL);
    });
})
.catch((err) => {
    console.log(err);
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("addUser", (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit("getUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("send_message", async (data) => {
        try {
            const { senderId, receiverId, text, image } = data;

            if (!senderId || !receiverId || (!text?.trim() && !image)) {
                return console.log("Invalid data payload");
            }

            let uploadedImages = [];

            // WHATSAPP MEDIA STRUCTURING
            if (image) {
                // Sort IDs to ensure the folder path is identical regardless of who sends the message
                const conversationFolder = [senderId, receiverId].sort().join("_");
                
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: `whatsapp_media/chats/${conversationFolder}`,
                });
                uploadedImages.push(uploadResponse.secure_url);
            }

            const message = await Message.create({
                sender: senderId,
                receiver: receiverId,
                text: text ? text.trim() : "",
                images: uploadedImages
            });

            // TARGETED SOCKET DELIVERIES
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", message);
            }
            socket.emit("receive_message", message);

        } catch (err) {
            console.log("Error handling send_message:", err);
        }
    });

    socket.on("delete_message", async (data) => {
        try {
            const { messageId, receiverId } = data;
            if (!messageId) return console.log("Invalid data");

            const message = await Message.findById(messageId);
            if (!message) return;

            // Remove assets from Cloudinary directory before deleting document
            if (message.images && message.images.length > 0) {
                for (const imgUrl of message.images) {
                    const urlParts = imgUrl.split('/upload/');
                    if (urlParts.length > 1) {
                        const publicId = urlParts[1].split('/').slice(1).join('/').split('.')[0];
                        await cloudinary.uploader.destroy(publicId).catch(() => {});
                    }
                }
            }

            await Message.findByIdAndDelete(messageId);
            
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("message_deleted", { messageId });
            }
            socket.emit("message_deleted", { messageId });
        } catch (err) {
            console.log("Error handling delete_message:", err);
        }
    });

    socket.on("edit_message", async (data) => {
        try {
            const { messageId, newText, receiverId } = data;
            if (!messageId || !newText?.trim()) return console.log("Invalid data");

            await Message.findByIdAndUpdate(
                messageId,
                { text: newText.trim(), isEdited: true }
            );

            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("message_edited", { messageId, newText });
            }
            socket.emit("message_edited", { messageId, newText });
        } catch (err) {
            console.log("Error handling edit_message:", err);
        }
    });

    socket.on("disconnect", () => {
        for (let [userId, socketId] of onlineUsers) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit("getUsers", Array.from(onlineUsers.keys()));
        console.log("Disconnected:", socket.id);
    });
});