import mongoose, {isValidObjectId} from "mongoose"
import {Post} from "../models/post.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadResult} from "../utils/Claudnary.js"
import {ContentRegistry} from "../models/contentRegistry.model.js"
import { processSocialLinks } from "../utils/socialLinks.js"
import Categoury from "../models/categoury.model.js"

// No helper function needed - we'll use array lengths directly

// Get all posts with pagination and filtering
const getAllPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, category, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
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
    
    // Add category filter if provided
    if (category) {
        matchStage.category = category
    }
    
    // Add userId filter if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Add isPublished filter - only show published posts
    matchStage.isPublished = true
    
    // Prepare sort options
    const sortOptions = {}
    
    if (sortBy === "averageRating") {
        sortOptions.averageRating = sortType === "desc" ? -1 : 1
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy === "totalViews") {
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        // Default sort by creation date
        sortOptions.createdAt = -1
    }
    
    // Execute aggregation pipeline
    const posts = await Post.aggregate([
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
                            avatar: 1,
                            stores: 1,
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
    const totalPosts = await Post.countDocuments(matchStage)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalPosts / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPosts,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Posts fetched successfully")
    )
})

// Get single post by ID
const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Use aggregation to get post with owner details
    const post = await Post.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(postId),
                isPublished: true // Only fetch published posts
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
    ])
    
    // Check if post exists
    if (!post || post.length === 0) {
        throw new ApiError(404, "Post not found");
    }
    
    // Increment view count
    await Post.findByIdAndUpdate(postId, {
        $inc: { views: 1, totalViews: 1 }
    })
    
    return res.status(200).json(
        new ApiResponse(200, post[0], "Post fetched successfully")
    );
})

// Create new post
const publishPost = asyncHandler(async (req, res) => {
    const { title, description, category, store, pattern, productId ,...socialPayload} = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    // Check if category exists, create if not
    const categoryExists = await Categoury.findOne({categouryname: category});
    if (!categoryExists) {  
        await Categoury.create({categouryname: category});
    }

    const user = await User.findById(req.userVerfied._id);
    if (!user) throw new ApiError(404, "User not found");

    // NEW VALIDATION: Check for video files and thumbnail conflict
    const hasVideoFiles = req.files?.videoFiles && req.files.videoFiles.length > 0;
    const hasThumbnail = req.files?.thumbnail && req.files.thumbnail.length > 0;
    
    if (!hasVideoFiles && hasThumbnail) {
        throw new ApiError(400, "Cannot upload thumbnail when video files are  not present. Video posts don't require thumbnails.");
    }


    try {
        // Process social links for creation
        const socialLinks = processSocialLinks(user, socialPayload);

        // Initialize media arrays
        let imageFiles = [];
        let videoFiles = [];
        let audioFiles = [];
        let thumbnailUrl = null;

        // Handle thumbnail upload
        if (req.files?.thumbnail) {
            const thumbnailLocalPath = req.files.thumbnail[0]?.path;
            if (thumbnailLocalPath) {
                const thumbnail = await uploadResult(thumbnailLocalPath);
                if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");
                thumbnailUrl = thumbnail.url;
            }
        }

        // Handle image uploads
        if (req.files?.imageFiles) {
            for (const imageFile of req.files.imageFiles) {
                const result = await uploadResult(imageFile.path);
                if (!result?.url) throw new ApiError(400, "Image upload failed");
                imageFiles.push(result.url);
            }
        }

        // Handle video uploads
        if (req.files?.videoFiles) {
            for (const videoFile of req.files.videoFiles) {
                const result = await uploadResult(videoFile.path);
                if (!result?.url) throw new ApiError(400, "Video upload failed");
                videoFiles.push(result.url);
            }
        }

        // Handle audio uploads
        if (req.files?.audioFiles) {
            for (const audioFile of req.files.audioFiles) {
                const result = await uploadResult(audioFile.path);
                if (!result?.url) throw new ApiError(400, "Audio upload failed");
                audioFiles.push(result.url);
            }
        }

        // Create post with array lengths as counts
        const post = await Post.create({
            title,
            description,
            category,
            productId,
            thumbnail: thumbnailUrl,
            imageFiles,
            videoFile: videoFiles,
            audioFile: audioFiles,
            imagecount: imageFiles.length,
            videocount: videoFiles.length,
            audiocount: audioFiles.length,
            pattern: pattern || 'single', // Use provided pattern or default
            owner: user._id,
            store: Boolean(store),
            ...socialLinks.socialLinks
        });

        // Register in content registry
        await ContentRegistry.create({
            originalId: post._id,
            contentType: "post"
        });

        // Populate owner details for response
        const populatedPost = await Post.findById(post._id)
            .populate('owner', 'username fullName avatar');

        return res.status(201).json(
            new ApiResponse(201, populatedPost, "Post created successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
});

// Update existing post
const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, description, category, pattern, ...socialPayload } = req.body;
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");
    
    // Check ownership
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    try {
        // Process social links for update
        const user = await User.findById(req.userVerfied._id);
        const updateOps = processSocialLinks(user, socialPayload, post);
        
        // Initialize $set if it doesn't exist
        if (!updateOps.$set) updateOps.$set = {};
        
        // Add basic field updates if provided
        if (title) updateOps.$set.title = title;
        if (description) updateOps.$set.description = description;
        if (category) updateOps.$set.category = category;
        if (pattern) updateOps.$set.pattern = pattern;

        // Handle thumbnail upload (only if provided)
        if (req.files?.thumbnail) {
            const thumbnailLocalPath = req.files.thumbnail[0]?.path;
            if (thumbnailLocalPath) {
                const thumbnail = await uploadResult(thumbnailLocalPath);
                if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");
                updateOps.$set.thumbnail = thumbnail.url;
            }
        }

        // Handle media file updates and calculate new counts from array lengths
        let shouldUpdatePattern = false;
        
        // Handle new image uploads
        if (req.files?.imageFiles) {
            const newImageFiles = [...post.imageFiles];
            for (const imageFile of req.files.imageFiles) {
                const result = await uploadResult(imageFile.path);
                if (!result?.url) throw new ApiError(400, "Image upload failed");
                newImageFiles.push(result.url);
            }
            updateOps.$set.imageFiles = newImageFiles;
            updateOps.$set.imagecount = newImageFiles.length; // Set count to array length
            shouldUpdatePattern = true;
        }

        // Handle new video uploads
        if (req.files?.videoFiles) {
            const newVideoFiles = [...post.videoFile];
            for (const videoFile of req.files.videoFiles) {
                const result = await uploadResult(videoFile.path);
                if (!result?.url) throw new ApiError(400, "Video upload failed");
                newVideoFiles.push(result.url);
            }
            updateOps.$set.videoFile = newVideoFiles;
            updateOps.$set.videocount = newVideoFiles.length; // Set count to array length
            shouldUpdatePattern = true;
        }

        // Handle new audio uploads
        if (req.files?.audioFiles) {
            const newAudioFiles = [...post.audioFile];
            for (const audioFile of req.files.audioFiles) {
                const result = await uploadResult(audioFile.path);
                if (!result?.url) throw new ApiError(400, "Audio upload failed");
                newAudioFiles.push(result.url);
            }
            updateOps.$set.audioFile = newAudioFiles;
            updateOps.$set.audiocount = newAudioFiles.length; // Set count to array length
            shouldUpdatePattern = true;
        }

        // Only update pattern if explicitly provided in request
        if (pattern) {
            updateOps.$set.pattern = pattern;
        }
        
        // Check if there's anything to update
        if (Object.keys(updateOps).length === 0 || 
            (Object.keys(updateOps).length === 1 && 
             Object.keys(updateOps.$set || {}).length === 0)) {
            throw new ApiError(400, "No updates provided");
        }
        
        // Perform update
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            updateOps,
            { new: true }
        ).populate('owner', 'username fullName avatar');
        
        return res.status(200).json(
            new ApiResponse(200, updatedPost, "Post updated successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
});

// Delete post
const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    // Check if the user is the owner of the post
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }
    
    // Remove from content registry
    await ContentRegistry.findOneAndDelete({
        originalId: postId,
        contentType: "post"
    });

    // Delete the post (this will also trigger cascading delete for comments)
    await Post.findByIdAndDelete(postId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
})

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    // Check if the user is the owner of the post
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    // Toggle the publish status
    post.isPublished = !post.isPublished;
    
    // Save the post
    await post.save();
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { isPublished: post.isPublished }, 
            `Post ${post.isPublished ? 'published' : 'unpublished'} successfully`
        )
    );
})

// Increment view count when a social link is clicked
const incrementSocialLinkView = asyncHandler(async (req, res) => {
    const { postId, linkType } = req.params
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID")
    }
    
    if (!["whatsapp", "storeLink", "facebook", "instagram", "productlink"].includes(linkType)) {
        throw new ApiError(400, "Invalid link type")
    }
    
    // Find the post
    const post = await Post.findById(postId)
    
    if (!post) {
        throw new ApiError(404, "Post not found")
    }
    
    // Check if the requested link type exists on this post
    if (!post[linkType]) {
        throw new ApiError(404, "This post doesn't have the requested social link")
    }
    
    // Increment view count
    post.totalViews += 1
    await post.save()
    
    // Return the link URL
    return res.status(200).json(
        new ApiResponse(200, { 
            url: post[linkType],
            totalViews: post.totalViews
        }, "View counted and link retrieved")
    )
})

// Remove specific media files from post
const removeMediaFiles = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { imageUrls = [], videoUrls = [], audioUrls = [] } = req.body;
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");
    
    // Check ownership
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    const updateOps = { $set: {} };
    
    // Remove specified image files and update count
    if (imageUrls.length > 0) {
        const filteredImages = post.imageFiles.filter(url => !imageUrls.includes(url));
        updateOps.$set.imageFiles = filteredImages;
        updateOps.$set.imagecount = filteredImages.length; // Count based on array length
    }
    
    // Remove specified video files and update count
    if (videoUrls.length > 0) {
        const filteredVideos = post.videoFile.filter(url => !videoUrls.includes(url));
        updateOps.$set.videoFile = filteredVideos;
        updateOps.$set.videocount = filteredVideos.length; // Count based on array length
    }
    
    // Remove specified audio files and update count
    if (audioUrls.length > 0) {
        const filteredAudio = post.audioFile.filter(url => !audioUrls.includes(url));
        updateOps.$set.audioFile = filteredAudio;
        updateOps.$set.audiocount = filteredAudio.length; // Count based on array length
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
        postId,
        updateOps,
        { new: true }
    ).populate('owner', 'username fullName avatar');
    
    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Media files removed successfully")
    );
});

// Error handling helper
const handleSocialLinkError = (error) => {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Operation failed: ${error.message}`);
};

export {
    getAllPosts,
    publishPost,
    getPostById,
    updatePost,
    deletePost,
    togglePublishStatus,
    incrementSocialLinkView,
    removeMediaFiles
}