import { Router } from "express";
import {
    addBidToPost,
    addBidToOtherUser,
    getOtherUsersBids,
    getAllBidsOfUser,
    updateBid,
    updateOtherUserBid,
    deleteBid,
    getBidByUser
} from "../controllers/bidding.controller.js";
import  VerifyJWT  from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================

// Apply authentication middleware to all routes
router.use(VerifyJWT);

// ============================================
// CREATE BIDS
// ============================================

/**
 * @route   POST /api/v1/bids/add-bid
 * @desc    Place a bid for yourself on a post
 * @access  Private
 * @body    { postId, productId, storeId, owner, bidAmount, message? }
 */
router.route("/add-bid").post(addBidToPost);

/**
 * @route   POST /api/v1/bids/add-bid-for-other
 * @desc    Place a bid for another user on a post
 * @access  Private
 * @body    { postId, productId, storeId, owner, bidAmount, message?, bidForUserId }
 */
router.route("/add-bid-for-other").post(addBidToOtherUser);

// ============================================
// READ BIDS
// ============================================

/**
 * @route   GET /api/v1/bids/other-users-bids/:postId
 * @desc    Get all bids that others made FOR the logged-in user on a specific post
 * @access  Private
 * @query   page, limit
 */
router.route("/other-users-bids/:postId").get(getOtherUsersBids);

/**
 * @route   GET /api/v1/bids/user-bids/:postId/:targetUserId
 * @desc    Get all bids (own + received) for a specific user on a post
 * @access  Private
 * @query   page, limit
 */
router.route("/user-bids/:postId/:targetUserId").get(getAllBidsOfUser);

/**
 * @route   GET /api/v1/bids/search/:postId
 * @desc    Search if a user has bid on a post by username or userId
 * @access  Private
 * @query   username OR userId
 */
router.route("/search/:postId").get(getBidByUser);

// ============================================
// UPDATE BIDS
// ============================================

/**
 * @route   PATCH /api/v1/bids/update-bid/:bidId
 * @desc    Update your own bid (not a bid placed for someone else)
 * @access  Private
 * @body    { bidAmount, message? }
 */
router.route("/update-bid/:bidId").patch(updateBid);

/**
 * @route   PATCH /api/v1/bids/update-other-bid/:bidId
 * @desc    Update a bid you placed for someone else
 * @access  Private
 * @body    { bidAmount, message? }
 */
router.route("/update-other-bid/:bidId").patch(updateOtherUserBid);

// ============================================
// DELETE BIDS
// ============================================

/**
 * @route   DELETE /api/v1/bids/delete-bid/:bidId
 * @desc    Delete your own bid (own bid or bid placed for another user)
 * @access  Private
 */
router.route("/delete-bid/:bidId").delete(deleteBid);

export default router;