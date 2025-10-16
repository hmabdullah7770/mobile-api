import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";



//if the Creator delete the  post the the user who bid on that post will also be deleted

// so add a permoission to return the other user bid who insvest before delete 



const biddingSchema = new Schema(
    {
        userId: {
            type: String,
            required: true
        },
        // Using a more generic approach for the content reference
       postId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        productId: {
            type: String,
            // enum: ["card", "video"],
            required: true
        },

      StoreId: {
            type: String,
            // enum: ["card", "video"],
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
,
        
       addotheruserId:{

        type: String,   
        required: true,

       },

        
        numberofbids: {
                type: String, 
            default: 0
        },


    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)




// In comment.model.js
biddingSchema.static('findByIdAndDelete', async function(id) {
    // First delete all replies associated with this comment
    await this.deleteMany({ parentComment: id });
    
    // Then delete the comment itself
    return this.findOneAndDelete({ _id: id });
  });



export const Bidding = mongoose.model("Bidding", biddingSchema)


