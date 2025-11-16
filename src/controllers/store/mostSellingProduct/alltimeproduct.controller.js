import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiErrors.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
// import { uploadResult } from "../../utils/Claudnary.js";
import Product from "../../../models/store/store.product.model.js";
import mongoose from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


// Get all products sorted by order amounts (highest first) - ACROSS ALL STORES
export const getAllTimeProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, sort = 'ordersalltime:desc' } = req.query;
    

    console.log("IN ALL time products controller")
    // Build filter object
    const filter = {};
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // ✅ Filter out products with invalid storeId
    filter.storeId = { $type: "objectId" }; // Only get products with valid ObjectId
    
    // Parse sort parameter
    let sortObject = { ordersalltime: -1 }; // Default: highest orders first
    
    if (sort) {
        const [field, order] = sort.split(':');
        sortObject = { [field]: order === 'desc' ? -1 : 1 };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Fetch products with sorting and pagination (ALL STORES)
    const products = await Product.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
            path: 'storeId',
            select: 'storeName storeImage storeDescription',
            options: { strictPopulate: false }
        })
        .lean(); // Use lean() for better performance
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;
    
    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage,
                hasPrevPage
            }
        }, "Products retrieved successfully")
    );
});


// Get all products 
export const getAllProducts = asyncHandler(async (req, res) => {
    // const { storeId } = req.params;
    const { page = 1, limit = 10, category, sort } = req.query;
    
    const filter = { store: storeId };
    
    if (category) {
        filter.category = category;
    }
    
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort ? { [sort.split(':')[0]]: sort.split(':')[1] === 'desc' ? -1 : 1 } : { createdAt: -1 }
    };
    
    // const products = await Product.paginate(filter, options);
    const products = await Product.find();
    
    return res.status(200).json(
        new ApiResponse(200, products, "Store products retrieved successfully")
    );
});






// Get a specific product
export const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    
    if (!product) {
        throw new ApiError(404, "Product not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, product, "Product retrieved successfully")
    );
});




