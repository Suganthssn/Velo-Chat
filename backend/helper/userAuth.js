import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req,res,next)=>{
    try{
        const {token}= req.cookies;
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Login to access the page"
            })
        }

        const decodedData = jwt.verify(token,process.env.JWT_SECREAT);
        const user = await User.findById(decodedData.id);
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not found"
            })
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

export default auth;