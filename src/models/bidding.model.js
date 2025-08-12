import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        // Using a more generic approach for the content reference
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        contentType: {
            type: String,
            enum: ["card", "video"],
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
,
        // New fields for reply functionality
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },
        isReply: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)




// In comment.model.js
commentSchema.static('findByIdAndDelete', async function(id) {
    // First delete all replies associated with this comment
    await this.deleteMany({ parentComment: id });
    
    // Then delete the comment itself
    return this.findOneAndDelete({ _id: id });
  });


// Add indexes for frequent queries
commentSchema.index({ contentId: 1, contentType: 1 });
commentSchema.index({ owner: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ parentComment: 1 }); // Add index for parent comment

export const Comment = mongoose.model("Comment", commentSchema)