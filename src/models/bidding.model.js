import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const biddingSchema = new Schema(
    {
        // The user who is placing the bid (the bidder)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        
        // The post being bid on
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true,
            index: true
        },
        
        // Product related to the bid
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // Store related to the bid
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },

        // Owner of the post (who receives the bid)
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // User for whom the bid is being placed (optional)
        // If null = bid is for the bidder themselves
        // If set = bid is for another user
        bidForUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        
        // Bid amount
        bidAmount: {
            type: Number,
            required: true,
            min: 1
        },

        // Optional message with the bid
        message: {
            type: String,
            maxlength: 500,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Indexes for performance
biddingSchema.index({ postId: 1, bidAmount: -1 });
biddingSchema.index({ userId: 1, createdAt: -1 });
// ✅ Create compound index for performance
biddingSchema.index({ postId: 1, userId: 1 });

biddingSchema.index({ bidForUserId: 1, bidAmount: -1 });

// Plugin for pagination
biddingSchema.plugin(mongooseAggregatePaginate);

// Pre-save validation
biddingSchema.pre('save', async function(next) {
    // Prevent user from bidding on their own post
    if (this.userId.toString() === this.owner.toString()) {
        throw new Error("You cannot bid on your own post");
    }
    
    // If bidding for someone else, ensure it's not the post owner
    if (this.bidForUserId && this.bidForUserId.toString() === this.owner.toString()) {
        throw new Error("Cannot bid for the post owner");
    }
    
    next();
});

export const Bidding = mongoose.model("Bidding", biddingSchema);