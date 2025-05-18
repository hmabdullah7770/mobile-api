import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadResult } from "../../utils/Claudnary.js";
import Product from "../../models/store/store.product.model.js";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Add a product to a store
export const addProduct = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const {
        productName,
        description,
        productPrice,
        warnings,
        productDiscount,
        productSizes,
        productColors,
        // productImages,
        category,
        stock,
        variants = [],
        specifications = [],
        tags = []
    } = req.body;
    
    // Validate required fields
    if (!productName || !description || !productPrice ) {
        throw new ApiError(400, "All required fields must be provided");
    }
       
    const Productnameexist = await Product.findOne({storeId:storeId,productName:productName});
    
    console.log("Product is :", Productnameexist  );
  
     if (Productnameexist) {
      throw new ApiError(409, "Product name already taken chose another");
     }




    // Check for product images
    if (!req.files?.productImages || req.files.productImages.length === 0) {
        throw new ApiError(400, "At least one product image is required");
    }
    
    // Upload product images
    const imagePromises = req.files.productImages.map(file => uploadResult(file.path));
    const uploadedImages = await Promise.all(imagePromises);
    
    const images = uploadedImages.map(image => image.url);
    
    // Create the product
    const product = await Product.create({
       
        storeId:storeId,
        productName,
        description,
        productPrice,
        warnings,
        productDiscount,
        productSizes,
        productColors,
        
        productImages:images,
        category,
        stock,
        variants,
        specifications,
        tags 
        // store: storeId,
        // productName,
        // description,
        // price,
        // discountPrice,
        // category,
        // stock,
        // images,
        // variants: JSON.parse(variants),
        // specifications: JSON.parse(specifications),
        // tags
    });
    
    return res.status(201).json(
        new ApiResponse(201, product, "Product added successfully")
    );
});

// Get all products for a store
export const getStoreProducts = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
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
    const products = await Product.find({storeId});
    
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

// Update a product
export const updateProduct = asyncHandler(async (req, res) => {
    const { productId,storeId } = req.params;
    const {
        productName,
        description,
        price,
        discountPrice,
        category,
        stock,
        variants,
        specifications,
        tags
    } = req.body;

    if(!storeId){
        throw new ApiError(400,"Store Id is required")
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
        throw new ApiError(404, "Product not found");
    }
    
    // // Check if the product belongs to the store
    // if (product.store.toString() !== req.store._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to update this product");
    // }
    
    // Update fields if provided
    if (productName) product.productName = productName;

    
    const Productnameexist = await Product.findOne({storeId:storeId,productName:productName});
    
    console.log("Product is :", Productnameexist  );
  
    if (Productnameexist) {
      throw new ApiError(409, "Product name already taken chose another");
    }

    if (description) product.description = description;
    if (price) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;
    if (variants) product.variants = JSON.parse(variants);
    if (specifications) product.specifications = JSON.parse(specifications);
    if (tags) product.tags = tags;
    
    // Handle product images if provided
    if (req.files?.productImages && req.files.productImages.length > 0) {
        const imagePromises = req.files.productImages.map(file => uploadResult(file.path));
        const uploadedImages = await Promise.all(imagePromises);
        
        const newImages = uploadedImages.map(image => image.url);
        
        // Append new images to existing ones
        product.images = [...product.images, ...newImages];
    }
    
    await product.save();
    
    return res.status(200).json(
        new ApiResponse(200, product, "Product updated successfully")
    );
});

// Delete a product
export const deleteProduct = asyncHandler(async (req, res) => {
    const { productId,storeId } = req.params;
    
    if (!storeId) {
        throw new ApiError(400, "Store Id is required");
    }

    const product = await Product.findById(productId);
    
    if (!product) {
        throw new ApiError(404, "Product not found");
    }
    
    // // Check if the product belongs to the store
    // if (product.store.toString() !== req.store._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to delete this product");
    // }
    
    await Product.findByIdAndDelete(productId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Product deleted successfully")
    );
});

// Remove a specific image from a product
export const removeProductImage = asyncHandler(async (req, res) => {
    const { productId,storeId  } = req.params;
    const { imageUrl } = req.body;
    
if(storeId){
  throw new ApiError(400,"storeId is required")
}

    if (!imageUrl) {
        throw new ApiError(400, "Image URL is required");
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
        throw new ApiError(404, "Product not found");
    }
    
    // // Check if the product belongs to the store
    // if (product.store.toString() !== req.store._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to modify this product");
    // }
    
    // Remove the image from the product
    product.images = product.images.filter(url => url !== imageUrl);
    
    // Ensure at least one image remains
    if (product.images.length === 0) {
        throw new ApiError(400, "Product must have at least one image");
    }
    
    await product.save();
    
    return res.status(200).json(
        new ApiResponse(200, product, "Product image removed successfully")
    );
});
