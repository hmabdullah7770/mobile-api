import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import  {Comment}  from "./comment.model.js";

const cardSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
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
    thumbnail: {
        type: String,   //cloudnary url
        required: true
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    // Social links - optional fields that can be included from user profile
    whatsapp: {
        type: Number
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
    // Rating statistics
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
    // View tracking
    totalViews: {
        type: Number,
        default: 0
    }
}, { timestamps: true })


// In card.model.js
cardSchema.static('findByIdAndDelete', async function(id) {
    // First delete all comments associated with this card
    await Comment.deleteMany({ contentId: id, contentType: "card" });
    
    // Then delete the card
    return this.findOneAndDelete({ _id: id });
  });

cardSchema.plugin(mongooseAggregatePaginate)

// Add text indexes for search including category
cardSchema.index({ title: "text", description: "text", category: "text" });

// Add regular indexes for common queries
cardSchema.index({ owner: 1 });
// cardSchema.index({ category: 1 });
cardSchema.index({ averageRating: -1 });
cardSchema.index({ totalViews: -1 });
cardSchema.index({ isPublished: 1 });

export default mongoose.model("Card", cardSchema)