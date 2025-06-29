import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const createStoreSchema = new Schema({
    // template: {
    //     type: String,
    //     required: true,
    //     trim: true,
    //     index: true
    // },
    category: {
        type: String,
        // required: true,
        trim: true
    },

    storeType: {
        type: String,
        required: true,
        trim: true,
        enum: ['nesh', 'one-product', 'multiple-product']
    },
    
    storeName: {  // Changed to camelCase
        type: String,
        required: true,
        unique:true,
        trim: true,
        index: true
    },
    storeLogo: {  // Changed to camelCase
        type: String,
        required: true,
        trim: true
    },
    productName: {  // Changed to camelCase
        type: String,
        required: function() { return this.storeType === 'one-product'; } ,
        sparse: true // Only required for one-product stores
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // targetUrl: { 
    //     type: String, 
    //     required: true 
    // },
    clickCount: { 
        type: Number, 
        default: 0 
    },

   connect:{
    //  likes
    },


    // isPublished: {  // Added missing field
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: true });

createStoreSchema.plugin(mongooseAggregatePaginate);

// Text index for search functionality
createStoreSchema.index({
    storeName: "text",
    category: "text",
    productName: "text"
});

// Regular indexes for common queries
createStoreSchema.index({ category: 1 });
createStoreSchema.index({ storeType: 1 });
// createStoreSchema.index({ isPublished: 1 });
createStoreSchema.index({ owner: 1 });

export default mongoose.model("CreateStore", createStoreSchema);  // Changed to CreateStore