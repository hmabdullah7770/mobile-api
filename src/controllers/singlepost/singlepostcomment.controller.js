import mongoose, { isValidObjectId } from "mongoose"
import {NewComment} from "../models/newcomment.model.js"
import {Post} from "../models/post.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadResult } from "../utils/Claudnary.js"

// Get comments for a specific post
const newGetComments = asyncHandler(async (req, res) => {
    const {postId} = req.params;
    const {page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query;
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Check if post exists and is published
    const post = await Post.findOne({_id: postId, isPublished: true});
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Prepare sort options
    const sortOptions = {};
    
    if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Default sort by newest first
    }
    
    // Get comments with populated user info and reply count
    const commentsAggregate = NewComment.aggregate([
        {
            $match: {
                postId: new mongoose.Types.ObjectId(postId),
                isReply: false // Only get top-level comments
            }
        },
        {
            // Look up reply count
            $lookup: {
                from: "newcomments",
                let: { commentId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$parentComment", "$commentId"] },
                                    { $eq: ["$isReply", true] }
                                ]
                            }
                        }
                    },
                    {
                        $count: "replyCount"
                    }
                ],
                as: "repliesInfo"
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
                owner: { $arrayElemAt: ["$owner", 0] },
                replyCount: {
                    $cond: [
                        { $gt: [{ $size: "$repliesInfo" }, 0] },
                        { $arrayElemAt: ["$repliesInfo.replyCount", 0] },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                repliesInfo: 0 // Remove the array
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
    ]);
    
    const result = await commentsAggregate.exec();
    
    // Get total count for pagination (only top-level comments)
    const totalComments = await NewComment.countDocuments({
        postId: postId,
        isReply: false
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalComments / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            comments: result,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalComments,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Post comments fetched successfully")
    );
});

// // Add comment to a post (text/audio/video/sticker)
// const newAddComment = asyncHandler(async (req, res) => {
//     const { postId } = req.params;
//     const { content } = req.body;
    
//     if (!isValidObjectId(postId)) {
//         throw new ApiError(400, "Invalid post ID");
//     }
    
//     // Validate at least one input (text or media)
//     const hasText = Boolean(content && content.trim());
//     const hasAudio = Boolean(req.files?.audioComment && req.files.audioComment.length > 0);
//     const hasVideo = Boolean(req.files?.videoComment && req.files.videoComment.length > 0);
//     const hasSticker = Boolean(req.files?.sticker && req.files.sticker.length > 0);
//     if (!hasText && !hasAudio && !hasVideo && !hasSticker) {
//         throw new ApiError(400, "Provide text or at least one media (audio/video/sticker)");
//     }
    
//     // Fetch the post and check if it exists and is published
//     const post = await Post.findById(postId);
    
//     if (!post || !post.isPublished) {
//         throw new ApiError(404, "Post not found or not published");
//     }
    
//     // Upload any provided media
//     let audioUrl = null;
//     let videoUrl = null;
//     let stickerUrl = null;

//     const uploadTasks = [];
//     if (hasAudio) {
//         uploadTasks.push(
//             uploadResult(req.files.audioComment[0].path).then(r => { if (!r?.url) throw new Error("Audio upload failed"); audioUrl = r.url; })
//         );
//     }
//     if (hasVideo) {
//         uploadTasks.push(
//             uploadResult(req.files.videoComment[0].path).then(r => { if (!r?.url) throw new Error("Video upload failed"); videoUrl = r.url; })
//         );
//     }
//     if (hasSticker) {
//         uploadTasks.push(
//             uploadResult(req.files.sticker[0].path).then(r => { if (!r?.url) throw new Error("Sticker upload failed"); stickerUrl = r.url; })
//         );
//     }
//     if (uploadTasks.length > 0) {
//         await Promise.all(uploadTasks);
//     }

//     // Create comment
//     const comment = await NewComment.create({
//         content: hasText ? content : undefined,
//         postId: postId,
//         owner: req.userVerfied._id,
//         audioUrl: audioUrl || undefined,
//         videoUrl: videoUrl || undefined,
//         stickerUrl: stickerUrl || undefined
//     });
    
//     // Return comment with user info
//     const populatedComment = await NewComment.findById(comment._id).populate("owner", "username fullName avatar");
    
//     return res.status(201).json(
//         new ApiResponse(201, populatedComment, "Comment added to post successfully")
//     );
// });



// Add comment to a post (text/audio/video/sticker)
const newAddComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Validate at least one input (text or media)
    const hasText = Boolean(content && content.trim());
    const hasAudio = Boolean(req.files?.audioComment && req.files.audioComment.length > 0);
    const hasVideo = Boolean(req.files?.videoComment && req.files.videoComment.length > 0);
    const hasSticker = Boolean(req.files?.sticker && req.files.sticker.length > 0);
    if (!hasText && !hasAudio && !hasVideo && !hasSticker) {
        throw new ApiError(400, "Provide text or at least one media (audio/video/sticker)");
    }
    
    // Lightweight existence check for published post
    const postExists = await Post.exists({ _id: postId, isPublished: true });
    if (!postExists) {
        throw new ApiError(404, "Post not found or not published");
    }
    
    // Upload any provided media
    let audioUrl = null;
    let videoUrl = null;
    let stickerUrl = null;

    const uploadTasks = [];
    if (hasAudio) {
        uploadTasks.push(
            uploadResult(req.files.audioComment[0].path).then(r => { if (!r?.url) throw new ApiError("Audio upload failed"); audioUrl = r.url; })
        );
    }
    if (hasVideo) {
        uploadTasks.push(
            uploadResult(req.files.videoComment[0].path).then(r => { if (!r?.url) throw new ApiError("Video upload failed"); videoUrl = r.url; })
        );
    }
    if (hasSticker) {
        uploadTasks.push(
            uploadResult(req.files.sticker[0].path).then(r => { if (!r?.url) throw new ApiError("Sticker upload failed"); stickerUrl = r.url; })
        );
    }
    if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
    }
    
    // Create comment
    const comment = await NewComment.create({
        content: hasText ? content : undefined,
        postId: postId,
        owner: req.userVerfied._id,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
        stickerUrl: stickerUrl || undefined
    });
    
    // Return comment with owner info directly from auth context to avoid extra DB populate
    const owner = {
        _id: req.userVerfied._id,
        username: req.userVerfied.username,
        fullName: req.userVerfied.fullName,
        avatar: req.userVerfied.avatar
    };
    const responseComment = {
        ...comment.toObject(),
        owner
    };
    return res.status(201).json(
        new ApiResponse(201, responseComment, "Comment added to post successfully")
    );
});

// Update comment on a post
const newUpdateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;
    
    // Validate input
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    // Find comment and ensure it exists
    const comment = await NewComment.findOne({
        _id: commentId
    });
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    // Check if user is the owner of comment
    if (comment.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    
    // Prepare update
    const updatePayload = {};
    if (content && content.trim()) {
        updatePayload.content = content;
    }
    // Optional media updates (replace if new files are provided)
    if (req.files?.audioComment && req.files.audioComment.length > 0) {
        const r = await uploadResult(req.files.audioComment[0].path);
        if (!r?.url) throw new ApiError(400, "Audio upload failed");
        updatePayload.audioUrl = r.url;
    }
    if (req.files?.videoComment && req.files.videoComment.length > 0) {
        const r = await uploadResult(req.files.videoComment[0].path);
        if (!r?.url) throw new ApiError(400, "Video upload failed");
        updatePayload.videoUrl = r.url;
    }
    if (req.files?.sticker && req.files.sticker.length > 0) {
        const r = await uploadResult(req.files.sticker[0].path);
        if (!r?.url) throw new ApiError(400, "Sticker upload failed");
        updatePayload.stickerUrl = r.url;
    }
    if (Object.keys(updatePayload).length === 0) {
        throw new ApiError(400, "No updates provided");
    }
    // Update comment
    const updatedComment = await NewComment.findByIdAndUpdate(
        commentId,
        updatePayload,
        { new: true }
    ).populate("owner", "username fullName avatar");
    
    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Post comment updated successfully")
    );
});

// Delete comment from a post
const newDeleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {postId} = req.body;
    
    if (!isValidObjectId(commentId) || !isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid comment ID or post ID");
    }
    
    // Find comment with specific query for post
    const comment = await NewComment.findOne({
        _id: commentId,
        postId: postId
    });
    
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    
    // Check if user is the owner of comment
    if (comment.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }
    
    // Delete the comment and its replies using schema static
    await NewComment.findByIdAndDelete(commentId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Post comment and its replies deleted successfully")
    );
});

// Get comments with ratings for a post
const newGetCommentsWithRatings = asyncHandler(async (req, res) => {
    const {postId} = req.params;
    const {page = 1, limit = 10, sortBy = "createdAt", sortType = "desc"} = req.query;
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Check if post exists and is published
    const post = await Post.findOne({_id: postId, isPublished: true});
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Aggregate pipeline to get comments and join with ratings
    const commentsWithRatings = await NewComment.aggregate([
        {
            $match: {
                postId: new mongoose.Types.ObjectId(postId),
                isReply: false // Only get top-level comments
            }
        },
        // Join with ratings collection
        {
            $lookup: {
                from: "ratings",
                let: { 
                    contentId: "$contentId", 
                    contentType: "$contentType",
                    owner: "$owner" 
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$contentId", "$$contentId"] },
                                    { $eq: ["$contentType", "$$contentType"] },
                                    { $eq: ["$owner", "$$owner"] }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            rating: 1,
                            _id: 0
                        }
                    }
                ],
                as: "ratingInfo"
            }
        },
        // Join with users collection
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
        // Format the output
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] },
                rating: {
                    $cond: [
                        { $gt: [{ $size: "$ratingInfo" }, 0] },
                        { $arrayElemAt: ["$ratingInfo.rating", 0] },
                        null
                    ]
                }
            }
        },
        {
            $project: {
                ratingInfo: 0 // Remove the array
            }
        },
        // Sort, skip, limit
        {
            $sort: sortBy === "rating" && sortType ? 
                   { rating: sortType === "desc" ? -1 : 1 } : 
                   { [sortBy]: sortType === "desc" ? -1 : 1 }
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ]);
    
    // Get total count for pagination
    const totalComments = await NewComment.countDocuments({
        postId: postId, 
        isReply: false
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalComments / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            comments: commentsWithRatings,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalComments,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Post comments with ratings fetched successfully")
    );
});

// Add a reply to a comment on a post (text/audio/video/sticker)
const newAddReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    const hasText = Boolean(content && content.trim());
    const hasAudio = Boolean(req.files?.audioComment && req.files.audioComment.length > 0);
    const hasVideo = Boolean(req.files?.videoComment && req.files.videoComment.length > 0);
    const hasSticker = Boolean(req.files?.sticker && req.files.sticker.length > 0);
    if (!hasText && !hasAudio && !hasVideo && !hasSticker) {
        throw new ApiError(400, "Provide text or at least one media (audio/video/sticker)");
    }
    
    // Find the parent comment and ensure it's for a post
    const parentComment = await NewComment.findOne({
        _id: commentId
    });
    
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }
    
    // Upload any provided media
    let audioUrl = null;
    let videoUrl = null;
    let stickerUrl = null;
    const uploadTasks = [];
    if (hasAudio) {
        uploadTasks.push(
            uploadResult(req.files.audioComment[0].path).then(r => { if (!r?.url) throw new Error("Audio upload failed"); audioUrl = r.url; })
        );
    }
    if (hasVideo) {
        uploadTasks.push(
            uploadResult(req.files.videoComment[0].path).then(r => { if (!r?.url) throw new Error("Video upload failed"); videoUrl = r.url; })
        );
    }
    if (hasSticker) {
        uploadTasks.push(
            uploadResult(req.files.sticker[0].path).then(r => { if (!r?.url) throw new Error("Sticker upload failed"); stickerUrl = r.url; })
        );
    }
    if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
    }
    
    // Create the reply
    const reply = await NewComment.create({
        content: hasText ? content : undefined,
        postId: parentComment.postId,
        owner: req.userVerfied._id,
        parentComment: commentId,
        isReply: true,
        audioUrl: audioUrl || undefined,
        videoUrl: videoUrl || undefined,
        stickerUrl: stickerUrl || undefined
    });
    
    // Return reply with user info
    const populatedReply = await NewComment.findById(reply._id)
        .populate("owner", "username fullName avatar");
    
    return res.status(201).json(
        new ApiResponse(201, populatedReply, "Reply added to post comment successfully")
    );
});

// Get replies for a specific comment on a post
const newGetReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;
    
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    // Check if parent comment exists and is for a post
    const parentComment = await Comment.findOne({
        _id: commentId,
        contentType: "post"
    });
    
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Prepare sort options
    const sortOptions = {};
    
    if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
    } else {
        sortOptions.createdAt = -1; // Default sort by newest first
    }
    
    // Get replies with populated user info
    const repliesAggregate = NewComment.aggregate([
        {
            $match: {
                parentComment: new mongoose.Types.ObjectId(commentId),
                isReply: true
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
    ]);
    
    const result = await repliesAggregate.exec();
    
    // Get total count for pagination
    const totalReplies = await NewComment.countDocuments({
        parentComment: commentId,
        isReply: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalReplies / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            replies: result,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalReplies,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Post comment replies fetched successfully")
    );
});

export {
    newGetComments,
    newAddComment,
    newUpdateComment,
    newDeleteComment,
    newGetCommentsWithRatings,
    newAddReply,
    newGetReplies
}
