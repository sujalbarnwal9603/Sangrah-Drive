import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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


export {
    registerUser
}