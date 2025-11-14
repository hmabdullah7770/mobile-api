// store_rating.model.js - Create this file in your models/store folder

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const storeRatingSchema = new Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
            validator: Number.isInteger,
            message: "Rating must be an integer"
        }
    }
}, { timestamps: true });

// Compound index to ensure one rating per user per store
storeRatingSchema.index({ store: 1, user: 1 }, { unique: true });

// Index for queries
storeRatingSchema.index({ store: 1, rating: -1 });
storeRatingSchema.index({ user: 1, createdAt: -1 });

storeRatingSchema.plugin(mongooseAggregatePaginate);

export const StoreRating = mongoose.model("StoreRating", storeRatingSchema);
export default StoreRating;