import { Router } from "express";
import { registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateName,
        updateUserAvatar } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
    ])
    ,registerUser
);

router.route("/login").post(loginUser)


//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

// protected routes(require login)

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/me").get(verifyJWT, getCurrentUser)

router.route("/update-name").patch(verifyJWT,updateName)

router.route("/update-avatar").patch(
    verifyJWT,
    upload.fields([{name:"avatar", maxCount:1}]),
    updateUserAvatar
)


export default router;