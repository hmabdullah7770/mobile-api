// import mongoose, { isValidObjectId } from "mongoose"
// import {Tweet} from "../models/tweet.model.js"
// import {User} from "../models/user.model.js"
// import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
// import {asyncHandler} from "../utils/asyncHandler.js"

// const createTweet = asyncHandler(async (req, res) => {
//     const { content } = req.body;
    
//     if (!content?.trim()) {
//         throw new ApiError(400, "Content is required");
//     }
    
//     const tweet = await Tweet.create({
//         content,
//         owner: req.userVerfied._id
//     });
    
//     const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");
    
//     if (!createdTweet) {
//         throw new ApiError(500, "Something went wrong while creating the tweet");
//     }
    
//     return res.status(201).json(
//         new ApiResponse(201, createdTweet, "Tweet created successfully")
//     );
// })

// const getUserTweets = asyncHandler(async (req, res) => {
//     const { userId } = req.params;
    
//     if (!isValidObjectId(userId)) {
//         throw new ApiError(400, "Invalid user ID");
//     }
    
//     const tweets = await Tweet.find({ owner: userId })
//         .populate("owner", "username fullName avatar")
//         .sort("-createdAt");
    
//     return res.status(200).json(
//         new ApiResponse(200, tweets, "User tweets fetched successfully")
//     );
// })

// const updateTweet = asyncHandler(async (req, res) => {
//     const { tweetId } = req.params;
//     const { content } = req.body;
    
//     if (!isValidObjectId(tweetId)) {
//         throw new ApiError(400, "Invalid tweet ID");
//     }
    
//     if (!content?.trim()) {
//         throw new ApiError(400, "Content is required");
//     }
    
//     const tweet = await Tweet.findById(tweetId);
    
//     if (!tweet) {
//         throw new ApiError(404, "Tweet not found");
//     }
    
//     if (tweet.owner.toString() !== req.userVerfied._id.toString()) {
//         throw new ApiError(403, "You are not authorized to update this tweet");
//     }
    
//     const updatedTweet = await Tweet.findByIdAndUpdate(
//         tweetId,
//         { content },
//         { new: true }
//     ).populate("owner", "username fullName avatar");
    
//     return res.status(200).json(
//         new ApiResponse(200, updatedTweet, "Tweet updated successfully")
//     );
// })

// const deleteTweet = asyncHandler(async (req, res) => {
//     const { tweetId } = req.params;
    
//     if (!isValidObjectId(tweetId)) {
//         throw new ApiError(400, "Invalid tweet ID");
//     }
    
//     const tweet = await Tweet.findById(tweetId);
    
//     if (!tweet) {
//         throw new ApiError(404, "Tweet not found");
//     }
    
//     if (tweet.owner.toString() !== req.userVerfied._id.toString()) {
//         throw new ApiError(403, "You are not authorized to delete this tweet");
//     }
    
//     await Tweet.findByIdAndDelete(tweetId);
    
//     return res.status(200).json(
//         new ApiResponse(200, {}, "Tweet deleted successfully")
//     );
// })

// export {
//     createTweet,
//     getUserTweets,
//     updateTweet,
//     deleteTweet
// }
