import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// import  {Comment}  from "./comment.model.js";

const threeDvideoSchema = new Schema({
    
 // Store information
 storeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "CreateStore",
  required: true
},


    threedvideo: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

   productname:{
    type: String
   }
   ,

   logo:{
    type: String
   },

    category: {
        type: String,
        required: true,
        trim: true
    },



    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    


    animationType: { type: String, enum: ["none", "fade", "slide"], default: "none" },

    animationDuration: { type: Number, default: 0.5 }, // Seconds
    animationDelay: { type: Number, default: 0 },
    
    
      // Typography
      fontFamily: { 
        type: [String], // Allow multiple fonts (e.g., ["Roboto", "Arial"]
        default: ["Arial"] 
      },



       clickCount: { type: Number, default: 0 }
    
}, { timestamps: true })



threeDvideoSchema.plugin(mongooseAggregatePaginate)

// Fix text index - use fields that actually exist in the schema
threeDvideoSchema.index({ 
    threedvideo: "text", 
    productname: "text", 
    category: "text" 
});

// Add regular indexes for common queries
threeDvideoSchema.index({ category: 1 });
threeDvideoSchema.index({ storeId: 1 });
threeDvideoSchema.index({ owner: 1 });

export default mongoose.model("ThreeDvideo", threeDvideoSchema)