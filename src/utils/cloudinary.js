import { v2 as cloudinary } from "cloudinary";
import fs from "fs"  //filesystem

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        //upload on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
        })
        //file has been uploaded successfully
        console.log("File is uploaded on cloudinary", response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved the temporary file as the upload operation got failed
        return null
    }
}

const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type,
        });
        console.log("🗑️ File deleted from Cloudinary:", public_id);
        return result;
    } catch (error) {
        console.log("delete on cloudinary failed", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };