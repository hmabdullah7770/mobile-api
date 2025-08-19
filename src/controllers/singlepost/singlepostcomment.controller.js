import mongoose, { isValidObjectId } from "mongoose";
import { SinglePostComment } from "../../models/singlepost/singlepostcomment.model.js";
import { SinglePost } from "../../models/singlepost/singlepost.model.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadResult } from "../../utils/Claudnary.js";

// Get comments for a specific single post
export const getSinglePostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");

    const post = await SinglePost.findOne({ _id: postId, isPublished: true });
    if (!post) throw new ApiError(404, "Single post not found");

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const comments = await SinglePostComment.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(postId), isReply: false } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $addFields: { owner: { $arrayElemAt: ["$owner", 0] } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNumber }
    ]);
    const totalComments = await SinglePostComment.countDocuments({ postId, isReply: false });
    const totalPages = Math.ceil(totalComments / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalComments,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        }, "Single post comments fetched successfully")
    );
});

// Add comment to a single post
export const addSinglePostComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");
    if (!content || !content.trim()) throw new ApiError(400, "Comment content is required");

    const postExists = await SinglePost.exists({ _id: postId, isPublished: true });
    if (!postExists) throw new ApiError(404, "Single post not found or not published");

    const comment = await SinglePostComment.create({
        content,
        postId,
        owner: req.userVerfied._id
    });

    const owner = {
        _id: req.userVerfied._id,
        username: req.userVerfied.username,
        fullName: req.userVerfied.fullName,
        avatar: req.userVerfied.avatar
    };
    const responseComment = { ...comment.toObject(), owner };
    return res.status(201).json(
        new ApiResponse(201, responseComment, "Comment added to single post successfully")
    );
});

// Add reply to a comment
export const addSinglePostReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
    if (!content || !content.trim()) throw new ApiError(400, "Reply content is required");

    const parentComment = await SinglePostComment.findOne({ _id: commentId });
    if (!parentComment) throw new ApiError(404, "Parent comment not found");

    const reply = await SinglePostComment.create({
        content,
        postId: parentComment.postId,
        owner: req.userVerfied._id,
        parentComment: commentId,
        isReply: true
    });

    const owner = {
        _id: req.userVerfied._id,
        username: req.userVerfied.username,
        fullName: req.userVerfied.fullName,
        avatar: req.userVerfied.avatar
    };
    const responseReply = { ...reply.toObject(), owner };
    return res.status(201).json(
        new ApiResponse(201, responseReply, "Reply added to single post comment successfully")
    );
});

// Get replies for a specific comment
export const getSinglePostReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");

    const parentComment = await SinglePostComment.findOne({ _id: commentId });
    if (!parentComment) throw new ApiError(404, "Parent comment not found");

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const replies = await SinglePostComment.aggregate([
        { $match: { parentComment: new mongoose.Types.ObjectId(commentId), isReply: true } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $addFields: { owner: { $arrayElemAt: ["$owner", 0] } } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNumber }
    ]);
    const totalReplies = await SinglePostComment.countDocuments({ parentComment: commentId, isReply: true });
    const totalPages = Math.ceil(totalReplies / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            replies,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalReplies,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        }, "Single post comment replies fetched successfully")
    );
});
