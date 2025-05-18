import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Followlist } from "../models/followlist.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleFollow = asyncHandler(async (req, res) => {
    const {followingId} = req.params
    
    // Validate followingId
    if (!isValidObjectId(followingId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user to follow exists
    const followingUser = await User.findById(followingId)
    
    if (!followingUser) {
        throw new ApiError(404, "User not found")
    }
    
    // User cannot follow themselves
    if (followingId === req.userVerfied._id.toString()) {
        throw new ApiError(400, "You cannot follow yourself")
    }
    
    // Check if follow relationship already exists
    const existingFollow = await Followlist.findOne({
        follower: req.userVerfied._id,
        following: followingId
    })
    
    // If follow exists, remove it (unfollow)
    if (existingFollow) {
        await Followlist.findByIdAndDelete(existingFollow._id)
        
        return res.status(200).json(
            new ApiResponse(
                200, 
                { followed: false }, 
                "Unfollowed successfully"
            )
        )
    }
    
    // If follow doesn't exist, create it (follow)
    const follow = await Followlist.create({
        follower: req.userVerfied._id,
        following: followingId
    })
    
    if (!follow) {
        throw new ApiError(500, "Failed to follow")
    }
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { followed: true }, 
            "Followed successfully"
        )
    )
})

// Controller to return subscriber list of a channel
const getUserFollowers = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user exists
    const user = await User.findById(userId)
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber
    
    // Aggregate to get followers with user details
    const followers = await Followlist.aggregate([
        {
            $match: {
                following: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "follower",
                foreignField: "_id",
                as: "follower",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                follower: { $arrayElemAt: ["$follower", 0] }
            }
        },
        {
            $sort: { createdAt: -1 } // Latest followers first
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination
    const totalFollowers = await Followlist.countDocuments({
        following: userId
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalFollowers / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                followers,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalFollowers,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }, 
            "User followers fetched successfully"
        )
    )
})
// Controller to return channel list to which user has subscribed
const getUserFollowing = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user exists
    const user = await User.findById(userId)
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber
    
    // Aggregate to get following users with details
    const following = await Followlist.aggregate([
        {
            $match: {
                follower: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "following",
                foreignField: "_id",
                as: "following",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                following: { $arrayElemAt: ["$following", 0] }
            }
        },
        {
            $sort: { createdAt: -1 } // Latest following first
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination
    const totalFollowing = await Followlist.countDocuments({
        follower: userId
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalFollowing / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                following,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalFollowing,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }, 
            "User following list fetched successfully"
        )
    )
})

// Check if user is subscribed to a channel
const isFollowing = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if follow relationship exists
    const follow = await Followlist.findOne({
        follower: req.userVerfied._id,
        following: userId
    })
    
    return res.status(200).json(
        new ApiResponse(
            200,
            { following: !!follow },
            "Follow status fetched successfully"
        )
    )
})

// Get subscription count
const getUserFollowStats = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    
    // Check if user exists
    const user = await User.findById(userId)
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    // Get follower count
    const followerCount = await Followlist.countDocuments({
        following: userId
    })
    
    // Get following count
    const followingCount = await Followlist.countDocuments({
        follower: userId
    })
    
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                followerCount,
                followingCount
            },
            "User follow stats fetched successfully"
        )
    )
})
export {
    toggleFollow,
    getUserFollowers,
    getUserFollowing,
    isFollowing,
    getUserFollowStats
}