import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiErrors.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import Product from "../../../models/store/store.product.model.js";

// Get all FREE products (100% discount) sorted by most recent and most orders
export const get100PercentDiscount = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Discount Products Controller");
    
     // Build filter for products where price = 0 (with or without discount mentioned)
    const filter = {
        $or: [
            { 
                productDiscount: 100, 
                productPrice: 0 
            },
            { 
                productPrice: 0,
                productDiscount: 0  // When discount is 0 or not set
            }
        ],
        storeId: { $type: "objectId" }
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
    
    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found with 100% discount");
    }


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
    
    // // Build filter object for FREE products
    // const filter = {
    //     productDiscount: 80,  // 100% discount
    //     // productPrice: { $gte: 0 }, // Price should be 0 or more
    //     storeId: { $type: "objectId" } // Only valid store IDs
    // };

const filter = {
     productDiscount: { 
            $gte: 80,  // Greater than or equal to 50%
            $lte: 99 ,  // Less than or equal to 80%
        },
     storeId: { $type: "objectId" } 
    }
    
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
    
            if (!products || products.length === 0) {
                throw new ApiError(404, "No products found with 80% discount");
            }
        
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
            $lte: 79   // Less than or equal to 80%
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

            if (!products || products.length === 0) {
                throw new ApiError(404, "No products found with between 50% to 80% discount");
            }
        
    
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



// Get all products priced at $100 or less, sorted by most orders and most recent
export const getlessthan100price = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Products Under $100 Controller");
    
    // Build filter object for products $100 or less
    const filter = {
        productPrice: { $gt: 0, $lte: 100 }, // Price > 0 and <= 100
        productDiscount: { $lt: 50 }, // Discount less than 50%
        storeId: { $type: "objectId" }
    };
    
    // Add category filter if provided
    if (category) {
        filter.category = category;
    }
    
    // Sort by: 
    // 1. Most recent first (createdAt descending)
    // 2. Lowest price first (productPrice ascending)
    const sortObject = { 
        createdAt: -1,      // Most recent first
        productPrice: 1     // Lowest price first
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

    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found under $100");
    }
    
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
        }, "Products under $100 retrieved successfully")
    );
});



// ALTERNATIVE: If you actually want FREE products (100% discount or $0 price)
export const getFreeProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Free Products Controller");
    
    // Build filter for truly FREE products
    const filter = {
        $or: [
            { productDiscount: 100 },  // 100% discount
            { productPrice: 0 },       // $0 price
            { finalPrice: 0 }          // Final price is $0
        ],
        storeId: { $type: "objectId" }
    };
    
    if (category) {
        filter.category = category;
    }
    
    const sortObject = { 
        ordersalltime: -1,
        createdAt: -1
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Product.countDocuments(filter);
    
    const products = await Product.find(filter)
        .sort(sortObject)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
            path: 'storeId',
            select: 'storeName storeImage storeDescription',
            options: { strictPopulate: false }
        })
        .lean();

    if (!products || products.length === 0) {
        throw new ApiError(404, "No free products found");
    }
    
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