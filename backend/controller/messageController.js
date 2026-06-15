import Message from '../models/Message.js';
import { v2 as cloudinary } from 'cloudinary';

export const getMessages = async (req, res, next) => {
    try {
        const { senderId, receiverId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// TARGET SPECIFIC MESSAGE ID FOR DELETIONS
export const deleteMessages = async (req, res, next) => {
    try {
        const senderId = req.user._id;
        const { messageId } = req.params; 

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (String(message.sender) !== String(senderId)) {
            return res.status(403).json({ success: false, message: "Unauthorized operation" });
        }

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
        res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// TARGET SPECIFIC MESSAGE ID FOR EDITS
export const editMessage = async (req, res, next) => {
    try {
        const senderId = req.user._id;
        const { messageId } = req.params; 
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ success: false, message: "Text content cannot be empty" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (String(message.sender) !== String(senderId)) {
            return res.status(403).json({ success: false, message: "Unauthorized operation" });
        }

        message.text = text.trim();
        message.isEdited = true;
        await message.save();

        res.status(200).json({ success: true, message });
    } catch (err) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};