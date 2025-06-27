import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next(); //it will save the password 
    this.password=await bcrypt.hash(this.password,10); //run only on password changes
    next();
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User= mongoose.model("User",userSchema);