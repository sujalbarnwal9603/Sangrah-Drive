import multer from "multer";
import path from "path";

const storage=multer.diskStorage({
    destination:function (req,file,cb){
        cb(null, './public/temp')
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

const upload = multer({
  storage,
  limits: { fileSize: 90 * 1024 * 1024 }, // Optional: 90MB max per file
});

export const uploadFiles = upload.fields([{ name: "file", maxCount: 10 }]);