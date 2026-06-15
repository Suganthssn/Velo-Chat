import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
{
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    text:{
        type:String,
        default:""
    },

    seen:{
        type:Boolean,
        default:false
    },

    images:{
        type:[String],
        default:[]
    },
    isEdited:{
        type:Boolean,
        default:false
    }

},{timestamps:true});

export default mongoose.model("Message",MessageSchema);