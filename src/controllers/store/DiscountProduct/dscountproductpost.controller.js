import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiErrors.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import Product from "../../../models/store/store.product.model.js";
import {Post} from "../../../models/post.model.js";


// export const get100PercentDiscountpost = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, category } = req.query;
    
//     console.log("IN Discount Products Controller");
    
//     // Build filter object for FREE products
//     // const filter = {
//     //     productDiscount: 100,
//     //     productPrice: { $gte: 0 },
//     //     storeId: { $type: "objectId" }
//     // };


//     const filter = {
//     $or: [
//         { 
//             productDiscount: 100, 
//             productPrice: 0 
//         },
//         { 
//             productPrice: 0,
//             $or: [
//                 // { productDiscount: { $exists: false } },
//                 // { productDiscount: null },
//                 { productDiscount: 0 }
//             ]
//         }
//     ],
//     storeId: { $type: "objectId" }
// };
    
//     if (category) {
//         filter.category = category;
//     }
    
//     const sortObject = { 
//         ordersalltime: -1,
//         createdAt: -1
//     };
    
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     // Execute count and find queries in parallel for better performance
//     const [totalProducts, products] = await Promise.all([
//         Product.countDocuments(filter),
//         Product.find(filter)
//             .sort(sortObject)
//             .skip(skip)
//             .limit(parseInt(limit))
//             .populate({
//                 path: 'storeId',
//                 select: 'storeName storeImage storeDescription',
//                 options: { strictPopulate: false }
//             })
//             .lean()
//     ]);
    
//     // Extract product IDs
//     const productIds = products.map(product => product._id);
    
//     // // Fetch posts using $in with proper indexing
//     // const posts = await Post.find({
//     //     productId: { $in: productIds }
//     // })
//     // .select('productId title content createdAt') // Select only needed fields
//     // .lean();
    

    
//  const posts = await Post.find({
//         'product.ProductId': { $in: productIds }  // Note: 'product.ProductId' with capital P
//     })
//     .select('product title description imageFiles videoFiles createdAt')
//     .lean();

//     // Create a Map for O(1) lookup instead of O(n) filter
//     const postsMap = new Map();
//     posts.forEach(post => {
//         const key = post.productId.toString();
//         if (!postsMap.has(key)) {
//             postsMap.set(key, []);
//         }
//         postsMap.get(key).push(post);
//     });
    
//     // Map posts to products efficiently
//     const productsWithPosts = products.map(product => ({
//         ...product,
//         posts: postsMap.get(product._id.toString()) || []
//     }));
    
//     // Calculate pagination metadata
//     const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
//     return res.status(200).json(
//         new ApiResponse(200, {
//             products: productsWithPosts,
//             pagination: {
//                 totalProducts,
//                 totalPages,
//                 currentPage: parseInt(page),
//                 limit: parseInt(limit),
//                 hasNextPage: parseInt(page) < totalPages,
//                 hasPrevPage: parseInt(page) > 1
//             }
//         }, "Free products retrieved successfully")
//     );
// });

export const get100PercentDiscountpost = asyncHandler(async (req, res) => {
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
    
    if (category) {
        filter.category = category;
    }
    
    const sortObject = { 
        ordersalltime: -1,
        createdAt: -1
    };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute count and find queries in parallel for better performance
    const [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .sort(sortObject)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'storeId',
                select: 'storeName storeImage storeDescription',
                options: { strictPopulate: false }
            })
            .lean()
    ]);
    

     // ✅ CHECK: Throw error if no products found
    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found with 100% discount");
    }

    // Extract product IDs
    const productIds = products.map(product => product._id);
    
    // Fetch posts using the nested product.ProductId field
    const posts = await Post.find({
        'product.ProductId': { $in: productIds }
    })
    .select('product title description imageFiles videoFiles createdAt')
    .lean();
    
    // ✅ FIXED: Create a Map for O(1) lookup - extract ProductId from nested array
    const postsMap = new Map();
    posts.forEach(post => {
        // Extract ProductId from the nested product array
        if (post.product && post.product.length > 0) {
            const productId = post.product[0].ProductId;
            if (productId) {
                const key = productId.toString();
                if (!postsMap.has(key)) {
                    postsMap.set(key, []);
                }
                postsMap.get(key).push(post);
            }
        }
    });
    
    // Map posts to products efficiently
    const productsWithPosts = products.map(product => ({
        ...product,
        posts: postsMap.get(product._id.toString()) || []
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    return res.status(200).json(
        new ApiResponse(200, {
            products: productsWithPosts,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        }, "Free products retrieved successfully")
    );
});





export const get80PercentDiscountpost = asyncHandler(async (req, res) => {
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
    
     // Execute count and find queries in parallel for better performance
    const [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .sort(sortObject)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'storeId',
                select: 'storeName storeImage storeDescription',
                options: { strictPopulate: false }
            })
            .lean()
    ]);
    

  // ✅ CHECK: Throw error if no products found
    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found with 80% discount");
    }

    // // Extract product IDs
    // const productIds = products.map(product => product._id);
    
    // // Fetch posts using $in with proper indexing
    // const posts = await Post.find({
    //     productId: { $in: productIds }
    // })
    // .select('productId title content createdAt') // Select only needed fields
    // .lean();


    // Fetch posts using the nested product.ProductId field
    const posts = await Post.find({
        'product.ProductId': { $in: productIds }
    })
    .select('product title description imageFiles videoFiles createdAt')
    .lean();
    
    // Create a Map for O(1) lookup instead of O(n) filter
    // const postsMap = new Map();
    // posts.forEach(post => {
    //     const key = post.productId.toString();
    //     if (!postsMap.has(key)) {
    //         postsMap.set(key, []);
    //     }
    //     postsMap.get(key).push(post);
    // });


    // ✅ FIXED: Create a Map for O(1) lookup - extract ProductId from nested array
    const postsMap = new Map();
    posts.forEach(post => {
        // Extract ProductId from the nested product array
        if (post.product && post.product.length > 0) {
            const productId = post.product[0].ProductId;
            if (productId) {
                const key = productId.toString();
                if (!postsMap.has(key)) {
                    postsMap.set(key, []);
                }
                postsMap.get(key).push(post);
            }
        }
    });
    
    // Map posts to products efficiently
    const productsWithPosts = products.map(product => ({
        ...product,
        posts: postsMap.get(product._id.toString()) || []
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    return res.status(200).json(
        new ApiResponse(200, {
            products: productsWithPosts,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        }, "80% Free products retrieved successfully")
    );
});




// Get products with discount between 50% and 80%
export const get50To80PercentDiscountpost = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN 50-80% Discount Products Controller");
    
    // Build filter object for 50-80% discount
    const filter = {
        productDiscount: { 
            $gt: 50,   // Greater than 50% (excludes 50%)
            $lt: 80    // Less than 80% (excludes 80%)
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
    
    // Execute count and find queries in parallel for better performance
    const [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .sort(sortObject)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'storeId',
                select: 'storeName storeImage storeDescription',
                options: { strictPopulate: false }
            })
            .lean()
    ]);

    // ✅ CHECK: Throw error if no products found
    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found between 50% and 80% discount");
    }
    
    // Extract product IDs
    const productIds = products.map(product => product._id);
    
    // // Fetch posts using $in with proper indexing
    // const posts = await Post.find({
    //     productId: { $in: productIds }
    // })
    // .select('productId title content createdAt') // Select only needed fields
    // .lean();
    
    // // Create a Map for O(1) lookup instead of O(n) filter
    // const postsMap = new Map();
    // posts.forEach(post => {
    //     const key = post.productId.toString();
    //     if (!postsMap.has(key)) {
    //         postsMap.set(key, []);
    //     }
    //     postsMap.get(key).push(post);
    // });
    
     // Fetch posts using the nested product.ProductId field
    const posts = await Post.find({
        'product.ProductId': { $in: productIds }
    })
    .select('product title description imageFiles videoFiles createdAt')
    .lean();
    
    // ✅ FIXED: Create a Map for O(1) lookup - extract ProductId from nested array
    const postsMap = new Map();
    posts.forEach(post => {
        // Extract ProductId from the nested product array
        if (post.product && post.product.length > 0) {
            const productId = post.product[0].ProductId;
            if (productId) {
                const key = productId.toString();
                if (!postsMap.has(key)) {
                    postsMap.set(key, []);
                }
                postsMap.get(key).push(post);
            }
        }
    });



    // Map posts to products efficiently
    const productsWithPosts = products.map(product => ({
        ...product,
        posts: postsMap.get(product._id.toString()) || []
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    return res.status(200).json(
        new ApiResponse(200, {
            products: productsWithPosts,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        }, "between 80% to 50% Free products retrieved successfully")
    );
});





// Get all FREE products (less than 100 doller ) sorted by most recent and most orders
export const getlessthan100pricepost = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    
    console.log("IN Discount Products Controller");
    
    // Build filter object for FREE products
    const filter = {
        // productDiscount: 100,  // 100% discount
              productPrice: { $lte: 100 }, // ✅ FIXED: Now truly "less than or equal to 100"
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
    


     // Execute count and find queries in parallel for better performance
    const [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .sort(sortObject)
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'storeId',
                select: 'storeName storeImage storeDescription',
                options: { strictPopulate: false }
            })
            .lean()
    ]);
    


     // ✅ CHECK: Throw error if no products found
    if (!products || products.length === 0) {
        throw new ApiError(404, "No products found less than 100 doller");
    }


    // Extract product IDs
    const productIds = products.map(product => product._id);
    
    // Fetch posts using $in with proper indexing
    const posts = await Post.find({
        productId: { $in: productIds }
    })
    .select('productId title content createdAt') // Select only needed fields
    .lean();
    
    // Create a Map for O(1) lookup instead of O(n) filter
    const postsMap = new Map();
    posts.forEach(post => {
        const key = post.productId.toString();
        if (!postsMap.has(key)) {
            postsMap.set(key, []);
        }
        postsMap.get(key).push(post);
    });
    
    // Map posts to products efficiently
    const productsWithPosts = products.map(product => ({
        ...product,
        posts: postsMap.get(product._id.toString()) || []
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    return res.status(200).json(
        new ApiResponse(200, {
            products: productsWithPosts,
            pagination: {
                totalProducts,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        }, "less than 100 doller  products retrieved successfully")
    );
});




//sale

// 11.11 Sale

// sale on store

//flat sale

//upto sales