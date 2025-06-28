import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'

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

const logoutUser=asyncHandler(async(req,res)=>{
    // req.user._id   //it's bcz aut middleware

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }


    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"Logout Successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(400,"Invalid refresh Token")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newrefreshToken,options)
            .json(new ApiResponse(200,{accessToken,newrefreshToken},"Access Token refreshed"))
            
    } catch (error) {
        throw new ApiError(400,error?.message||"Invalid refresh Token")
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {newPassword, oldPassword}=req.body;

    if([newPassword,oldPassword].some(
        (field)=>field.trim()===""
    )){
        throw new ApiError(400,"All fields are required")
    }

    const user= await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400,"User not found");
    }

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Password is incorrect")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
        .status(200)
        .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

const updateName=asyncHandler(async(req,res)=>{
    const {fullName}=req.body;

    if(!fullName){
        throw new ApiError("All fields are required");
    }

    const user=await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(400,"User not found")
    }

    user.fullName=fullName
    await user.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(new ApiResponse(200,{},"Details has been activated"))

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.files?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}.select("-password")
    )

    return res
        .status(200)
        .json(new ApiResponse(200,avatar,"Avatar Updated successfully"))

})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateName,
    updateUserAvatar
}