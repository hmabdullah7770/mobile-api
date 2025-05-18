import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productReviewSchema = new Schema({
    // Store information
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true
    },
    
    // Product reference
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
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
    
    // Status
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    
    isPublished: {
        type: Boolean,
        default: true
    },
    
    // Helpfulness tracking
    helpfulCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

productReviewSchema.plugin(mongooseAggregatePaginate);

// Text index for search functionality
productReviewSchema.index({
    reviewText: "text",
    username: "text"
});

// Regular indexes for common queries
productReviewSchema.index({ productId: 1 });
productReviewSchema.index({ storeId: 1 });
productReviewSchema.index({ userId: 1 });
productReviewSchema.index({ stars: -1 });
productReviewSchema.index({ createdAt: -1 });
productReviewSchema.index({ isVerifiedPurchase: 1 });
productReviewSchema.index({ isPublished: 1 });

export default mongoose.model("ProductReview", productReviewSchema);












// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const productreviewSchema = new Schema({
//     // Store information
//     storeId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "CreateStore",
//         required: true
//     },

//     productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//         required: true
//       },
    
//     // Basic product informations
//     productName: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     review: {
//         type: String,
//         trim: true,
//         default: ""
//     },
    
//     // Price and discount
//     stars: {
//         type: Number, // Changed from String to Number 
//         // (maximum will be five star)
//         required: true

//     },
    
//     // Management
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
   
// }, { timestamps: true });

// productreviewSchema.plugin(mongooseAggregatePaginate);

// // Text index for search functionality
// productreviewSchema.index({
//     productName: "text",
//     description: "text",
//     category: "text",
//     tags: "text"
// });

// // Regular indexes for common queries
// productreviewSchema.index({ category: 1 });
// productreviewSchema.index({ finalPrice: 1 });
// productreviewSchema.index({ productRating: -1 });
// productreviewSchema.index({ isPublished: 1 });
// productreviewSchema.index({ owner: 1 });
// productreviewSchema.index({ storeId: 1 });
// productreviewSchema.index({ createdAt: -1 });

// export default mongoose.model("Productreview", productreviewSchema);










