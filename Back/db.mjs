import { config } from "dotenv";
config();
import mongoose from 'mongoose';

const dbConnection = mongoose
    .connect(process.env.MONGO_URI, {
    })
    .then(() => console.log('MongoDB database Connected Adam...'))
    .catch((err) => console.log(err))
