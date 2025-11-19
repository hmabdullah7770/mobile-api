import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import CreateStore from "../models/store.createstore.model.js";
import mongoose from 'mongoose';

// 🚀 Get Stores by Category with Pagination
export const getStoresByCategory = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  // Input validation
  if (!category) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Build match condition
    const matchCondition = {};
    if (category !== 'All') {
      matchCondition.category = category;
    }

    // 🚀 OPTIMIZED AGGREGATION PIPELINE
    const pipeline = [
      // Early filtering (uses index)
      ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
      
      // Sort by rating and creation date
      { 
        $sort: { 
          rating: -1,
          createdAt: -1 
        } 
      },
      
      // Skip previous documents
      { $skip: skip },
      
      // Get 1 extra to check if there's next page
      { $limit: parsedLimit + 1 },
      
      // Get owner details
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
                email: 1,
                avatar: 1,
                fullName: 1
              }
            }
          ]
        }
      },
      
      // Unwind owner array
      { $unwind: "$owner" },
      
      // Project required fields
      {
        $project: {
          category: 1,
          storeType: 1,
          storeName: 1,
          storeLogo: 1,
          productName: 1,
          clickCount: 1,
          rating: 1,
          totalRatings: 1,
          totalSells: 1,
          owner: {
            _id: "$owner._id",
            username: "$owner.username",
            email: "$owner.email",
            avatar: "$owner.avatar",
            fullName: "$owner.fullName"
          },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // Execute aggregation
    const stores = await CreateStore.aggregate(pipeline);
    
    // Check if there's more data
    const hasNextPage = stores.length > parsedLimit;
    if (hasNextPage) {
      stores.pop(); // Remove the extra item
    }

    if (stores.length === 0 && category !== 'All') {
      throw new ApiError(404, "No stores found in this category");
    }

    return res.status(200).json(
      new ApiResponse(200, `${category === 'All' ? 'All categories' : 'Category'} stores fetched successfully`, {
        stores,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          totalSkip: skip,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});


// 🚀 Get Following Users' Stores by Category
export const getFollowingUsersStores = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);
  
  // Get current user ID from JWT token
  const currentUserId = req.userVerfied._id;
  
  // Input validation
  if (!category) {
    throw new ApiError(400, "Category name is required");
  }
  
  try {
    // Build match condition
    const matchCondition = {};
    if (category !== 'All') {
      matchCondition.category = category;
    }

    // 🔥 OPTIMIZED PIPELINE FOR FOLLOWING USERS
    const pipeline = [
      // Match stores by category
      ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
      
      // Sort by rating and date
      { 
        $sort: { 
          rating: -1,
          createdAt: -1 
        } 
      },
      
      // Lookup to check if store owner is followed by current user
      {
        $lookup: {
          from: "followlists",
          let: { storeOwnerId: "$owner" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$follower", currentUserId] },
                    { $eq: ["$following", "$$storeOwnerId"] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "followCheck"
        }
      },
      
      // Filter - only keep stores from followed users
      {
        $match: {
          "followCheck.0": { $exists: true }
        }
      },
      
      // Skip + Limit early
      { $skip: skip },
      { $limit: parsedLimit + 1 },
      
      // Get owner details
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                avatar: 1,
                fullName: 1
              }
            }
          ]
        }
      },
      
      // Final projection
      {
        $project: {
          category: 1,
          storeType: 1,
          storeName: 1,
          storeLogo: 1,
          productName: 1,
          clickCount: 1,
          rating: 1,
          totalRatings: 1,
          totalSells: 1,
          owner: { $arrayElemAt: ["$ownerDetails", 0] },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];
    
    // Execute aggregation
    const stores = await CreateStore.aggregate(pipeline);
    
    // Check pagination
    const hasNextPage = stores.length > parsedLimit;
    if (hasNextPage) {
      stores.pop();
    }
    
    return res.status(200).json(
      new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} stores fetched`, {
        stores,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );
    
  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});


// 🚀 Get Stores by Category and Type
export const getStoresByCategoryAndType = asyncHandler(async (req, res) => {
  const { category, storeType, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  // Input validation
  if (!category) {
    throw new ApiError(400, "Category name is required");
  }

  if (storeType && !['nesh', 'one-product', 'multiple-product'].includes(storeType)) {
    throw new ApiError(400, "Invalid store type. Must be 'nesh', 'one-product', or 'multiple-product'");
  }

  try {
    // Build match condition
    const matchCondition = {};
    if (category !== 'All') {
      matchCondition.category = category;
    }
    if (storeType) {
      matchCondition.storeType = storeType;
    }

    // 🚀 AGGREGATION PIPELINE
    const pipeline = [
      { $match: matchCondition },
      { 
        $sort: { 
          rating: -1,
          totalRatings: -1,
          createdAt: -1 
        } 
      },
      { $skip: skip },
      { $limit: parsedLimit + 1 },
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
                email: 1,
                avatar: 1,
                fullName: 1
              }
            }
          ]
        }
      },
      { $unwind: "$owner" },
      {
        $project: {
          category: 1,
          storeType: 1,
          storeName: 1,
          storeLogo: 1,
          productName: 1,
          clickCount: 1,
          rating: 1,
          totalRatings: 1,
          totalSells: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const stores = await CreateStore.aggregate(pipeline);
    
    const hasNextPage = stores.length > parsedLimit;
    if (hasNextPage) {
      stores.pop();
    }

    return res.status(200).json(
      new ApiResponse(200, "Stores fetched successfully", {
        stores,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});


// 🚀 Get Top Rated Stores by Category
export const getTopRatedStoresByCategory = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  if (!category) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    const matchCondition = {};
    if (category !== 'All') {
      matchCondition.category = category;
    }

    const pipeline = [
      { $match: matchCondition },
      { 
        $sort: { 
          rating: -1,
          totalRatings: -1
        } 
      },
      { $skip: skip },
      { $limit: parsedLimit + 1 },
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
                email: 1,
                avatar: 1,
                fullName: 1
              }
            }
          ]
        }
      },
      { $unwind: "$owner" }
    ];

    const stores = await CreateStore.aggregate(pipeline);
    
    const hasNextPage = stores.length > parsedLimit;
    if (hasNextPage) {
      stores.pop();
    }

    return res.status(200).json(
      new ApiResponse(200, "Top rated stores fetched successfully", {
        stores,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});


