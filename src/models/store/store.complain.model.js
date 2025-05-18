import mongoose, { Schema } from "mongoose"; 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const complainSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Optional if guest complaint is allowed
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    issue: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    productName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

complainSchema.plugin(mongooseAggregatePaginate);

// Text index for search functionality
complainSchema.index({
    username: "text",
    issue: "text",
    productName: "text",
    description: "text"
});

// Regular indexes for common queries
complainSchema.index({ status: 1 });
complainSchema.index({ owner: 1 });
complainSchema.index({ productId: 1 });
complainSchema.index({ customerId: 1 });
complainSchema.index({ createdAt: -1 }); // For sorting by newest complaints

export default mongoose.model("Complain", complainSchema);


















// import mongoose, { Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// // import  {Comment}  from "./comment.model.js";

// const complainSchema= new Schema({
    
//     username: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true
//     },

//     customerId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: false // Optional if guest checkout is allowed
//       },

//    phoneno: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//    issue: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}
//     },
//     productname: {
//         type: String,
//         required: true,
//         trim: true,
//         index: true,
//         required: function() { return this.bigheadingText}

//     },

//     productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//         required: true
//       },


//     textarea: {
//         type: String,
//         required: true,
//         trim: true,
        
//     },

 
   
    
 
 
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
    
// }, { timestamps: true })



// complainSchema.plugin(mongooseAggregatePaginate)

// // ✅ Fix (use actual fields from schema)
// complainSchema.index({ 
//     bigheadingText: "text", 
//     smallheadingText: "text", 
//     category: "text" 
//   });



// complainSchema.index({ category: 1 });

// complainSchema.index({ isPublished: 1 });

// export default mongoose.model("Complain", complainSchema)