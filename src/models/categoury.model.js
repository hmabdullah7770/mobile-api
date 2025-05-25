import mongoose, { Schema } from "mongoose";

const categourySchema = new Schema({
  
categouryname: {
    type: String,
    required: true
},

}, { timestamps: true })


export default mongoose.model("Categoury", categourySchema)