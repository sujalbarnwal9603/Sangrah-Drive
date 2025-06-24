import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log("Connected at",process.env.port);
        
        
    } catch (error) {
        console.log("MongoDb Connection Error",error);
        process.exit(1)
        
        
    }
}

export default connectDB;