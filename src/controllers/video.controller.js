import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadResult} from "../utils/Claudnary.js"
import {ContentRegistry} from "../models/contentRegistry.model.js"
import { processSocialLinks } from "../utils/socialLinks.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    
    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber
    
    // Prepare match stage for aggregation
    const matchStage = {}
    
    // Add search query if provided
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    
    // Add userId filter if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Add isPublished filter - only show published videos
    matchStage.Uploaded = true // Using "Uploaded" field as per model instead of "isPublished"
    
    // Prepare sort options
    const sortOptions = {}
    
    if (sortBy) {
        // Set sort direction (1 for ascending, -1 for descending)
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        // Default sort by createdAt in descending order
        sortOptions.createdAt = -1
    }
    
    // Execute aggregation pipeline
    const videos = await Video.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        },
        {
            $sort: sortOptions
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination info
    const totalVideos = await Video.countDocuments(matchStage)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalVideos / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalVideos,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Videos fetched successfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title,category,description, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
    
    // Validation
    if (!title || !description || !category) {
        throw new ApiError(400, "Title , description and categoury are required");
    }

     
    
    // Get the user
    const user = await User.findById(req.userVerfied._id);
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    // Check which social links the user wants to include
    const includeWhatsapp = whatsapp === true || whatsapp === "true";
    const includeStoreLink = storeLink === true || storeLink === "true";
    const includeFacebook = facebook === true || facebook === "true";
    const includeInstagram = instagram === true || instagram === "true";
    
    // Check if at least one social link is selected to be included
    if (!includeWhatsapp && !includeStoreLink && !includeFacebook && !includeInstagram) {
        throw new ApiError(400, "At least one social link must be selected");
    }
    
    // Validate that user has the social links they're trying to include
    if (includeWhatsapp && !user.whatsapp) {
        throw new ApiError(400, "You don't have a WhatsApp number in your profile");
    }
    
    if (includeStoreLink && !user.storeLink) {
        throw new ApiError(400, "You don't have a store link in your profile");
    }
    
    if (includeFacebook && !user.facebook) {
        throw new ApiError(400, "You don't have a Facebook link in your profile");
    }
    
    if (includeInstagram && !user.instagram) {
        throw new ApiError(400, "You don't have an Instagram link in your profile");
    }
    
    // Check if files are provided
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }
    
    // Upload video and thumbnail to cloudinary
    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;
    
    const videoFile = await uploadResult(videoLocalPath);
    const thumbnail = await uploadResult(thumbnailLocalPath);
    
    if (!videoFile || !videoFile.url || !thumbnail || !thumbnail.url) {
        throw new ApiError(500, "Error uploading files to cloudinary");
    }
    
    // Create the video with only the selected social links
    const videoData = {
        title,
        category,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.userVerfied._id,
        Uploaded: true
    };
    
    // // Only include the social links that were selected and exist in user profile
    if (includeWhatsapp) videoData.whatsapp = user.whatsapp;
    if (includeStoreLink) videoData.storeLink = user.storeLink;
    if (includeFacebook) videoData.facebook = user.facebook;
    if (includeInstagram) videoData.instagram = user.instagram;
    if (productlink) videoData.productlink = user.productlink;
    
    const video = await Video.create(videoData);
    
    // Register the video in the content registry
    await ContentRegistry.create({
        originalId: video._id,
        contentType: "video"
    });
    
    // Get the created video with populated owner
    const createdVideo = await Video.findById(video._id).populate("owner", "username fullName avatar");
    
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while creating the video");
    }
    
    return res.status(201).json(
        new ApiResponse(201, createdVideo, "Video published successfully")
    );
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Use aggregation to get video with owner details
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
                Uploaded: true // Only fetch published videos
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        }
    ]);
    
    // Check if video exists
    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
    }
    
    // Increment view count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { onclicks: 1 }  // Using onclicks instead of views
    });
    
    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Find the video
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    // Check if the user is the owner of the video
    if (video.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    
    // Get the user to verify they have the social links they're trying to use
    const user = await User.findById(req.userVerfied._id);
    
    // Process social links
    const socialLinkUpdates = {};
    
    // Validate that user has the social links they're trying to use
    if (whatsapp !== undefined) {
        const includeWhatsapp = whatsapp === true || whatsapp === "true";
        if (includeWhatsapp && !user.whatsapp) {
            throw new ApiError(400, "You don't have a WhatsApp number in your profile");
        }
        socialLinkUpdates.whatsapp = includeWhatsapp ? user.whatsapp : null;
    }
    
    if (storeLink !== undefined) {
        const includeStoreLink = storeLink === true || storeLink === "true";
        if (includeStoreLink && !user.storeLink) {
            throw new ApiError(400, "You don't have a store link in your profile");
        }
        socialLinkUpdates.storeLink = includeStoreLink ? user.storeLink : null;
    }
    
    if (facebook !== undefined) {
        const includeFacebook = facebook === true || facebook === "true";
        if (includeFacebook && !user.facebook) {
            throw new ApiError(400, "You don't have a Facebook link in your profile");
        }
        socialLinkUpdates.facebook = includeFacebook ? user.facebook : null;
    }
    
    if (instagram !== undefined) {
        const includeInstagram = instagram === true || instagram === "true";
        if (includeInstagram && !user.instagram) {
            throw new ApiError(400, "You don't have an Instagram link in your profile");
        }
        socialLinkUpdates.instagram = includeInstagram ? user.instagram : null;
    }
    
    // Check if at least one social link will be present after update
    const willHaveWhatsapp = whatsapp !== undefined ? (whatsapp === true || whatsapp === "true") : !!video.whatsapp;
    const willHaveStoreLink = storeLink !== undefined ? (storeLink === true || storeLink === "true") : !!video.storeLink;
    const willHaveFacebook = facebook !== undefined ? (facebook === true || facebook === "true") : !!video.facebook;
    const willHaveInstagram = instagram !== undefined ? (instagram === true || instagram === "true") : !!video.instagram;
    
    if (!willHaveWhatsapp && !willHaveStoreLink && !willHaveFacebook && !willHaveInstagram) {
        throw new ApiError(400, "At least one social link is required");
    }
    
    // Handle thumbnail upload if provided
    let thumbnailUrl = video.thumbnail;
    
    if (req.file) {
        const thumbnail = await uploadResult(req.file.path);
        
        if (!thumbnail || !thumbnail.url) {
            throw new ApiError(500, "Error uploading thumbnail to cloudinary");
        }
        
        thumbnailUrl = thumbnail.url;
    }
    
    // Update the video
    const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(thumbnailUrl !== video.thumbnail && { thumbnail: thumbnailUrl }),
        ...socialLinkUpdates,
        ...(productlink !== undefined && { productlink })
    };
    
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    ).populate("owner", "username fullName avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Find the video
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    // Check if the user is the owner of the video
    if (video.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }
    
    // Remove from content registry
    await ContentRegistry.findOneAndDelete({
        originalId: videoId,
        contentType: "video"
    });
    
    // Delete the video
    await Video.findByIdAndDelete(videoId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Find the video
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    // Check if the user is the owner of the video
    if (video.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }
    
    // Toggle the publish status (using "Uploaded" field as per model)
    video.Uploaded = !video.Uploaded;
    
    // Save the video
    await video.save();
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { Uploaded: video.Uploaded }, 
            `Video ${video.Uploaded ? 'published' : 'unpublished'} successfully`
        )
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
