import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const SinglePostCommentSchema = new Schema(
    {
        // Text content is optional when media is provided
        content: {
            type: String,
            required: false,
            trim: true
        },
        // Media fields (URLs uploaded to Cloudinary)
        audioUrl: {
            type: String,
            default: null
        },
        videoUrl: {
            type: String,
            default: null
        },
        stickerUrl: {
            type: String,
            default: null
        },
        // Reference to post ID only (no need for contentType since we only have posts)
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // New fields for reply functionality
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NewComment",
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

SinglePostCommentSchema.plugin(mongooseAggregatePaginate)

// Static method for cascading delete
SinglePostCommentSchema .static('findByIdAndDelete', async function(id) {
    // First delete all replies associated with this comment
    await this.deleteMany({ parentComment: id });
    
    // Then delete the comment itself
    return this.findOneAndDelete({ _id: id });
});

// Add indexes for frequent queries
SinglePostCommentSchema.index({ postId: 1 });
SinglePostCommentSchema.index({ owner: 1 });
SinglePostCommentSchema.index({ createdAt: -1 });
SinglePostCommentSchema.index({ parentComment: 1 }); // Add index for parent comment

export const SinglePostComment = mongoose.model("SinglePostComment", SinglePostCommentSchema )