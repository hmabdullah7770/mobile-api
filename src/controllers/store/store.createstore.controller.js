import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import CreateStore from "../../models/store/store.createstore.model.js";
import { uploadResult } from '../../utils/Claudnary.js'
import mongoose from 'mongoose';
import { User } from "../../models/user.model.js";

// import StoreStoreRating from "../../models/store/store_StoreRating.model.js";
import StoreRating from "../../models/store/store_rating.model.js";


//for multiple store for one user he pay for it and we create another api may be also another model

// Create a new store
export const createStore = asyncHandler(async (req, res) => {
    const {
        // userId,
        // template,
        category,
        storeType,
        storeName,
        productName,
        // targetUrl,
        // isPublished = false
    } = req.body;

    // Validate required fields  (!tamplate)
    if (!storeType || !storeName ) {
        throw new ApiError(400, "All required fields must be provided");
    }

//  if (!userId) {
//     throw new ApiError(400, "User ID is required");
//    }

   const Storeexist = await CreateStore.findById(req.userVerfied._id);

   if(Storeexist){

    throw new ApiError(409, "You already have a store");
   }

    const Storenameeexist = await CreateStore.findOne({storeName});
    
      console.log("Storeis :", Storenameeexist );
    
      
      if (Storenameeexist) {
        throw new ApiError(409, "Store nameealready taken chose another");
      }

  
      

    // Validate storeType is valid
    if (!['nesh', 'one-product', 'multiple-product'].includes(storeType)) {
        throw new ApiError(400, "Invalid store type");
    }

    // Check if product name is provided for one-product stores
    if (storeType === 'one-product' && !productName) {
        throw new ApiError(400, "Product name is required for one-product stores");
    }

    // Upload store logo
    // if (!req.files?.storeLogo) {
    //     throw new ApiError(400, "Store logo is required");
    // }

    // const storeLogo = await uploadResult(req.files.storeLogo[0]?.path);

    // if (!storeLogo.url) {
    //     throw new ApiError(500, "Error uploading store logo");
    // }


    
  const storeLogoLocalpath = req.files.storeLogo[0].path; //local file path for multer
  

  // let coverImageLocalpath;
  // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  // const coverImageLocalpath = req.files.coverImage[0].path ;   //local file path for multer
  // }
  // console.log(" coverImageLocalpath",coverImageLocalpath)
  if (!storeLogoLocalpath) {
    throw new ApiError(400, "storeLogo is required");
  }
  const storeLogo = await uploadResult(storeLogoLocalpath);

if(!storeLogo){
    throw new ApiError(500,"storeLogo is not on cloudinary")
}


    // Create the store
    const store = await CreateStore.create({
        // template,
        category,
        storeType,
        storeName,
         // Add social links that exist
//   ...(whatsapp ? { whatsapp } : {}),
        productName,
        storeLogo: storeLogo.url,
        owner: req.userVerfied._id,
        // targetUrl,
        // isPublished
    });

 // Update user model with store information
    await User.findByIdAndUpdate(
        req.userVerfied._id,
        {
            $push: {
                stores: {
                    storeId: store._id,
                    storeName: store.storeName,
                    storeLogo: store.storeLogo
                }
            }
        },
        { new: true }
    );


    return res.status(201).json(
        new ApiResponse(201, store, "Store created successfully")
    );
});

// Get all stores for the authenticated user
export const getUserStores = asyncHandler(async (req, res) => {
    const userId = req.userVerfied._id;
    
    // Use aggregation with lookup to get user details
    const stores = await CreateStore.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "users", // Collection name (usually lowercase plural of model name)
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 1,
                template: 1,
                category: 1,
                storeType: 1,
                storeName: 1,
                storeLogo: 1,
                productName: 1,
                targetUrl: 1,
                clickCount: 1,
                likes: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);
    
    return res.status(200).json(
        new ApiResponse(200, stores, "User stores retrieved successfully")
    );
});



// Get a specific store by ID
export const getStoreById = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    
    // Use aggregation with lookup to get user details
    const stores = await CreateStore.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(storeId) }
        },
        {
            $lookup: {
                from: "users", // Collection name (usually lowercase plural of model name)
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 1,
                template: 1,
                category: 1,
                storeType: 1,
                storeName: 1,
                storeLogo: 1,
                productName: 1,
                targetUrl: 1,
                clickCount: 1,
                likes: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);
    
    if (!stores || stores.length === 0) {
        throw new ApiError(404, "Store not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, stores[0], "Store retrieved successfully")
    );
});

// Update a store
export const updateStore = asyncHandler(async (req, res) => {
    
    const { storeId } = req.params;
    
    const {
        // template,
        category,
        storeType,
        storeName,
        productName,
        // targetUrl,
        // isPublished
    } = req.body;
    
    // Get the store (the middleware already verified ownership)
    const store = req.store;
    
    // Update fields if provided
    if (template) store.template = template;
    if (category) store.category = category;
    if (storeType) {
        store.storeType = storeType;
        // If changing to one-product type, require product name
        if (storeType === 'one-product' && !productName && !store.productName) {
            throw new ApiError(400, "Product name is required for one-product stores");
        }
    }
    if (storeName) store.storeName = storeName;


    const Storenameeexist = await CreateStore.findOne({storeName});
    
      console.log("Storeis :", Storenameeexist );
    
      if (Storenameeexist) {
        throw new ApiError(409, "Store name already taken chose another");
      }




    if (productName) store.productName = productName;
    if (targetUrl) store.targetUrl = targetUrl;
    if (isPublished !== undefined) store.isPublished = isPublished;
    
    // Handle logo upload if provided
    if (req.files?.storeLogo) {
        const storeLogo = await uploadResult(req.files.storeLogo[0]?.path);
        
        if (!storeLogo.url) {
            throw new ApiError(500, "Error uploading store logo");
        }
        
        store.storeLogo = storeLogo.url;
    }
    
    await store.save();
    
    return res.status(200).json(
        new ApiResponse(200, store, "Store updated successfully")
    );
});

// Delete a store
export const deleteStore = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    
    // Get the store (the middleware already verified ownership)
    const store = req.store;
    
    await CreateStore.findByIdAndDelete(storeId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Store deleted successfully")
    );
});

// Publish/unpublish a store
export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    
    // Get the store (the middleware already verified ownership)
    const store = req.store;
    
    // Toggle publish status
    store.isPublished = !store.isPublished;
    
    await store.save();
    
    return res.status(200).json(
        new ApiResponse(200, store, `Store ${store.isPublished ? 'published' : 'unpublished'} successfully`)
    );
});




//rating


// Add these controllers to your store.createstore.controller.js file

// Rate a store
export const rateStore = asyncHandler(async (req, res) => {
    const { storeId, rating } = req.body;
    const userId = req.userVerfied._id;

    // Validate required fields
    if (!storeId || !rating) {
        throw new ApiError(400, "Store ID and rating are required");
    }

    // Validate rating value (1-5)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new ApiError(400, "Rating must be an integer between 1 and 5");
    }

    // Check if store exists
    const store = await CreateStore.findById(storeId);
    if (!store) {
        throw new ApiError(404, "Store not found");
    }

    // Prevent users from rating their own store
    if (store.owner.toString() === userId.toString()) {
        throw new ApiError(403, "You cannot rate your own store");
    }

    // Check if user has already rated this store
    const existingRating = await StoreRating.findOne({
        store: storeId,
        user: userId
    });

    if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        await existingRating.save();

        // Recalculate average rating
        await updateStoreRating(storeId);

        return res.status(200).json(
            new ApiResponse(200, existingRating, "Rating updated successfully")
        );
    }

    // Create new rating
    const newRating = await StoreRating.create({
        store: storeId,
        user: userId,
        rating: rating
    });

    // Update store's average rating
    await updateStoreRating(storeId);

    return res.status(201).json(
        new ApiResponse(201, newRating, "Store rated successfully")
    );
});

// Helper function to calculate and update store's average rating
const updateStoreRating = async (storeId) => {
    const result = await StoreRating.aggregate([
        {
            $match: { store: new mongoose.Types.ObjectId(storeId) }
        },
        {
            $group: {
                _id: "$store",
                averageRating: { $avg: "$rating" },
                totalRatings: { $sum: 1 }
            }
        }
    ]);

    if (result.length > 0) {
        const { averageRating, totalRatings } = result[0];
        
        await CreateStore.findByIdAndUpdate(
            storeId,
            {
                rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
                totalRatings: totalRatings
            }
        );
    } else {
        // No ratings, reset to 0
        await CreateStore.findByIdAndUpdate(
            storeId,
            {
                rating: 0,
                totalRatings: 0
            }
        );
    }
};

// Get stores sorted by highest average rating
export const getTopRatedStores = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, storeType } = req.query;

    // Build match conditions
    const matchConditions = {};
    
    if (category) {
        matchConditions.category = category;
    }
    
    if (storeType) {
        matchConditions.storeType = storeType;
    }

    const aggregationPipeline = [
        // Match conditions (filter by category/storeType if provided)
        ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
        
        // Lookup to get owner details
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        
        // Lookup to get all ratings for each store
        {
            $lookup: {
                from: "storeratings",
                localField: "_id",
                foreignField: "store",
                as: "ratings"
            }
        },
        
        // Calculate average rating and total ratings
        {
            $addFields: {
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: "$ratings" }, 0] },
                        then: { $avg: "$ratings.rating" },
                        else: 0
                    }
                },
                totalRatings: { $size: "$ratings" }
            }
        },
        
        // Sort by average rating (highest first), then by total ratings
        {
            $sort: {
                averageRating: -1,
                totalRatings: -1,
                createdAt: -1
            }
        },
        
        // Project the fields we want to return
        {
            $project: {
                _id: 1,
                category: 1,
                storeType: 1,
                storeName: 1,
                storeLogo: 1,
                productName: 1,
                clickCount: 1,
                rating: 1,
                totalRatings: 1,
                averageRating: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                ownerDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                ratings: 0 // Exclude the ratings array from final output
            }
        }
    ];

    // Apply pagination
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const stores = await CreateStore.aggregatePaginate(
        CreateStore.aggregate(aggregationPipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, stores, "Top rated stores retrieved successfully")
    );
});

// Get user's rated stores (stores the current user has rated)
export const getUserRatedStores = asyncHandler(async (req, res) => {
    const userId = req.userVerfied._id;
    const { page = 1, limit = 10 } = req.query;

    const aggregationPipeline = [
        // Match ratings by current user
        {
            $match: { user: new mongoose.Types.ObjectId(userId) }
        },
        
        // Lookup store details
        {
            $lookup: {
                from: "createstores",
                localField: "store",
                foreignField: "_id",
                as: "storeDetails"
            }
        },
        {
            $unwind: "$storeDetails"
        },
        
        // Lookup store owner details
        {
            $lookup: {
                from: "users",
                localField: "storeDetails.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        
        // Sort by rating date (most recent first)
        {
            $sort: { createdAt: -1 }
        },
        
        // Project the fields
        {
            $project: {
                _id: 1,
                rating: 1,
                createdAt: 1,
                updatedAt: 1,
                store: {
                    _id: "$storeDetails._id",
                    storeName: "$storeDetails.storeName",
                    storeLogo: "$storeDetails.storeLogo",
                    category: "$storeDetails.category",
                    storeType: "$storeDetails.storeType",
                    productName: "$storeDetails.productName",
                    rating: "$storeDetails.rating",
                    totalRatings: "$storeDetails.totalRatings"
                },
                owner: {
                    _id: "$ownerDetails._id",
                    username: "$ownerDetails.username",
                    fullName: "$ownerDetails.fullName",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const ratedStores = await StoreRating.aggregatePaginate(
       StoreRating.aggregate(aggregationPipeline),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, ratedStores, "User rated stores retrieved successfully")
    );
});