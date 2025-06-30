import { File } from "../models/file.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

const uploadFile = asyncHandler(async (req, res) => {
    const { isFavorite } = req.body;
    const filesArray = req.files?.file;

    if (!filesArray || filesArray.length === 0) {
        throw new ApiError(400, "No files uploaded");
    }

    const uploadedFiles = [];

    for (let i = 0; i < filesArray.length; i++) {
        const fileLocalPath = filesArray[i]?.path;

        if (!fileLocalPath) continue;

        if (filesArray[i]?.size > 90 * 1024 * 1024) {
            throw new ApiError(400, "File size exceeds the limit of 90MB");
        }

        const cloudResult = await uploadOnCloudinary(fileLocalPath);

        if (!cloudResult) {
            throw new ApiError(400, "File is required");
        }

        const fileUpload = await File.create({
            isFavorite: isFavorite || false,
            file: cloudResult.url,
            path: cloudResult.public_id,
            type: filesArray[i]?.mimetype,
            size: filesArray[i]?.size,
            owner: req.user?._id
        });

        const FinalUpload = await File.findById(fileUpload._id);
        if (FinalUpload) uploadedFiles.push(FinalUpload);
    }

    if (uploadedFiles.length === 0) {
        throw new ApiError(500, "Something went wrong while uploading");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, uploadedFiles, "Files Uploaded Successfully"));
});

const getAllFiles = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "Invalid UserId");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filesAggregate = File.aggregate([
        { $match: { owner: userId } },
        { $sort: { createdAt: -1 } },
    ]);

    const files = await File.aggregatePaginate(filesAggregate, { page, limit });

    return res
        .status(200)
        .json(new ApiResponse(200, files, "Files fetched successfully"));
});

const getFileById = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    if (!isValidObjectId(fileId)) {
        throw new ApiError(400, "Invalid File Id");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid UserId");
    }

    const file = await File.findById(fileId);

    if (!file) {
        throw new ApiError(400, "File not found");
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isShared = file.sharedWith?.some(
        (shared) => shared.user?.toString() === req.user._id.toString()
    );

    if (!isOwner && !isShared) {
        throw new ApiError(400, "You are not authorized to access this file");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, file, "File fetched successfully"));
});

const deleteFiles = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    if (!isValidObjectId(fileId)) {
        throw new ApiError(400, "Invalid File ID");
    }

    const file = await File.findById(fileId);
    if (!file) {
        throw new ApiError(400, "File not found");
    }

    if (file.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "Only the owner can delete this file");
    }

    const fileDeleted = await File.findByIdAndDelete(file._id);
    if (!fileDeleted) {
        throw new ApiError(500, "Something went wrong while deleting the file");
    }

    await deleteOnCloudinary(file.path);

    return res
        .status(200)
        .json(new ApiResponse(200, fileDeleted, "File has been deleted successfully"));
});

const shareFiles = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { targetUserId, permission } = req.body;

    if (!isValidObjectId(fileId) || !isValidObjectId(targetUserId)) {
        throw new ApiError(400, "Invalid file ID or target user ID");
    }

    const file = await File.findById(fileId);
    if (!file) {
        throw new ApiError(400, "File not found");
    }

    if (file.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "Only the owner can share this file");
    }

    const isAlreadyShared = file.sharedWith.some(
        (share) => share.user.toString() === targetUserId
    );

    if (isAlreadyShared) {
        throw new ApiError(400, "File is already shared with this user");
    }

    file.sharedWith.push({
        user: targetUserId,
        permission: permission === "write" ? "write" : "read"
    });

    await file.save();

    return res
        .status(200)
        .json(new ApiResponse(200, file, "File shared successfully"));
});

const getSharedFiles = asyncHandler(async (req, res) => {
    const sharedFiles = await File.find({
        "sharedWith.user": req.user._id
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, sharedFiles, "Shared files fetched successfully"));
});

const getFavoriteFiles = asyncHandler(async (req, res) => {
    const favoriteFiles = await File.find({
        isFavorite: true,
        $or: [
            { owner: req.user._id },
            { "sharedWith.user": req.user._id }
        ]
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, favoriteFiles, "Favorite files fetched successfully"));
});

export {
    uploadFile,
    getAllFiles,
    getFileById,
    deleteFiles,
    shareFiles,
    getSharedFiles,
    getFavoriteFiles
};
