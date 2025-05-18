import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema({
    // Store information
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreateStore",
        required: true
    },
    
    // Basic product informations
    productName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },

    warnings:{
        type: String,
        trim: true,
        default: ""
    },
    
    // Price and discount
    productPrice: {
        type: Number, // Changed from String to Number
        required: true
    },
    productDiscount: {
        type: Number, // Changed from String to Number
        default: 0
    },
    finalPrice: {
        type: Number,
        default: function() {
            return this.productPrice - (this.productPrice * (this.productDiscount / 100));
        }
    },
    
    // // Rating and reviews
    // productRating: { // Renamed from productrate for clarity
    //     type: Number,
    //     default: 0,
    //     min: 0,
    //     max: 5
    // },
    // reviewCount: {
    //     type: Number,
    //     default: 0
    // },
    
    // Product variations
    productSizes: {
        type: [String], // Changed to array of strings
        // required: true,
        // validate: {
        //     validator: function(v) {
        //         return v.length > 0;
        //     },
        //     message: 'At least one size option is required'
        // }
    },
    productColors: {
        type: [String], // Changed to array of strings
        // required: true,
        // validate: {
        //     validator: function(v) {
        //         return v.length > 0;
        //     },
        //     message: 'At least one color option is required'
        // }
    },
    
    // // Inventory
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Images
    productImages: {
        type: [String],
        required: true,
        // validate: {
        //     validator: function(v) {
        //         return v.length > 0;
        //     },
        //     message: 'At least one product image is required'
        // }
    },
    
    // Category and tags
    category: {
        type: String,
        // required: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    
    // // Engagement metrics
    // clickCount: {
    //     type: Number,
    //     default: 0
    // },
    // likes: {
    //     type: Number,
    //     default: 0
    // },



   

    
    variants: {
        type: [String],
        default: []
    },


    specifications: {
        type: [String],
        default: []
    },

     // variants = [],
    // specifications = [],
    // tags = []

    
    // Management
    // owner: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true
    // },
    // isPublished: {
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: true });

productSchema.plugin(mongooseAggregatePaginate);



productSchema.pre('save', function(next) {
    if (this.isModified('productPrice') || this.isModified('productDiscount')) {
        const price = Number(this.productPrice);
        const discount = Number(this.productDiscount) || 0;

        if (!isNaN(price)) {
            this.finalPrice = Number((price - (price * (discount / 100))).toFixed(2));
        } else {
            this.finalPrice = 0; // Or throw new Error('Invalid productPrice');
        }
    }
    next();
});
// Text index for search functionality
// productSchema.index({
//     productName: "text",
//     description: "text",
//     category: "text",
//     tags: "text"
// });

// Regular indexes for common queries
// productSchema.index({ category: 1 });
// productSchema.index({ finalPrice: 1 });
// // productSchema.index({ productRating: -1 });
// // productSchema.index({ isPublished: 1 });
// productSchema.index({ owner: 1 });
// productSchema.index({ storeId: 1 });
// productSchema.index({ createdAt: -1 });


productSchema.index({ storeId: 1, productName: 1 }, { unique: true,
    collation: { locale: 'en', strength: 2 } //case senstive
   });

export default mongoose.model("Product", productSchema);