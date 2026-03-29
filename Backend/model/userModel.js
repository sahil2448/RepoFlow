import mongoose from "mongoose";
import {Schema} from mongoose;

const UserSchema = new Schema({

    username : {
        type:String,
        required:true,
        unique:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },
    passowrd:{
        tyoe:String
    },

    repositories : [
        {
            default:[],
            type:Schema.Types.ObjectId,
            ref:"Repository"
        }
    ],
    followedUsers : [
        {
            default:[],
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    starRepositories : [
        {
            default:[],
            type:Schema.Types.ObjectId,
            ref:"Repository"
        }
    ]
})


const User = mongoose.model("User",UserSchema)

export default User