// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// // import  {Comment}  from "./comment.model.js";

// const discountsgiveawaysSchema = new Schema(
//   {

//     //likes{}


//     originalPrice: {
//       type: String,
//       required: true,
//       trim: true,
//       index: true,
//     },
//     discountPrice: {
//       type: String,
//       // required: true,
//       trim: true,
//     },
//     discountPercentage: {
//       type: String,
//       //    required:true,
//     },

//     giveaway: {
//       type: Boolean,
//     },

//     giveawaychallange: {
//       type: String,
//     },

//     category: {
//       type: String,
//       required: true,
//       trim: true,
//       index: true,
//     },
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     Image: {
//       type: String, //cloudnary url
//     //   required: true,
//     },

//      Video:{
//            type:String //cloudnary url
//      },

//     // views: {
//     //     type: Number,
//     //     default: 0,
//     // },
//     isPublished: {
//       type: Boolean,
//       default: true,
//     },
//     // Social links - optional fields that can be included from user profile
//     whatsapp: {
//       type: Number,
//     },
//     storeLink: {
//       type: String,
//     },
//     facebook: {
//       type: String,
//     },
//     instagram: {
//       type: String,
//     },
//     productlink: {
//       type: String,
//     },

//     //we provide 3D option too to banner

//     // },
//     // // Rating statistics
//     // totalRating: {
//     //     type: Number,
//     //     default: 0
//     // },
//     // ratingCount: {
//     //     type: Number,
//     //     default: 0
//     // },
//     // averageRating: {
//     //     type: Number,
//     //     default: 0
//     // },
//     // // View tracking
//     // totalViews: {
//     //     type: Number,
//     //     default: 0
//     // }
//   },
//   { timestamps: true }
// );

// // // In card.model.js
// // discountsgiveawaysSchema.static('findByIdAndDelete', async function(id) {
// //     // First delete all comments associated with this card
// //     await Comment.deleteMany({ contentId: id, contentType: "card" });

// //     // Then delete the card
// //     return this.findOneAndDelete({ _id: id });
// //   });

// discountsgiveawaysSchema.plugin(mongooseAggregatePaginate);


// // ✅ Fix (use actual fields from schema)
// discountsgiveawaysSchema.index({ 
//     originalPrice: "text", 
//     giveawaychallange: "text", 
//     category: "text" 
//   });
  


// // Add regular indexes for common queries
// discountsgiveawaysSchema.index({ category: 1 });
// // cardSchema.index({ category: 1 });
// // discountsgiveawaysSchema.index({ averageRating: -1 });
// // discountsgiveawaysSchema.index({ totalViews: -1 });
// discountsgiveawaysSchema.index({ isPublished: 1 });

// export default mongoose.model("Banner", discountsgiveawaysSchema);
