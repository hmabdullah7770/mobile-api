import mongoose, {Schema} from "mongoose";

const contentRegistrySchema = new Schema({
    originalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    contentType: {
        type: String,
        enum: ["card", "video"],
        required: true
    }
}, { timestamps: true });

// Create a compound unique index to ensure no duplicate registrations
contentRegistrySchema.index({ originalId: 1, contentType: 1 }, { unique: true });

export const ContentRegistry = mongoose.model("ContentRegistry", contentRegistrySchema); 