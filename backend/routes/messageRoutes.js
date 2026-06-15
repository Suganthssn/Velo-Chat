import express from 'express';
import {getMessages,deleteMessages} from "../controller/messageController.js";
const router= express.Router();
import auth from '../helper/userAuth.js';

router.get("/:senderId/:receiverId",auth,getMessages);
router.delete("/:senderId/:receiverId",auth,deleteMessages);
export default router;