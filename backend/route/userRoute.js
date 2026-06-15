import {register,login} from "../controller/userController.js";
import {allUsers} from "../controller/userController.js";
import auth from "../helper/userAuth.js";
import express from "express";
const router = express.Router();
import rateLimit from "express-rate-limit";
const loginlimit = rateLimit({
    windowMs:15 * 60 * 1000,
    max:5,
    message:"Too many requests,please try again after some time"
});

router.post("/register", register);
router.post("/all", auth,allUsers);
router.post("/login", loginlimit,login);

export default router;