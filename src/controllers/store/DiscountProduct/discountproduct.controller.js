import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiErrors.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import Product from "../../../models/store/store.product.model.js";

// Get all FREE products (100% discount) sorted by most recent and most orders
export const get100PercentDiscount = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Discount Products Controller");
    
    // Build filter object for FREE products
    const filter = {
        productDiscount: 100,  // 100% discount
        productPrice: { $gte: 0 }, // Price should be 0 or more
        storeId: { $type: "objectId" } // Only valid store IDs
    };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // Sort by: 
    // 1. Most orders first (ordersalltime descending)
    // 2. Most recent first (createdAt descending)
    const sortObject = { 
        ordersalltime: -1,  // Highest orders first
        createdAt: -1       // Most recent first
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Fetch products with sorting and pagination
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
        }, "Free products retrieved successfully")
    );
});

// Get all products (80% discount) sorted by most recent and most orders
export const get80PercentDiscount = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Discount Products Controller");
    
    // Build filter object for FREE products
    const filter = {
        productDiscount: 80,  // 100% discount
        // productPrice: { $gte: 0 }, // Price should be 0 or more
        storeId: { $type: "objectId" } // Only valid store IDs
    };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // Sort by: 
    // 1. Most orders first (ordersalltime descending)
    // 2. Most recent first (createdAt descending)
    const sortObject = { 
        ordersalltime: -1,  // Highest orders first
        createdAt: -1       // Most recent first
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Fetch products with sorting and pagination
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
        }, "80% products retrieved successfully")
    );
});



// Get products with discount between 50% and 80%
export const get50To80PercentDiscount = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN 50-80% Discount Products Controller");
    
    // Build filter object for 50-80% discount
    const filter = {
        productDiscount: { 
            $gte: 50,  // Greater than or equal to 50%
            $lte: 80   // Less than or equal to 80%
        },
        storeId: { $type: "objectId" } // Only valid store IDs
    };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // Sort by: 
    // 1. Most orders first (ordersalltime descending)
    // 2. Most recent first (createdAt descending)
    const sortObject = { 
        ordersalltime: -1,  // Highest orders first
        createdAt: -1       // Most recent first
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Fetch products with sorting and pagination
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
        }, "Products with 50-80% discount retrieved successfully")
    );
});



// Get all FREE products (less than 100 doller ) sorted by most recent and most orders
export const getlessthan100price = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Discount Products Controller");
    
    // Build filter object for FREE products
    const filter = {
        // productDiscount: 100,  // 100% discount
        productPrice: { $gte: 100 }, // Price should be 0 or more
        storeId: { $type: "objectId" } // Only valid store IDs
    };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // Sort by: 
    // 1. Most orders first (ordersalltime descending)
    // 2. Most recent first (createdAt descending)
    const sortObject = { 
        ordersalltime: -1,  // Highest orders first
        createdAt: -1       // Most recent first
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Fetch products with sorting and pagination
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
        }, "Free products retrieved successfully")
    );
});



// 11.11 Sale




// // Alternative: Get products with discount >= certain percentage
// export const getProductsByDiscount = asyncHandler(async (req, res) => {
//     const { 
//         page = 1, 
//         limit = 10, 
//         category, 
//         minDiscount = 50 // Minimum discount percentage
//     } = req.query;
    
//     console.log("IN Products By Discount Controller");
    
//     // Build filter object
//     const filter = {
//         productDiscount: { $gte: parseInt(minDiscount) }, // At least minDiscount%
//         storeId: { $type: "objectId" }
//     };
    
//     // Add category filter if provided
//     if (category) {
//         filter.category = category;
//     }
    
//     // Sort by discount (highest first), then orders, then recency
//     const sortObject = { 
//         productDiscount: -1,  // Highest discount first
//         ordersalltime: -1,    // Most orders
//         createdAt: -1         // Most recent
//     };
    
//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     // Get total count
//     const totalProducts = await Product.countDocuments(filter);
    
//     // Fetch products
//     const products = await Product.find(filter)
//         .sort(sortObject)
//         .skip(skip)
//         .limit(parseInt(limit))
//         .populate({
//             path: 'storeId',
//             select: 'storeName storeImage storeDescription',
//             options: { strictPopulate: false }
//         })
//         .lean();
    
//     // Calculate pagination metadata
//     const totalPages = Math.ceil(totalProducts / parseInt(limit));
//     const hasNextPage = parseInt(page) < totalPages;
//     const hasPrevPage = parseInt(page) > 1;
    
//     return res.status(200).json(
//         new ApiResponse(200, {
//             products,
//             pagination: {
//                 totalProducts,
//                 totalPages,
//                 currentPage: parseInt(page),
//                 limit: parseInt(limit),
//                 hasNextPage,
//                 hasPrevPage
//             }
//         }, `Products with ${minDiscount}%+ discount retrieved successfully`)
//     );
// });