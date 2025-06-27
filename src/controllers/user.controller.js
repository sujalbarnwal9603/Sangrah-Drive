import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
       await user.save({validateBeforeSave:false})

       return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while genrating refresh or access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    if ([fullName, email, password].some(
        (field) => (field.trim() === "")
    )) {
        throw new ApiError(400, "All fields are necessary");
    }

    const userExit = await User.findOne({
        $or: [{ email }]
    })

    if (userExit) {
        throw new ApiError(400, "User already exist");
    }

    const avatarLocalPath = req.files.avatar[0]?.path;

    

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const user = await User.create({
        fullName,
        

        avatar: avatar.url||"",
        password,
        email
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!userCreated) {
        throw new ApiError(500, "User Registration Failed. Try again!!!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, userCreated, "User Registration Successfully"))


})

const loginUser=asyncHandler(async(req,res)=>{
    const {email, password}=req.body;

    if([email,password].some(
        (field)=>(field.trim()==="")
    )){
        throw new ApiError(400, "All fields are required");
    }

    const userExist=await User.findOne({
        $or:[{email}]
    })

    if(!userExist){
        throw new ApiError(400,"User not Exit. Register first")
    }

    const isPasswordCorrect=await userExist.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Password");
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(userExist._id)

    const loggedInUser=await User.findById(userExist._id).select("-password -refreshToken")
  
    const options={ // it allows to changeble through backend only not from frontend
        httpOnly:true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"Log In Successfully"))

})


export {
    registerUser
}