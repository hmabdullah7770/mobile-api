import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// Add indexes for common queries
tweetSchema.index({ owner: 1 });
tweetSchema.index({ createdAt: -1 });

export const Tweet = mongoose.model("Tweet", tweetSchema); 