import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Create a schema for individual order items
const OrderItemSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productImages:{
    type: String,
    required: true,
    
  },

  size: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new Schema({
  // Customer information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true
  },
  customerAvatar:{
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerAddress: {
    type: String,
    required: true,
    trim: true
  },
  
  // Store information
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CreateStore",
    required: true
  },
  storeOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Order items
  items: [OrderItemSchema],
  
  // Order details
  totalAmount: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  
  // Order status
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'online', 'upi'],
    default: 'cod'
  },
  
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  trackingNumber: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  // Notification flags
  isNotified: {
    type: Boolean,
    default: false
  },
  
  notificationSentAt: {
    type: Date
  }
}, { timestamps: true });

// Indexes for better query performance
orderSchema.index({ customerId: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ storeOwnerId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ _id: 1, storeId: 1 });


// store_bannerSchema.index({ storeId: 1, title: 1 }, { unique: true,
//   collation: { locale: 'en', strength: 2 } //case senstive
//  });


// Add pagination plugin
orderSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model("Order", orderSchema);
























// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const ordereSchema = new Schema({
//     username: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     fullname: {  // Fixed spelling from "catagoury"
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     whatsapp: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         enum: ['nesh', 'one-product', 'multiple-product']  // Added enum for validation
//     },
//     phoneno: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },
//     address: {  // Changed to camelCase
//         type: String,
//         required: true,
//         trim: true
//     },
//     prductname: {  // Changed to camelCase
//         type: String,
//         required: function() { return this.storeType === 'one-product'; }  // Only required for one-product stores
//     },
//     productsize: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     productcolor: { 
//         type: String, 
//         required: true 
//     },
//    quantityofproduct: { 
//         type: Number, 
//         default: 0 
//     },

//     totalQuantity: { 
//         type: Number, 
//         default: 0 
//     },

//     // likes:{
//     // //  likes
//     // },


//     isPublished: {  // Added missing field
//         type: Boolean,
//         default: false
//     }
// }, { timestamps: true });

// ordereSchema.plugin(mongooseAggregatePaginate);

// // Text index for search functionality
// ordereSchema.index({
//     storeName: "text",
//     category: "text",
//     productName: "text"
// });

// // Regular indexes for common queries
// ordereSchema.index({ category: 1 });
// ordereSchema.index({ storeType: 1 });
// ordereSchema.index({ isPublished: 1 });
// ordereSchema.index({ owner: 1 });

// export default mongoose.model("Order", ordere