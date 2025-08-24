import mongoose, { isValidObjectId } from "mongoose";
import { Rating } from "../models/rating.model.js";
import { Post } from "../models/post.model.js";   // ✅ unified model
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ======================== GET RATINGS ========================
const getPostRatings = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10, sortBy = "rating", sortType = "desc" } = req.query;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    // Ensure post exists and published
    const post = await Post.findOne({ _id: postId, isPublished: true });
    if (!post) throw new ApiError(404, "Post not found");

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;

    const ratingsAggregate = Rating.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(postId) } },
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

    const result = await ratingsAggregate.exec();
    const totalRatings = await Rating.countDocuments({ postId });

    const totalPages = Math.ceil(totalRatings / limitNumber);

    return res.status(200).json(
        new ApiResponse(200, {
            ratings: result,
            summary: {
                averageRating: post.averageRating,
                totalRatings: post.ratingCount
            },
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalRatings,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            }
        }, "Ratings fetched successfully")
    );
});

// ======================== ADD RATING ========================
const addRating = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { rating, comment } = req.body;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    const post = await Post.findOne({ _id: postId, isPublished: true });
    if (!post) throw new ApiError(404, "Post not found");

    const existingRating = await Rating.findOne({ postId, owner: req.userVerfied._id });
    if (existingRating) throw new ApiError(400, "You have already rated this post.");

    const newRating = await Rating.create({
        rating,
        comment: comment || "",
        postId,
        owner: req.userVerfied._id
    });

    post.totalRating += rating;
    post.ratingCount += 1;
    post.averageRating = post.totalRating / post.ratingCount;
    await post.save();

    const populatedRating = await Rating.findById(newRating._id).populate("owner", "username fullName avatar");

    return res.status(201).json(new ApiResponse(201, populatedRating, "Rating added successfully"));
});

// ======================== UPDATE RATING ========================
const updateRating = asyncHandler(async (req, res) => {
    const { ratingId } = req.params;
    const { rating, comment } = req.body;

    if (!isValidObjectId(ratingId)) throw new ApiError(400, "Invalid rating ID");

    const ratingDoc = await Rating.findById(ratingId);
    if (!ratingDoc) throw new ApiError(404, "Rating not found");

    if (ratingDoc.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    if (rating && (rating < 1 || rating > 5)) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    if (rating && rating !== ratingDoc.rating) {
        const post = await Post.findById(ratingDoc.postId);
        if (!post) throw new ApiError(404, "Post not found");

        post.totalRating = post.totalRating - ratingDoc.rating + rating;
        post.averageRating = post.totalRating / post.ratingCount;
        await post.save();
    }

    const updatedRating = await Rating.findByIdAndUpdate(
        ratingId,
        { $set: { rating, comment } },
        { new: true }
    ).populate("owner", "username fullName avatar");

    return res.status(200).json(new ApiResponse(200, updatedRating, "Rating updated successfully"));
});

// ======================== DELETE RATING ========================
const deleteRating = asyncHandler(async (req, res) => {
    const { ratingId } = req.params;

    if (!isValidObjectId(ratingId)) throw new ApiError(400, "Invalid rating ID");

    const ratingDoc = await Rating.findById(ratingId);
    if (!ratingDoc) throw new ApiError(404, "Rating not found");

    if (ratingDoc.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "Not authorized");
    }

    const post = await Post.findById(ratingDoc.postId);
    if (post) {
        post.totalRating -= ratingDoc.rating;
        post.ratingCount -= 1;
        post.averageRating = post.ratingCount > 0 ? post.totalRating / post.ratingCount : 0;
        await post.save();
    }

    await Rating.findByIdAndDelete(ratingId);

    return res.status(200).json(new ApiResponse(200, {}, "Rating deleted successfully"));
});

// ======================== SUMMARY ========================
const getPostRatingSummary = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");

    const post = await Post.findOne({ _id: postId, isPublished: true });
    if (!post) throw new ApiError(404, "Post not found");

    const ratingDistribution = await Rating.aggregate([
        { $match: { postId: new mongoose.Types.ObjectId(postId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(item => distribution[item._id] = item.count);

    return res.status(200).json(
        new ApiResponse(200, {
            averageRating: post.averageRating,
            totalRatings: post.ratingCount,
            distribution
        }, "Rating summary fetched successfully")
    );
});

// ======================== USER'S RATING ========================
const getUserRatingForPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");
    if (!req.userVerfied?._id) throw new ApiError(401, "Unauthorized");

    const rating = await Rating.findOne({ postId, owner: req.userVerfied._id });

    if (!rating) {
        return res.status(200).json(new ApiResponse(200, null, "User has not rated this post yet"));
    }

    return res.status(200).json(new ApiResponse(200, rating, "User rating fetched successfully"));
});

export {
    getPostRatings,
    addRating,
    updateRating,
    deleteRating,
    getPostRatingSummary,
    getUserRatingForPost
};




// import mongoose, { isValidObjectId } from "mongoose";
// import {Rating} from "../models/rating.model.js";
// import Card from "../models/card.model.js";
// import {Video} from "../models/video.model.js";
// import {ApiError} from "../utils/ApiErrors.js";
// import {ApiResponse} from "../utils/ApiResponse.js";
// import {asyncHandler} from "../utils/asyncHandler.js";

// // Helper function to get the appropriate model based on contentType
// const getContentModel = (contentType) => {
//     switch(contentType) {
//         case "card":
//             return Card;
//         case "video":
//             return Video;
//         default:
//             throw new ApiError(400, "Invalid content type");
//     }
// };

// const getContentRatings = asyncHandler(async (req, res) => {
//     const {contentId, contentType} = req.params;
//     const {page = 1, limit = 10, sortBy = "rating", sortType = "desc"} = req.query;
    
//     if (!isValidObjectId(contentId)) {
//         throw new ApiError(400, "Invalid content ID");
//     }
    
//     if (!["card", "video"].includes(contentType)) {
//         throw new ApiError(400, "Invalid content type");
//     }
    
//     // Get the appropriate model
//     const ContentModel = getContentModel(contentType);
    
//     // Check if content exists and is published
//     const content = await ContentModel.findOne({_id: contentId, isPublished: true});
    
//     if (!content) {
//         throw new ApiError(404, `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} not found`);
//     }
    
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);
//     const skip = (pageNumber - 1) * limitNumber;
    
//     // Prepare sort options
//     const sortOptions = {};
    
//     if (sortBy) {
//         sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
//     } else {
//         sortOptions.rating = -1; // Default sort by rating descending
//     }
    
//     // Get ratings with populated user info
//     const ratingsAggregate = Rating.aggregate([
//         {
//             $match: {
//                 contentId: new mongoose.Types.ObjectId(contentId),
//                 contentType
//             }
//         },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "owner",
//                 pipeline: [
//                     {
//                         $project: {
//                             username: 1,
//                             fullName: 1,
//                             avatar: 1
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $addFields: {
//                 owner: { $arrayElemAt: ["$owner", 0] }
//             }
//         },
//         {
//             $sort: sortOptions
//         },
//         {
//             $skip: skip
//         },
//         {
//             $limit: limitNumber
//         }
//     ]);
    
//     const result = await ratingsAggregate.exec();
    
//     // Get total count for pagination
//     const totalRatings = await Rating.countDocuments({contentId, contentType});
    
//     // Calculate pagination info
//     const totalPages = Math.ceil(totalRatings / limitNumber);
//     const hasNextPage = pageNumber < totalPages;
//     const hasPrevPage = pageNumber > 1;
    
//     return res.status(200).json(
//         new ApiResponse(200, {
//             ratings: result,
//             summary: {
//                 averageRating: content.averageRating,
//                 totalRatings: content.ratingCount
//             },
//             pagination: {
//                 page: pageNumber,
//                 limit: limitNumber,
//                 totalRatings,
//                 totalPages,
//                 hasNextPage,
//                 hasPrevPage
//             }
//         }, "Ratings fetched successfully")
//     );
// });

// const addRating = asyncHandler(async (req, res) => {
//     const {contentId, contentType} = req.params;
//     const {rating, comment} = req.body;
    
//     if (!isValidObjectId(contentId)) {
//         throw new ApiError(400, "Invalid content ID");
//     }
    
//     if (!["card", "video"].includes(contentType)) {
//         throw new ApiError(400, "Invalid content type");
//     }
    
//     // Validate input
//     if (!rating || rating < 1 || rating > 5) {
//         throw new ApiError(400, "Rating is required and must be between 1 and 5");
//     }
    
//     // Get the appropriate model
//     const ContentModel = getContentModel(contentType);
    
//     // Check if content exists and is published
//     const content = await ContentModel.findOne({_id: contentId, isPublished: true});
    
//     if (!content) {
//         throw new ApiError(404, `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} not found`);
//     }
    
//     // Check if user has already rated this content
//     const existingRating = await Rating.findOne({
//         contentId,
//         contentType,
//         owner: req.userVerfied._id
//     });
    
//     if (existingRating) {
//         throw new ApiError(400, `You have already rated this ${contentType}. Please update your existing rating.`);
//     }
    
//     // Create rating
//     const newRating = await Rating.create({
//         rating,
//         comment: comment || "",
//         contentId,
//         contentType,
//         owner: req.userVerfied._id
//     });
    
//     // Update content's rating info
//     content.totalRating += rating;
//     content.ratingCount += 1;
//     content.averageRating = content.totalRating / content.ratingCount;
//     await content.save();
    
//     // Return rating with user info
//     const populatedRating = await Rating.findById(newRating._id).populate("owner", "username fullName avatar");
    
//     return res.status(201).json(
//         new ApiResponse(201, populatedRating, "Rating added successfully")
//     );
// });

// const updateRating = asyncHandler(async (req, res) => {
//     const {ratingId} = req.params;
//     const {rating, comment} = req.body;
    
//     // Validate input
//     if (!rating && !comment) {
//         throw new ApiError(400, "Rating or comment is required");
//     }
    
//     if (rating && (rating < 1 || rating > 5)) {
//         throw new ApiError(400, "Rating must be between 1 and 5");
//     }
    
//     if (!isValidObjectId(ratingId)) {
//         throw new ApiError(400, "Invalid rating ID");
//     }
    
//     // Find rating
//     const ratingDoc = await Rating.findById(ratingId);
    
//     if (!ratingDoc) {
//         throw new ApiError(404, "Rating not found");
//     }
    
//     // Check if user is the owner of the rating
//     if (ratingDoc.owner.toString() !== req.userVerfied._id.toString()) {
//         throw new ApiError(403, "You are not authorized to update this rating");
//     }
    
//     // If rating value is changed, update content's rating info
//     if (rating && rating !== ratingDoc.rating) {
//         const content = await getContentModel(ratingDoc.contentType).findById(ratingDoc.contentId);
        
//         if (!content) {
//             throw new ApiError(404, `${ratingDoc.contentType.charAt(0).toUpperCase() + ratingDoc.contentType.slice(1)} not found`);
//         }
        
//         // Adjust the total rating
//         content.totalRating = content.totalRating - ratingDoc.rating + rating;
//         content.averageRating = content.totalRating / content.ratingCount;
//         await content.save();
//     }
    
//     // Update rating
//     const updateData = {};
//     if (rating) updateData.rating = rating;
//     if (comment !== undefined) updateData.comment = comment;
    
//     const updatedRating = await Rating.findByIdAndUpdate(
//         ratingId,
//         { $set: updateData },
//         { new: true }
//     ).populate("owner", "username fullName avatar");
    
//     return res.status(200).json(
//         new ApiResponse(200, updatedRating, "Rating updated successfully")
//     );
// });

// const deleteRating = asyncHandler(async (req, res) => {
//     const {ratingId} = req.params;
    
//     if (!isValidObjectId(ratingId)) {
//         throw new ApiError(400, "Invalid rating ID");
//     }
    
//     // Find rating
//     const ratingDoc = await Rating.findById(ratingId);
    
//     if (!ratingDoc) {
//         throw new ApiError(404, "Rating not found");
//     }
    
//     // Check if user is the owner of the rating
//     if (ratingDoc.owner.toString() !== req.userVerfied._id.toString()) {
//         throw new ApiError(403, "You are not authorized to delete this rating");
//     }
    
//     // Update content's rating info
//     const content = await getContentModel(ratingDoc.contentType).findById(ratingDoc.contentId);
    
//     if (content) {
//         content.totalRating -= ratingDoc.rating;
//         content.ratingCount -= 1;
//         content.averageRating = content.ratingCount > 0 ? content.totalRating / content.ratingCount : 0;
//         await content.save();
//     }
    
//     // Delete the rating
//     await Rating.findByIdAndDelete(ratingId);
    
//     return res.status(200).json(
//         new ApiResponse(200, {}, "Rating deleted successfully")
//     );
// });

// // Get average rating for a content
// const getContentRatingSummary = asyncHandler(async (req, res) => {
//     const {contentId, contentType} = req.params;
    
//     if (!isValidObjectId(contentId)) {
//         throw new ApiError(400, "Invalid content ID");
//     }
    
//     if (!["card", "video"].includes(contentType)) {
//         throw new ApiError(400, "Invalid content type");
//     }
    
//     // Get the appropriate model
//     const ContentModel = getContentModel(contentType);
    
//     // Check if content exists and is published
//     const content = await ContentModel.findOne({_id: contentId, isPublished: true});
    
//     if (!content) {
//         throw new ApiError(404, `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} not found`);
//     }
    
//     // Get rating distribution
//     const ratingDistribution = await Rating.aggregate([
//         {
//             $match: {
//                 contentId: new mongoose.Types.ObjectId(contentId),
//                 contentType
//             }
//         },
//         {
//             $group: {
//                 _id: "$rating",
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $sort: { _id: -1 }
//         }
//     ]);
    
//     // Prepare distribution data with all ratings (1-5)
//     const distribution = {};
//     for (let i = 1; i <= 5; i++) {
//         distribution[i] = 0;
//     }
    
//     ratingDistribution.forEach(item => {
//         distribution[item._id] = item.count;
//     });
    
//     return res.status(200).json(
//         new ApiResponse(200, {
//             averageRating: content.averageRating,
//             totalRatings: content.ratingCount,
//             distribution
//         }, "Rating summary fetched successfully")
//     );
// });

// // Get user's rating for a content (if exists)
// const getUserRatingForContent = asyncHandler(async (req, res) => {
//     const {contentId, contentType} = req.params;
    
//     if (!isValidObjectId(contentId)) {
//         throw new ApiError(400, "Invalid content ID");
//     }
    
//     if (!["card", "video"].includes(contentType)) {
//         throw new ApiError(400, "Invalid content type");
//     }
    
//     if (!req.userVerfied?._id) {
//         throw new ApiError(401, "Unauthorized request");
//     }
    
//     const rating = await Rating.findOne({
//         contentId,
//         contentType,
//         owner: req.userVerfied._id
//     });
    
//     if (!rating) {
//         return res.status(200).json(
//             new ApiResponse(200, null, "User has not rated this content yet")
//         );
//     }
    
//     return res.status(200).json(
//         new ApiResponse(200, rating, "User rating fetched successfully")
//     );
// });

// export {
//     getContentRatings,
//     addRating,
//     updateRating,
//     deleteRating,
//     getContentRatingSummary,
//     getUserRatingForContent
// };




