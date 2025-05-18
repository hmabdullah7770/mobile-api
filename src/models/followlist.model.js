import mongoose from "mongoose";

const followlistSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true});

// Add index for frequent queries
followlistSchema.index({ follower: 1, following: 1 }, { unique: true });

// Clear existing model if it exists to prevent schema conflicts(important in conflict)
// mongoose.models = {}; 

export const Followlist = mongoose.model("Followlist", followlistSchema);