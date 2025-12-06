// src/models/postuniqueids.model.js

import mongoose from 'mongoose';

const postUniqueIdsSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        required: true 
    },
    sequence: { 
        type: Number, 
        default: 0 
    }
}, { 
    timestamps: false  // We don't need timestamps for counters
});

export const PostUniqueIds = mongoose.model('PostUniqueIds', postUniqueIdsSchema);