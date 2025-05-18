import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadResult } from "../../utils/Claudnary.js";
import ThreeDVideo from "../../models/store/store.threeDvideo.model.js";

// Add a 3D video to a store
export const add3DVideo = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { title, description } = req.body;
    
    // Validate required fields
    if (!title) {
        throw new ApiError(400, "Title is required");
    }
    
    // Check for video file
    if (!req.files?.video) {
        throw new ApiError(400, "3D video file is required");
    }
    
    // Upload video
    const videoUpload = await uploadResult(req.files.video[0]?.path, "video");
    
    if (!videoUpload.url) {
        throw new ApiError(500, "Error uploading 3D video");
    }
    
    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (req.files?.thumbnail) {
        const thumbnailUpload = await uploadResult(req.files.thumbnail[0]?.path);
        thumbnailUrl = thumbnailUpload.url;
    }
    
    // Create the 3D video
    const threeDVideo = await ThreeDVideo.create({
        store: storeId,
        title,
        description,
        videoUrl: videoUpload.url,
        thumbnailUrl
    });
    
    return res.status(201).json(
        new ApiResponse(201, threeDVideo, "3D video added successfully")
    );
});

// Get all 3D videos for a store
export const getStore3DVideos = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    
    const videos = await ThreeDVideo.find({ store: storeId });
    
    return res.status(200).json(
        new ApiResponse(200, videos, "Store 3D videos retrieved successfully")
    );
});

// Update a 3D video
export const update3DVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    
    const video = await ThreeDVideo.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "3D video not found");
    }
    
    // Check if the video belongs to the store
    if (video.store.toString() !== req.store._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this 3D video");
    }
    
    // Update fields if provided
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    
    // Handle video file if provided
    if (req.files?.video) {
        const videoUpload = await uploadResult(req.files.video[0]?.path, "video");
        
        if (!videoUpload.url) {
            throw new ApiError(500, "Error uploading 3D video");
        }
        
        video.videoUrl = videoUpload.url;
    }
    
    // Handle thumbnail if provided
    if (req.files?.thumbnail) {
        const thumbnailUpload = await uploadResult(req.files.thumbnail[0]?.path);
        video.thumbnailUrl = thumbnailUpload.url;
    }
    
    await video.save();
    
    return res.status(200).json(
        new ApiResponse(200, video, "3D video updated successfully")
    );
});

// Delete a 3D video
export const delete3DVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    const video = await ThreeDVideo.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "3D video not found");
    }
    
    // Check if the video belongs to the store
    if (video.store.toString() !== req.store._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this 3D video");
    }
    
    await ThreeDVideo.findByIdAndDelete(videoId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "3D video deleted successfully")
    );
});
