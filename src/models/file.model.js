import mongoose, {Schema} from "mongoose";

const fileSchema= new Schema({
    name:{
        type:String,
        required: true,
    },
    path:{
        type: String,
        required: true, // Path to the file in Cloudinary
    },
    size:{
        type: Number,
        required: true, // Size of the file in bytes
    },
    type:{
        type: String,
        required: true, // Type of the file (e.g., image, video, document)
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
    isFavorite:{
        type: Boolean,
        default: false, // Whether the file is marked as favorite
    },
    sharedWith:[ // Array of users with whom the file is shared
        {
            user:{
                type:Schema.Types.ObjectId,
                ref:"User", // Reference to the User model
            },
            permission:{
                type: String, // Permission type (e.g., read, write)
                enum: ["read", "write"], // Only allow read or write permissions
                default: "read", // Default permission is read
            }
        }
    ],
},{timestamps: true});

export const File =mongoose.model("File",fileSchema);