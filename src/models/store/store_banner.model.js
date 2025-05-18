import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// import  {Comment}  from "./comment.model.js";

const store_bannerSchema = new Schema({
    
   title: {
        type: String,
        required: true,
        trim: true,
        index: true, //index for each store and searching
        //if we use unique across alll the store

    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreateStore",  // Assuming you have a Store model
      required: true
  },

//    titleSize: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//     titleColor: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//    titleBackground: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}

//     },
description: {
        type: String,
        required: true,
        trim: true,
        
    },

    addbutton:{
        type:Boolean,
    },

      buttontextcolor:{
        type:String,
        required: function() { return this.addbutton}
      }
     ,

     buttontexthover:{
        type:String,
     },

     
    buttoncolor:{
        type:String, 
        required: function() { return this.addbutton}
    },
     buttoncolorhover:{
         type:String

     },



    // discriptionSize: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     required: function() { return this.smallheadingText}
    // },
    // discriptionColor: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     required: function() { return this.smallheadingText}
    // },
    // discriptionBackgroundcolor: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     required: function() { return this.smallheadingText}
    // },

    // buttonText:{
    // type:String,
    // required:true,

    // },

    // buttonTextColor: { type: String,
    //      default: "black"
    //  },
    // buttonHoverTextColor: { type: String 
    //     ,default: "White"  
    // },
    // buttonBackground: { type: String,
    //      default: "red"
    //  },
    // buttonHoverBackground: { type: String,
    //      default:"darkred"
    //  },
    
    // buttonshadow:{
    //       type:Boolean,
          
    //     },

    //     buttonshadowColor:{
    //       type:String,
    //       default:"grey",
    //       required: function() { return this.buttonshadow; }
    //     },

    //     buttonborder:{
    //         type:Boolean,
    //          default: "black"
    //       },

    //       buttonborderColor:{
    //         type:String,
    //         required: function() { return this.buttonborder; } 
    //       },

    //       buttonborderSize:{
    //           type:Number,
    //           required: function() { return this.buttonborder; }
    //       },

    // product: {
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    // owner: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true
    // },
    // Imagetype: {
    //     type: String,   //cloudnary url
    //     required: true
    // },

    // sideImage: {
    //     type: String,   //cloudnary url
    //     required: true
    // },

    // fullImage: {
    //     type: String,   //cloudnary url
    //     required: true
    // },


    //   layout: { 
    //     type: String, 
    //     enum: ["left-image", "right-image", "full-image"], 
    //     default: "full-image"
    //   },

    //   ImageAlt: { 
    //     type: String, 
    //     required: true, 
    //     default: "Banner Background" 
    //   },

    //   targetUrl: { type: String, required: true },



      bannerImage: {
        type: String,   //cloudnary url
        required: true
    },
    // views: {
    //     type: Number,
    //     default: 0,
    // },
    // isPublished: {
    //     type: Boolean,
    //     default: true
    // },

    // animationType: { type: String, enum: ["none", "fade", "slide"], default: "none" },

    // animationDuration: { type: Number, default: 0.5 }, // Seconds
    // animationDelay: { type: Number, default: 0 },
    
    
      // Typography
    //   fontFamily: { 
    //     type: [String], // Allow multiple fonts (e.g., ["Roboto", "Arial"]
    //     default: ["Arial"] 
    //   },



    //    clickCount: { type: Number, default: 0 }
    
}, { timestamps: true })




  store_bannerSchema.plugin(mongooseAggregatePaginate)

// Text indexes for search
// store_bannerSchema.index({ 
//     title: "text", 
//     description: "text", 
//     product: "text" 
// });
  
// Add regular indexes for common queries
// store_bannerSchema.index({ product: 1 });
store_bannerSchema.index({ store: 1, title: 1 }, { unique: true,
  collation: { locale: 'en', strength: 2 } //case senstive
 });
// store_bannerSchema.index({ store: 1, title: 1 }, { unique: true });
// cardSchema.index({ category: 1 });
// store_bannerSchema.index({ averageRating: -1 });
// store_bannerSchema.index({ totalViews: -1 });
// store_bannerSchema.index({ isPublished: 1 });

export default mongoose.model("Store_Banner", store_bannerSchema)