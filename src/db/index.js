import { DB_NAME } from "../constants.js";
import mongoose from 'mongoose';

export const DB_CONNECTTION = async () => {
    try {
        const connectioninstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log('DB Connected Succssfully having host :', connectioninstance.connection.host)

    } catch (error) {

        console.log('ERROR :', error)
        process.exit(1)

    }


}
