import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// import  {Comment}  from "./comment.model.js";

const bannerSchema = new Schema({

    bannerImage:{
      type: String,
      required: true,

    },

    // bannerbutton:{
    //   type: String,
    //   required: true,

    // }

    owner:{
      type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    
    }
     ,
    store:{
       type: mongoose.Schema.Types.ObjectId,
         ref: "CreateStore",
        

    }
    
    // bigheadingText: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     index: true
    // },
    // bannerrank:{
    //  type:Number,
    //  required:true,
    // },

    // bigheadingSize: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     index: true,
    //     required: function() { return this.bigheadingText}
    // },
    // bigheadingColor: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     index: true,
    //     required: function() { return this.bigheadingText}
    // },
    // bigheadingBackground: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     index: true,
    //     required: function() { return this.bigheadingText}

    // },
    // smallheadingText: {
    //     type: String,
    //     // required: true,
    //     trim: true,
        
    // },

    // smallheadingSize: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     required: function() { return this.smallheadingText}
    // },
    // smallheadingColor: {
    //     type: String,
    //     // required: true,
    //     trim: true,
    //     required: function() { return this.smallheadingText}
    // },
    // smallheadingBackgroundcolor: {
    //     type: String,
    //     // required: true,
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

    // category: {
    //     type: String,
    //     required: true,
    //     trim: true
    // },
    // owner: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true
    // },
    // // Imagetype: {
    // //     type: String,   //cloudnary url
    // //     required: true
    // // },

    // // sideImage: {
    // //     type: String,   //cloudnary url
    // //     required: true
    // // },

    // // fullImage: {
    // //     type: String,   //cloudnary url
    // //     required: true
    // // },


    //   Image: { 
    //     type: String,
    //     required:true, 
    //     enum: ["left-image", "right-image", "full-image"], 
    //     default: "full-image"
    //   },

    //   ImageAlt: { 
    //     type: String, 
    //     required:true,
    //     required: true, 
    //     default: "Banner Background" 
    //   },

    //   targetUrl: { type: String, required: true },



    // BackgroundImage: {
    //     type: String,   //cloudnary url
    //     required: true
    // },
    // // views: {
    // //     type: Number,
    // //     default: 0,
    // // },
    // isPublished: {
    //     type: Boolean,
    //     default: true
    // },

    // animationType: { type: String, enum: ["none", "fade", "slide"], default: "none" },

    // animationDuration: { type: Number, default: 0.5 }, // Seconds
    // animationDelay: { type: Number, default: 0 },
    
    
    //   // Typography
    //   fontFamily: { 
    //     type: [String], // Allow multiple fonts (e.g., ["Roboto", "Arial"]
    //     default: ["Arial"] 
    //   },



    //    clickCount: { type: Number, default: 0 }
    // // // Social links - optional fields that can be included from user profile
    // // whatsapp: {
    // //     type: Number
    // // },
    // // storeLink: {
    // //     type: String
    // // },
    // // facebook: {
    // //     type: String
    // // },
    // // instagram: {
    // //     type: String
    // // },
    // // productlink: {
    // //     type: String

    // // }

    // //we provide 3D option too to banner

    // // },
    // // // Rating statistics
    // // totalRating: {
    // //     type: Number,
    // //     default: 0
    // // },
    // // ratingCount: {
    // //     type: Number,
    // //     default: 0
    // // },
    // // averageRating: {
    // //     type: Number,
    // //     default: 0
    // // },
    // // // View tracking
    // // totalViews: {
    // //     type: Number,
    // //     default: 0
    // // }
,createdAt: {
        type: Date,
        default: Date.now,
   index: { expires: 86400 } // Define TTL index here instead of using schema.index()
    }

}, { timestamps: true })


// // In card.model.js
// bannerSchema.static('findByIdAndDelete', async function(id) {
//     // First delete all comments associated with this card
//     await Comment.deleteMany({ contentId: id, contentType: "card" });
    
//     // Then delete the card
//     return this.findOneAndDelete({ _id: id });
//   });

  bannerSchema.plugin(mongooseAggregatePaginate)

// ✅ Fix (use actual fields from schema)
bannerSchema.index({ 
    bigheadingText: "text", 
    smallheadingText: "text", 
    category: "text" 
  });
  

// Add regular indexes for common queries
bannerSchema.index({ category: 1 });
// cardSchema.index({ category: 1 });
// bannerSchema.index({ averageRating: -1 });
// bannerSchema.index({ totalViews: -1 });

// bannerSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 86400 });

bannerSchema.index({ isPublished: 1 });

export default mongoose.model("Banner", bannerSchema)