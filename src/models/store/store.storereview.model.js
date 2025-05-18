import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const storeReviewSchema = new Schema({
    // Store information
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true
    },
    
    // Review content
    reviewText: {
        type: String,
        required: true,
        trim: true
    },
    
    // Rating
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    
    // User information
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    username: {
        type: String,
        required: true,
        trim: true
    },
    
    // // Status
    // isVerifiedPurchase: {
    //     type: Boolean,
    //     default: false
    // },
    
    
    // Helpfulness tracking
    helpfulCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

storeReviewSchema.plugin(mongooseAggregatePaginate);

// Text index for search functionality
storeReviewSchema.index({
    reviewText: "text",
    username: "text"
});

// Regular indexes for common queries
storeReviewSchema.index({ storeId: 1 });
storeReviewSchema.index({ customerId: 1 });
storeReviewSchema.index({ stars: -1 });
storeReviewSchema.index({ createdAt: -1 });
storeReviewSchema.index({ isVerifiedPurchase: 1 });
storeReviewSchema.index({ isPublished: 1 });

export default mongoose.model("StoreReview", storeReviewSchema);











// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const reviewSchema = new Schema({
//     // Store information
//     storeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "CreateStore",
//         required: true
//     },
    
   
//     // Review content
//     reviewText: {
//         type: String,
//         required: true,
//         trim: true
//     },
    
//     // Rating
//     stars: {
//         type: Number,
//         required: true,
//         min: 1,
//         max: 5
//     },
    
//     // User information
//     customerId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
    
//     username: {
//         type: String,
//         required: true,
//         trim: true
//     },
    
//     // Helpfulness tracking
//     helpfulCount: {
//         type: Number,
//         default: 0
//     }
// }, { timestamps: true });

// reviewSchema.plugin(mongooseAggregatePaginate);

// // Text index for search functionality
// reviewSchema.index({
//     reviewText: "text",
//     username: "text"
// });

// // Regular indexes for common queries
// reviewSchema.index({ productId: 1 });
// reviewSchema.index({ storeId: 1 });
// reviewSchema.index({ userId: 1 });
// reviewSchema.index({ stars: -1 });
// reviewSchema.index({ createdAt: -1 });
// reviewSchema.index({ isVerifiedPurchase: 1 });
// reviewSchema.index({ isPublished: 1 });

// export default mongoose.model("Review", reviewSchema);











