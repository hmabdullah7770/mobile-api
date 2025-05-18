import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    
    
    //next updates
    //payment gateways(products uplad limit, reviews section, account section, Dashboard section, banner section, trending,top search,verifation tick)
    //push notifications
    //in-search-bar-drop-downs
    //givaaways
    //innovation
    //colaburation
    //discounts
    //brands
    //bussinesses
    //challenges
    //events
    //trending
    //latest
    //populars
    //offers
    //new
    //old
    //wintage
    //uniqueness
    
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    videoFile: {
        type: String,  // cloudinary url
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String,   // cloudinary url
        required: true
    },
    onclicks: {
        type: Number,
        default: 0,
    },
    Uploaded: {
        type: Boolean,
        default: true,
    },
    // Social links
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
    }
}, { timestamps: true });

// Custom validator to ensure at least one social link is provided
videoSchema.pre('validate', function(next) {
    if (
        !this.whatsapp && 
        !this.storeLink && 
        !this.facebook && 
        !this.instagram
    ) {
        this.invalidate('socialLinks', 'At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required');
    }
    next();
});

videoSchema.plugin(mongooseAggregatePaginate);

// Add text indexes for search
videoSchema.index({ title: "text", description: "text" , category:"text"});

// Add regular indexes for common queries
videoSchema.index({ owner: 1 });
// videoSchema.index({ category: 1 });
videoSchema.index({ averageRating: -1 });
videoSchema.index({ onclicks: -1 });
videoSchema.index({ Uploaded: 1 });

export const Video = mongoose.model('Video', videoSchema);