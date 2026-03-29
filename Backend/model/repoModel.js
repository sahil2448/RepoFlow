import mongoose from "mongoose";
import { Schema } from mongoose;

const RepositorySchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
    },
    content:{
        type:String,
    },
    visibility:{
        type:Boolean
    },
    owner:{
        type:Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    issues:{
        type:Schema.Types.ObjectId,
        ref:"Repository"
    }
})

const Repository = mongoose.model("Repository",RepositorySchema)

export default Repository