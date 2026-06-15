import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[6,"Password must be at least 6 characters long"] 
    }
},{timestamps:true});


UserSchema.pre('save',async function(){
    if(!this.isModified('password')){
        return;
    }
    const hashedPassword = await bcrypt.hash(this.password,10);
    this.password = hashedPassword;
});

UserSchema.methods.getJWTToken = function(){
    return jwt.sign({id:this._id,username:this.username},process.env.JWT_SECREAT,{
        expiresIn:process.env.JWT_EXPIRE
    })
}
export default mongoose.model("User",UserSchema); 
