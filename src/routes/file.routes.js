import {
    uploadFile,
    getAllFiles,
    getFileById,
    deleteFiles,
    shareFiles,
    getSharedFiles,
    getFavoriteFiles
} from "../controllers/file.controller.js"
import { Router } from "express"
import upload from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router=Router()

// Upload files (authenticated + multer)

router.route("/upload").post(
    verifyJWT,
    upload.fields([{name:"file",maxCount:10}]),
    uploadFile
)

// Get all files owned by user (paginated)
router.route("/").get(verifyJWT,getAllFiles)

// Get a single file (owned or shared)
router.route("/:fileId").get(verifyJWT,getFileById);


// Delete file (only owner)
router.route("/:fileId").delete(verifyJWT,deleteFiles)

// Share file with another user
router.route("/share/:fileId").post(verifyJWT,shareFiles);

// Get files shared with user
router.route("/shared/files").get(verifyJWT, getSharedFiles)

// Get favorite files (owned/shared)
router.route("/favorites").get(verifyJWT, getFavoriteFiles);

export default router;