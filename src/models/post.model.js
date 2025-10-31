//optimized code
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { NewComment } from "./newcomment.model.js";
import { type } from "os";

const postSchema = new Schema({
   

    //   store: {
    //     type: Boolean,
        
    //     default: false
    // },
    // storeUrl:{
    //     type: String,
    // },



    store: [{
            
         storeisActive: {
            type: Boolean,
            default: false
        },


        storeIconSize:{
          
            type: String,
            enum: ['L','S'],
            default: 'L'

        },

        storeId: {
            type: String ,
        },

        
       
         storeUrl:{
        type: String,
    },


         default:[]
    }],




    facebookurl:{
        type: String,
    }
,
    instagramurl:{
      type: String,
    }
 
    ,
    whatsappnumberurl:{
      type: String,
    },
    storelinkurl:{

       type: String,
    },
//    productId:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Store_Product",
//         // required: false
//     },

//    productUrl:{
//         type: String,
//    },



 product: [{
            
         productisActive: {
            type: Boolean,
            default: false
        },


        productIconSize:{
          
            type: String,
            enum: ['L','S'],
            default: 'S'

        },

        ProductId: {
            type: String ,
        },

        
       
         productUrl:{
        type: String,
    },


         default:[]
    }],



   videocount:{
        type: Number,
        default: 0
    },

   

   imagecount:{
        type: Number,
        default: 0
    },

audiocount:{
        type: Number,
        default: 0
       },

    title: {
        type: String,
        // required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        // required: true,
        trim: true
    },
    
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    // thumbnail: {
    //     type: String,
    //     // required: true
    // },

    imageFiles: [{
    url: {
        type: String,
        required: true
    },
    // size: {
    //     type: String,
    //     enum: ['L','S'],
    //     default: 'L'
    // }
    //      ,
         
    Imageposition:{
             type:Number,
              default: 0,

    }
   ,

    // size: {
    //     type: String,
    //     enum: ['L','S'],
    //     default: 'S'
    // },

    // song:{}
}],


videoFiles: [{
    url: {
        type: String,
        required: true
    },
    // size: {
    //     type: String,
    //     enum: ['L','S'],
    //     default: 'L'
    // },

     Videoposition:{
             type:Number,
              default: 0,

    },

    autoplay: {
        type: Boolean,
        default: false 
    },
    
    thumbnail:{
        type: String,
    }

    ,

    posturl:{
        type:String,
    }


         
// size: {
//         type: String,
//         enum: ['L','S'],
//         default: 'S'
//     },



    // thumbnail :{}

    // song:{}

}],



audioFile:{
    type: String,
    // required: true
},

song:[{
    type:String
     // required: true
}],

    pattern: {
    type: String,
    enum: [
      '1', // One media file
      
      '2x2', // 4 items in 2x2 grid
       
      '2', // 2 horizontal items

      '1x2', // 1 large + 2 small (L pattern)
       
      '1x3', // 1 large + 3 small
      
      'carousel',

       'carousel arrow',
    //   'linear', // Linear arrangement
    //   'masonry', // Pinterest-style masonry
    //   'story', // Story-style vertical
    
    ],
    default: '1'
  },

 postType:{
    type: String,
    enum: [
        // if there are all images in post
        'image', 
    //    if there are all videos in post
        'video', 
    //    if there is only audio in post
        'audio', 
    //    if there is only text in post
        'text', 
        // if there are  image and video both in post
        'mixed'
    ],
    // default: 'image'

 }
,



    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    whatsapp: {
        type: String
    },
    storeLink: {
        type: String
    },
    facebook: {
        type: String
    },
    instagram: {
        type: String
    },
    productlink: {
        type: String
    },
    totalRating: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalViews: {
        type: Number,
        default: 0
    }
,
 



  // Comments count (comments stored separately)
  commentCount: {
    type: Number,
    default: 0
  },

}, { timestamps: true })

// Static method for cascading delete
postSchema.static('findByIdAndDelete', async function(id) {
    await NewComment.deleteMany({ postId: id }); // Delete all comments for this post
    return this.findOneAndDelete({ _id: id });
});

postSchema.plugin(mongooseAggregatePaginate)

// ✅ Optimized compound index for your category query
postSchema.index({ category: 1, isPublished: 1, createdAt: -1 });

// ============ OPTIMIZED INDEXES ============
// Text search index
postSchema.index({ title: "text", description: "text", category: "text" });

// Individual indexes
postSchema.index({ owner: 1 });
postSchema.index({ averageRating: -1 });
postSchema.index({ totalViews: -1 });
postSchema.index({ isPublished: 1 });

// Compound indexes for performance
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ owner: 1, createdAt: -1 });
postSchema.index({ isPublished: 1, category: 1, createdAt: -1 });
postSchema.index({ isPublished: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);











// //optimized code
// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// import { Comment } from "./comment.model.js";

// const postSchema = new Schema({
   

//       store: {
//         type: Boolean,
        
//         default: false
//     },
   
//    productId:{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Store_Product",
//         // required: false
//     },

   


//    videocount:{
//         type: Number,
//         default: 0
//     },

   

//    imagecount:{
//         type: Number,
//         default: 0
//     },

// audiocount:{
//         type: Number,
//         default: 0
//        },

//     title: {
//         type: String,
//         // required: true,
//         trim: true,
//         index: true
//     },
//     description: {
//         type: String,
//         // required: true,
//         trim: true
//     },
    
//     category: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     thumbnail: {
//         type: String,
//         // required: true
//     },

//     // imageFiles: [{
//     //     type: String,  // cloudinary url
//     //      enum: ['L','S'],
//     //     default: 'L',
//     //     // required: true
//     // }],
    
//     // videoFile:[ {
//     //     type: String,  // cloudinary url
//     //      enum: ['L','S'],
//     //     default: 'L',
//     //     // required: true
//     // }],

//     // audioFile: [{
//     //     type: String,  // cloudinary url
//     //     // required: true
//     // }],




//     // pdfFile: {
//     //     type: String,  // cloudinary url
//     //     // required: true
//     // },



//     imageFiles: [{
//     url: {
//         type: String,
//         required: true
//     },
//     size: {
//         type: String,
//         enum: ['L','S'],
//         default: 'L'
//     }
// }],


// videoFiles: [{
//     url: {
//         type: String,
//         required: true
//     },
//     size: {
//         type: String,
//         enum: ['L','S'],
//         default: 'L'
//     }
// }],



// audioFile:{
//     type: String,
//     // required: true
// },

// song:[{
//     type:String
//      // required: true
// }],

//     pattern: {
//     type: String,
//     enum: [
//       'single', // One media file
//       'grid_2x2', // 4 items in 2x2 grid
//       'grid_1_2', // 1 large + 2 small (L pattern)
//       'grid_2_1', // 2 small + 1 large
//       'linear', // Linear arrangement
//       'masonry', // Pinterest-style masonry
//       'story', // Story-style vertical
//       'carousel' // Horizontal carousel
//     ],
//     default: 'single'
//   },



//     views: {
//         type: Number,
//         default: 0,
//     },
//     isPublished: {
//         type: Boolean,
//         default: true
//     },
//     whatsapp: {
//         type: Number
//     },
//     storeLink: {
//         type: String
//     },
//     facebook: {
//         type: String
//     },
//     instagram: {
//         type: String
//     },
//     productlink: {
//         type: String
//     },
//     totalRating: {
//         type: Number,
//         default: 0
//     },
//     ratingCount: {
//         type: Number,
//         default: 0
//     },
//     averageRating: {
//         type: Number,
//         default: 0
//     },
//     totalViews: {
//         type: Number,
//         default: 0
//     }
// ,

// //     shares: [{
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User'
// //     },
// //     createdAt: {
// //       type: Date,
// //       default: Date.now
// //     }
// //   }],



// //   // Engagement metrics
// //   likes: [{
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User'
// //     },
// //     createdAt: {
// //       type: Date,
// //       default: Date.now
// //     }
// //   }],
  
//   // Comments count (comments stored separately like in card model)
//   commentCount: {
//     type: Number,
//     default: 0
//   },



// }, { timestamps: true })

// // Static method for cascading delete
// postSchema.static('findByIdAndDelete', async function(id) {
//     await Comment.deleteMany({ contentId: id, contentType: "post" }); // Changed "card" to "post"
//     return this.findOneAndDelete({ _id: id });
// });

// postSchema.plugin(mongooseAggregatePaginate)

// // ============ OPTIMIZED INDEXES ============
// // Text search index
// postSchema.index({ title: "text", description: "text", category: "text" });

// // Individual indexes
// postSchema.index({ owner: 1 });
// postSchema.index({ averageRating: -1 });
// postSchema.index({ totalViews: -1 });
// postSchema.index({ isPublished: 1 });

// // Compound indexes for performance
// postSchema.index({ category: 1, createdAt: -1 });
// postSchema.index({ createdAt: -1 });
// postSchema.index({ owner: 1, createdAt: -1 });
// postSchema.index({ isPublished: 1, category: 1, createdAt: -1 });
// postSchema.index({ isPublished: 1, createdAt: -1 });

// export const Post = mongoose.model("Post", postSchema); // Changed model name to "Post"









