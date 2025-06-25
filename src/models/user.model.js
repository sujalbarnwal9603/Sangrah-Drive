import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    fullName:{
        type: String,
        required: true,
        trim: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        index:true,
        trim: true,
        lowercase: true,
    },
    avatar:{
        type: String, // Cloudinary URL
    },
    password:{
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken:{
        type: String,
        required: false,
    },
},
{
    timestamps: true,
}
)


export const User= mongoose.model("User",userSchema);