import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { SinglePost } from "../../models/singlepost/singlepost.model.js";
import Categoury from "../../models/categoury.model.js";
import mongoose from "mongoose";

// Get single post by category (with pagination)
export const getSinglePostsByCategory = asyncHandler(async (req, res) => {
    const { category, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    if (!category) throw new ApiError(400, "Category name is required");

    const matchCondition = { isPublished: true };
    if (category !== 'All') matchCondition.category = category;

    const pipeline = [
        { $match: matchCondition },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parsedLimit + 1 },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                store: 1, title: 1, description: 1, category: 1, thumbnail: 1,
                imageFiles: 1, videoFiles: 1, videocount: 1, imagecount: 1, pattern: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                },
                createdAt: 1, updatedAt: 1
            }
        }
    ];

    const posts = await SinglePost.aggregate(pipeline);
    const hasNextPage = posts.length > parsedLimit;
    if (hasNextPage) posts.pop();

    if (posts.length === 0 && category !== 'All') throw new ApiError(404, "No single posts found in this category");

    return res.status(200).json(
        new ApiResponse(200, `${category === 'All' ? 'All categories' : 'Category'} single posts fetched successfully`, {
            posts,
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parsedLimit,
                totalSkip: skip,
                hasNextPage,
                hasPrevPage: parseInt(page) > 1
            }
        })
    );
});

// Get following users' single posts by category
export const getFollowingSinglePosts = asyncHandler(async (req, res) => {
    const { category, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);
    const currentUserId = req.userVerfied._id;

    if (!category) throw new ApiError(400, "Category name is required");

    const pipeline = [
        { $match: category !== 'All' ? { category } : {} },
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $lookup: {
                from: "followlists",
                let: { postOwnerId: "$owner" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$follower", currentUserId] },
                                    { $eq: ["$following", "$$postOwnerId"] }
                                ]
                            }
                        }
                    },
                    { $limit: 1 }
                ],
                as: "followCheck"
            }
        },
        { $match: { "followCheck.0": { $exists: true } } },
        { $skip: skip },
        { $limit: parsedLimit + 1 },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        {
            $project: {
                title: 1, description: 1, store: 1, category: 1, thumbnail: 1,
                imageFiles: 1, videoFiles: 1, videocount: 1, imagecount: 1, pattern: 1,
                createdAt: 1, updatedAt: 1,
                owner: { $arrayElemAt: ["$ownerDetails", 0] }
            }
        }
    ];

    const posts = await SinglePost.aggregate(pipeline);
    const hasNextPage = posts.length > parsedLimit;
    if (hasNextPage) posts.pop();

    return res.status(200).json(
        new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} single posts fetched`, {
            posts,
            pagination: {
                currentPage: parseInt(page),
                itemsPerPage: parsedLimit,
                hasNextPage,
                hasPrevPage: parseInt(page) > 1
            }
        })
    );
});

