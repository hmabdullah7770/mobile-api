import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiErrors.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
// import { uploadResult } from "../../utils/Claudnary.js";
import CreateStore from "../../../models/store/store.createstore.model.js";
import mongoose from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


// Get all store sorted by order amounts (highest first) - ACROSS ALL STORES
export const getAllTimeTopStore = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, sort = 'totalSells:desc' } = req.query;
    

    console.log("IN ALL time store controller")
    // Build filter object
    const filter = {};
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // // ✅ Filter out stores with invalid storeId
    // filter.storeId = { $type: "objectId" }; // Only get products with valid ObjectId
    
    // Parse sort parameter
    let sortObject = { totalSells: -1 }; // Default: highest orders first
    
    if (sort) {
        const [field, order] = sort.split(':');
        sortObject = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalStoreSells = await CreateStore.countDocuments(filter);
    
    // Fetch products with sorting and pagination (ALL STORES)
    const Store= await CreateStore.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        // .populate({
        //     path: 'storeId',
        //     select: 'storeName storeImage storeDescription',
        //     options: { strictPopulate: false }
        // })
        .lean(); // Use lean() for better performance
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalStoreSells / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            Store,
            pagination: {
                totalStoreSells,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage,
                hasPrevPage
            }
        }, "Top Selling Store retrieved successfully")
    );
});
