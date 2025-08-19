import mongoose, { isValidObjectId } from "mongoose";
import { SinglePost } from "../../models/singlepost/singlepost.model.js";
import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadResult } from "../../utils/Claudnary.js";
import Categoury from "../../models/categoury.model.js";

// Helper: Remove empty media arrays if counts are zero
const pruneEmptyMediaFields = (doc) => {
    if (!doc || typeof doc !== 'object') return doc;
    const pruned = { ...doc };
    if ((pruned.imagecount ?? (Array.isArray(pruned.imageFiles) ? pruned.imageFiles.length : 0)) === 0) {
        delete pruned.imageFiles;
    }
    if ((pruned.videocount ?? (Array.isArray(pruned.videoFiles) ? pruned.videoFiles.length : 0)) === 0) {
        delete pruned.videoFiles;
    }
    return pruned;
};

// Get all single posts (with pagination, filtering)
export const getAllSinglePosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, sortBy = "createdAt", sortType = "desc", userId } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const matchStage = {};
    if (category) matchStage.category = category;
    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }
    matchStage.isPublished = true;

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;

    let posts = await SinglePost.aggregate([
        { $match: matchStage },
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
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limitNumber }
    ]);
    posts = posts.map(pruneEmptyMediaFields);

    const totalPosts = await SinglePost.countDocuments(matchStage);
    const totalPages = Math.ceil(totalPosts / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPosts,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        }, "Single posts fetched successfully")
    );
});

// Get single post by ID
export const getSinglePostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");

    let post = await SinglePost.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(postId), isPublished: true } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        { $addFields: { owner: { $arrayElemAt: ["$owner", 0] } } }
    ]);
    if (!post || post.length === 0) throw new ApiError(404, "Single post not found");

    await SinglePost.findByIdAndUpdate(postId, { $inc: { views: 1, totalViews: 1 } });

    return res.status(200).json(
        new ApiResponse(200, pruneEmptyMediaFields(post[0]), "Single post fetched successfully")
    );
});

// Create/publish a new single post (carousel or single)
export const publishSinglePost = asyncHandler(async (req, res) => {
    const { title, description, category, store, pattern, productId } = req.body;
    if (!title || !description) throw new ApiError(400, "Title and description are required");
    if (!category) throw new ApiError(400, "Category is required");

    // Ensure category exists
    const categoryExists = await Categoury.findOne({ categouryname: category });
    if (!categoryExists) await Categoury.create({ categouryname: category });

    const user = await User.findById(req.userVerfied._id);
    if (!user) throw new ApiError(404, "User not found");

    // Upload files
    let thumbnailUrl = null;
    let imageResults = {};
    let videoResults = {};

    const uploadTasks = [];
    if (req.files?.thumbnail?.length) {
        uploadTasks.push(
            uploadResult(req.files.thumbnail[0].path)
                .then(result => { if (!result?.url) throw new Error("Thumbnail upload failed"); thumbnailUrl = result.url; })
        );
    }
    for (let i = 1; i <= 5; i++) {
        const imgField = `imageFile${i}`;
        if (req.files?.[imgField] && req.files[imgField].length > 0) {
            uploadTasks.push(
                uploadResult(req.files[imgField][0].path)
                    .then(result => { if (!result?.url) throw new Error(`Image file ${i} upload failed`); imageResults[i] = result.url; })
            );
        }
        const vidField = `videoFile${i}`;
        if (req.files?.[vidField] && req.files[vidField].length > 0) {
            uploadTasks.push(
                uploadResult(req.files[vidField][0].path)
                    .then(result => { if (!result?.url) throw new Error(`Video file ${i} upload failed`); videoResults[i] = result.url; })
            );
        }
    }
    await Promise.all(uploadTasks);

    // Format media arrays
    const formattedImageFiles = Object.keys(imageResults)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(position => ({
            url: imageResults[position],
            Imageposition: parseInt(position)
        }));

    // Autoplay flags (from req.body: autoplay1, autoplay2, ...)
    const parseAutoplayFlag = (val) => {
        if (val === undefined || val === null) return false;
        if (typeof val === 'boolean') return val;
        const s = String(val).trim().toLowerCase();
        return ['1', 'true', 'yes', 'on'].includes(s);
    };
    const autoplayFlags = {
        1: req.body.autoplay1, 2: req.body.autoplay2, 3: req.body.autoplay3, 4: req.body.autoplay4, 5: req.body.autoplay5
    };
    const formattedVideoFiles = Object.keys(videoResults)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(position => ({
            url: videoResults[position],
            Videoposition: parseInt(position),
            autoplay: parseAutoplayFlag(autoplayFlags[position])
        }));

    // Prepare post data (only allowed fields)
    const postData = {
        title,
        description,
        category,
        productId,
        thumbnail: thumbnailUrl || undefined,
        imagecount: formattedImageFiles.length,
        videocount: formattedVideoFiles.length,
        pattern: pattern || 'single',
        owner: user._id,
        store: Boolean(store),
    };
    if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
    if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;

    // Remove undefined fields
    Object.keys(postData).forEach(key => { if (postData[key] === undefined) delete postData[key]; });

    const post = await SinglePost.create(postData);

    // Populate owner details for response
    const populatedPost = await SinglePost.findById(post._id)
        .populate('owner', 'username fullName avatar')
        .lean();

    return res.status(200).json(
        new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Single post created successfully")
    );
});