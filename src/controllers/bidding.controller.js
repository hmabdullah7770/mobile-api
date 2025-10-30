import { Bidding } from "../models/bidding.model.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import  Product  from "../models/store/store.product.model.js";
import  CreateStore  from "../models/store/store.createstore.model.js";
import {ApiError} from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// ============================================
// 1. ADD BID TO POST (Bid for yourself)
// ============================================
const addBidToPost = asyncHandler(async (req, res) => {
    const { postId, productId, storeId, owner, bidAmount, message } = req.body;
    const userId = req.userVerfied._id;;

    // === Validation ===
    if (!postId || !productId || !storeId || !owner || !bidAmount) {
        throw new ApiError(400, "All fields are required: postId, productId, storeId, owner, bidAmount");
    }

    if (bidAmount <= 0) {
        throw new ApiError(400, "Bid amount must be greater than 0");
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(postId) || 
        !mongoose.isValidObjectId(productId) || 
        !mongoose.isValidObjectId(storeId) || 
        !mongoose.isValidObjectId(owner)) {
        throw new ApiError(400, "Invalid ID format");
    }

    // === Check if resources exist ===
    const [post, product, store, ownerUser] = await Promise.all([
        Post.findById(postId),
        Product.findById(productId),
        CreateStore.findById(storeId),
        User.findById(owner)
    ]);

    if (!post) throw new ApiError(404, "Post not found");
    if (!product) throw new ApiError(404, "Product not found");
    if (!store) throw new ApiError(404, "Store not found");
    if (!ownerUser) throw new ApiError(404, "Post owner not found");

    // === Check if user is bidding on own post ===
    if (userId.toString() === owner.toString()) {
        throw new ApiError(400, "You cannot bid on your own post");
    }

    // === Create bid ===
    const bid = await Bidding.create({
        userId,
        postId,
        productId,
        storeId,
        owner,
        bidAmount,
        message: message || ""
    });

    // Populate user details
    await bid.populate("userId", "username fullName avatar email");

    return res.status(201).json(
        new ApiResponse(201, bid, "Bid placed successfully")
    );
});

// ============================================
// 2. ADD BID TO OTHER USER (Bid for someone else)
// ============================================
const addBidToOtherUser = asyncHandler(async (req, res) => {
    const { postId, productId, storeId, owner, bidAmount, message, bidForUserId } = req.body;
    const userId = req.userVerfied._id;

    // === Validation ===
    if (!postId || !productId || !storeId || !owner || !bidAmount || !bidForUserId) {
        throw new ApiError(400, "All fields are required including bidForUserId");
    }

    if (bidAmount <= 0) {
        throw new ApiError(400, "Bid amount must be greater than 0");
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(postId) || 
        !mongoose.isValidObjectId(productId) || 
        !mongoose.isValidObjectId(storeId) || 
        !mongoose.isValidObjectId(owner) ||
        !mongoose.isValidObjectId(bidForUserId)) {
        throw new ApiError(400, "Invalid ID format");
    }

    // === Check if resources exist ===
    const [post, product, store, ownerUser, bidRecipient] = await Promise.all([
        Post.findById(postId),
        Product.findById(productId),
       CreateStore.findById(storeId),
        User.findById(owner),
        User.findById(bidForUserId)
    ]);

    if (!post) throw new ApiError(404, "Post not found");
    if (!product) throw new ApiError(404, "Product not found");
    if (!store) throw new ApiError(404, "Store not found");
    if (!ownerUser) throw new ApiError(404, "Post owner not found");
    if (!bidRecipient) throw new ApiError(404, "Bid recipient user not found");

    // === Check if bidding for post owner ===
    if (bidForUserId.toString() === owner.toString()) {
        throw new ApiError(400, "Cannot bid for the post owner");
    }

    // === Check if bidding for yourself ===
    if (bidForUserId.toString() === userId.toString()) {
        throw new ApiError(400, "Use add-bid endpoint to bid for yourself");
    }

    // === Create bid ===
    const bid = await Bidding.create({
        userId,
        postId,
        productId,
        storeId,
        owner,
        bidAmount,
        message: message || "",
        bidForUserId
    });

    // Populate user details
    await bid.populate([
        { path: "userId", select: "username fullName avatar email" },
        { path: "bidForUserId", select: "username fullName avatar email" }
    ]);

    return res.status(201).json(
        new ApiResponse(201, bid, "Bid placed for other user successfully")
    );
});

// ============================================
// 3. GET OTHER USERS' BIDS (Bids others made FOR you)
// ============================================
const getOtherUsersBids = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.userVerfied._id;
    const { page = 1, limit = 10 } = req.query;

    // === Validation ===
    if (!mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    // === Check if post exists ===
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // === Get bids that others made FOR the logged-in user ===
    const aggregate = Bidding.aggregate([
        {
            $match: {
                postId: new mongoose.Types.ObjectId(postId),
                bidForUserId: new mongoose.Types.ObjectId(userId)
            }
        },
        // Sort by highest bid amount first
        {
            $sort: { bidAmount: -1, createdAt: -1 }
        },
        // Lookup bidder details
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "bidder"
            }
        },
        {
            $unwind: {
                path: "$bidder",
                preserveNullAndEmptyArrays: false
            }
        },
        // Project only needed fields
        {
            $project: {
                bidAmount: 1,
                message: 1,
                createdAt: 1,
                updatedAt: 1,
                "bidder._id": 1,
                "bidder.username": 1,
                "bidder.fullName": 1,
                "bidder.avatar": 1
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const bids = await Bidding.aggregatePaginate(aggregate, options);

    // Calculate total bid amount from others
    const totalBidAmount = bids.docs.reduce((sum, bid) => sum + bid.bidAmount, 0);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                ...bids, 
                totalBidAmount,
                highestBid: bids.docs[0]?.bidAmount || 0
            }, 
            "Other users' bids fetched successfully"
        )
    );
});

// ============================================
// 4. GET ALL BIDS OF USER (Own + Received, sorted by highest)
// ============================================
const getAllBidsOfUser = asyncHandler(async (req, res) => {
    const { postId, targetUserId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // === Validation ===
    if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(targetUserId)) {
        throw new ApiError(400, "Invalid post ID or user ID");
    }

    // === Check if resources exist ===
    const [post, user] = await Promise.all([
        Post.findById(postId),
        User.findById(targetUserId)
    ]);

    if (!post) throw new ApiError(404, "Post not found");
    if (!user) throw new ApiError(404, "User not found");

    // === Get all bids FOR this user (own bids + bids made for them) ===
    const aggregate = Bidding.aggregate([
        {
            $match: {
                postId: new mongoose.Types.ObjectId(postId),
                $or: [
                    { userId: new mongoose.Types.ObjectId(targetUserId), bidForUserId: null },
                    { bidForUserId: new mongoose.Types.ObjectId(targetUserId) }
                ]
            }
        },
        // Sort by highest bid amount first
        {
            $sort: { bidAmount: -1, createdAt: -1 }
        },
        // Lookup bidder details
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "bidder"
            }
        },
        {
            $unwind: {
                path: "$bidder",
                preserveNullAndEmptyArrays: false
            }
        },
        // Add field to identify if bid is by other
        {
            $addFields: {
                isBidByOther: {
                    $cond: {
                        if: { $ne: ["$bidForUserId", null] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // Project only needed fields
        {
            $project: {
                bidAmount: 1,
                message: 1,
                createdAt: 1,
                updatedAt: 1,
                isBidByOther: 1,
                "bidder._id": 1,
                "bidder.username": 1,
                "bidder.fullName": 1,
                "bidder.avatar": 1
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const bids = await Bidding.aggregatePaginate(aggregate, options);

    // Calculate totals
    const totalBidAmount = bids.docs.reduce((sum, bid) => sum + bid.bidAmount, 0);
    const ownBidsCount = bids.docs.filter(bid => !bid.isBidByOther).length;
    const receivedBidsCount = bids.docs.filter(bid => bid.isBidByOther).length;

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                ...bids, 
                summary: {
                    totalBidAmount,
                    highestBid: bids.docs[0]?.bidAmount || 0,
                    ownBidsCount,
                    receivedBidsCount
                }
            }, 
            "All bids of user fetched successfully"
        )
    );
});

// ============================================
// 5. UPDATE BID (Your own bid)
// ============================================
const updateBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const { bidAmount, message } = req.body;
    const userId = req.userVerfied._id;

    // === Validation ===
    if (!mongoose.isValidObjectId(bidId)) {
        throw new ApiError(400, "Invalid bid ID");
    }

    if (!bidAmount || bidAmount <= 0) {
        throw new ApiError(400, "Valid bid amount is required");
    }

    // === Find bid ===
    const bid = await Bidding.findById(bidId);

    if (!bid) {
        throw new ApiError(404, "Bid not found");
    }

    // === Check if user owns this bid ===
    if (bid.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own bids");
    }

    // === Check if this is NOT a bid for someone else ===
    if (bid.bidForUserId) {
        throw new ApiError(400, "Use update-other-bid endpoint for bids placed for others");
    }

    // === Update bid ===
    bid.bidAmount = bidAmount;
    if (message !== undefined) {
        bid.message = message;
    }

    await bid.save();

    // Populate user details
    await bid.populate("userId", "username fullName avatar email");

    return res.status(200).json(
        new ApiResponse(200, bid, "Bid updated successfully")
    );
});

// ============================================
// 6. UPDATE OTHER USER BID (Bid you placed for someone else)
// ============================================
const updateOtherUserBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const { bidAmount, message } = req.body;
    const userId = req.userVerfied._id;

    // === Validation ===
    if (!mongoose.isValidObjectId(bidId)) {
        throw new ApiError(400, "Invalid bid ID");
    }

    if (!bidAmount || bidAmount <= 0) {
        throw new ApiError(400, "Valid bid amount is required");
    }

    // === Find bid ===
    const bid = await Bidding.findById(bidId);

    if (!bid) {
        throw new ApiError(404, "Bid not found");
    }

    // === Check if user owns this bid ===
    if (bid.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update bids you placed");
    }

    // === Check if this IS a bid for someone else ===
    if (!bid.bidForUserId) {
        throw new ApiError(400, "This is not a bid for another user. Use update-bid endpoint");
    }

    // === Update bid ===
    bid.bidAmount = bidAmount;
    if (message !== undefined) {
        bid.message = message;
    }

    await bid.save();

    // Populate user details
    await bid.populate([
        { path: "userId", select: "username fullName avatar email" },
        { path: "bidForUserId", select: "username fullName avatar email" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, bid, "Other user bid updated successfully")
    );
});

// ============================================
// 7. DELETE BID
// ============================================
const deleteBid = asyncHandler(async (req, res) => {
    const { bidId } = req.params;
    const userId = req.userVerfied._id;

    // === Validation ===
    if (!mongoose.isValidObjectId(bidId)) {
        throw new ApiError(400, "Invalid bid ID");
    }

    // === Find bid ===
    const bid = await Bidding.findById(bidId);

    if (!bid) {
        throw new ApiError(404, "Bid not found");
    }

    // === Check if user owns this bid ===
    if (bid.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own bids");
    }

    // === Delete bid ===
    await Bidding.findByIdAndDelete(bidId);

    return res.status(200).json(
        new ApiResponse(200, { deletedBidId: bidId }, "Bid deleted successfully")
    );
});

// ============================================
// 8. GET BID BY USERNAME/ID (Search if user bid on post)
// ============================================
const getBidByUser = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { username, userId } = req.query;

    // === Validation ===
    if (!mongoose.isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    if (!username && !userId) {
        throw new ApiError(400, "Please provide username or userId");
    }

    // === Check if post exists ===
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // === Find target user ===
    let targetUser;

    if (username) {
        targetUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') }
        });
    } else if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID format");
        }
        targetUser = await User.findById(userId);
    }

    if (!targetUser) {
        return res.status(404).json(
            new ApiResponse(404, null, "User not found")
        );
    }

    // === Find all bids by this user on this post ===
    const bids = await Bidding.find({
        postId: postId,
        $or: [
            { userId: targetUser._id, bidForUserId: null },
            { bidForUserId: targetUser._id }
        ]
    })
    .populate("userId", "username fullName avatar")
    .populate("bidForUserId", "username fullName avatar")
    .sort({ bidAmount: -1, createdAt: -1 });

    // === If no bids found ===
    if (bids.length === 0) {
        return res.status(200).json(
            new ApiResponse(
                200, 
                { 
                    hasBid: false,
                    user: {
                        _id: targetUser._id,
                        username: targetUser.username,
                        fullName: targetUser.fullName,
                        avatar: targetUser.avatar
                    },
                    bids: [] 
                }, 
                "User has not bid on this post"
            )
        );
    }

    // === Calculate totals ===
    const totalBidAmount = bids.reduce((sum, bid) => sum + bid.bidAmount, 0);
    const ownBids = bids.filter(b => !b.bidForUserId);
    const receivedBids = bids.filter(b => b.bidForUserId);

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                hasBid: true,
                user: {
                    _id: targetUser._id,
                    username: targetUser.username,
                    fullName: targetUser.fullName,
                    avatar: targetUser.avatar
                },
                summary: {
                    totalBidAmount,
                    totalBidsCount: bids.length,
                    ownBidsCount: ownBids.length,
                    receivedBidsCount: receivedBids.length,
                    highestBid: bids[0].bidAmount,
                    ownBidsTotal: ownBids.reduce((sum, bid) => sum + bid.bidAmount, 0),
                    receivedBidsTotal: receivedBids.reduce((sum, bid) => sum + bid.bidAmount, 0)
                },
                bids
            },
            "User bids fetched successfully"
        )
    );
});

// ============================================
// EXPORT ALL CONTROLLERS
// ============================================
export {
    addBidToPost,
    addBidToOtherUser,
    getOtherUsersBids,
    getAllBidsOfUser,
    updateBid,
    updateOtherUserBid,
    deleteBid,
    getBidByUser
};