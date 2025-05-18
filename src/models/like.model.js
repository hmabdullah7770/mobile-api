import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
    {
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        contentType: {
            type: String,
            enum: ["card", "video"],
            required: true
        },

        commentId:{
            type: String,
            required: true,
        },


        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

likeSchema.index({ contentId: 1, contentType: 1,commentId:1, owner: 1 }, { unique: true });

likeSchema.plugin(mongooseAggregatePaginate);

// Add indexes for frequent queries
likeSchema.index({ contentId: 1, contentType: 1 });
likeSchema.index({ owner: 1 });

export const Like = mongoose.model("Like", likeSchema); 