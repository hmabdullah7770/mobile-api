import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Store_Carousel from "../../models/store/store_carousel.model.js";
import CreateStore from "../../models/store/store.createstore.model.js";
import { uploadResult } from '../../utils/Claudnary.js';
import mongoose from "mongoose";

// // Create a new carousel
// export const createCarousel = asyncHandler(async (req, res) => {
    
//     const {storeId} = req.params
    
//     const {
//         // storeId,
//         carouselname,
//         title,
//         description,
//         buttonText,
//         buttonTextColor,
//         buttonHoverTextColor,
//         buttonBackground,
//         buttonHoverBackground,
//         buttonShadow,
//         buttonShadowColor,
//         buttonBorder,
//         buttonBorderColor,
//         titleColor,
//         tileBackground,
//         descriptionColor,
//         discriptionBackgroundColor,
//         fontFamily,
//         category
//     } = req.body;

//     // Validate required fields
//     if ( !title || !description || !buttonText || !carouselname) {
//         throw new ApiError(400, "Required fields are missing");
//     }



//     const existcarousel = await Carousel.findOne({store:storeId,carouselname:carouselname})

//     if (existcarousel){

//         throw new ApiError(400,"Carousel name in store already exists in this store")
//     }

//     // Check if store exists and user is the owner
//     const store = await CreateStore.findById(storeId);
//     if (!store) {
//         throw new ApiError(404, "Store not found");
//     }
//     if (store.owner.toString() !== req.user._id.toString()) {
//         throw new ApiError(403, "Unauthorized access");
//     }

//     // Handle multiple image uploads
//     if (!req.files?.images || !Array.isArray(req.files.images)) {
//         throw new ApiError(400, "At least one image is required");
//     }

//     const imageUrls = [];
//     for (const image of req.files.images) {
//         const result = await uploadResult(image.path);
//         if (!result?.url) {
//             throw new ApiError(500, "Error uploading image");
//         }
//         imageUrls.push(result.url);
//     }

//     // Create carousel with the same title and description for all images
//     const carousel = await Carousel.create({
//         // storeId,
//         carouselname,
//         title,
//         description,
//         images: imageUrls,
//         buttonText,
//         buttonTextColor: buttonTextColor || "black",
//         buttonHoverTextColor: buttonHoverTextColor || "white",
//         buttonBackground: buttonBackground || "red",
//         buttonHoverBackground: buttonHoverBackground || "darkred",
//         buttonShadow: buttonShadow || false,
//         buttonShadowColor: buttonShadow ? (buttonShadowColor || "grey") : undefined,
//         buttonBorder: buttonBorder || false,
//         buttonBorderColor: buttonBorder ? buttonBorderColor : undefined,
//         titleColor: titleColor || "black",
//         tileBackground: tileBackground || "white",
//         descriptionColor: descriptionColor || "black",
//         discriptionBackgroundColor: discriptionBackgroundColor || "white",
//         fontFamily: fontFamily || ["Arial"],
//         category,
//         owner: req.user._id
//     });

//     return res.status(201).json(
//         new ApiResponse(201, carousel, "Carousel created successfully")
//     );
// });


// Create a new carousel
export const createCarousel = asyncHandler(async (req, res) => {
    
    const { storeId } = req.params
    
    const {
        // storeId,
        carouselname,
        title,
        description,
        buttonText,
        buttonTextColor,
        buttonHoverTextColor,
        buttonBackground,
        buttonHoverBackground,
        buttonShadow,
        buttonShadowColor,
        buttonBorder,
        buttonBorderColor,
        titleColor,
        tileBackground,
        descriptionColor,
        discriptionBackgroundColor,
        fontFamily,
        category
    } = req.body;

    // Validate required fields
    if ( !storeId ||!title || !description || !buttonText || !carouselname) {
        throw new ApiError(400, "Required fields are missing");
    }

    const existcarousel = await Store_Carousel.findOne({
        storeId: storeId,
        carouselname: carouselname
    });

    if (existcarousel) {
        throw new ApiError(400, "Carousel name already exists in this store");
    }

    // Check if store exists and user is the owner
    // const store = await CreateStore.findById(storeId);
    // if (!store) {
    //     throw new ApiError(404, "Store not found");
    // }
    // if (store.owner.toString() !== req.userVerfied._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }



    //  // Check if the banner belongs to the store
    //  if (store_banner.store.toString() !== req.store._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to update this banner");
    // }
    

    // Handle multiple image uploads
    if (!req.files?.images || !Array.isArray(req.files.images)) {
        throw new ApiError(400, "At least one image is required");
    }

    const imageUrls = [];
    for (const image of req.files.images) {
        const result = await uploadResult(image.path);
        if (!result?.url) {
            throw new ApiError(500, "Error uploading image");
        }
        imageUrls.push(result.url);
    }

    // Create carousel without including detailed user info
    const store_carousel = await Store_Carousel.create({
        storeId:storeId,
        carouselname,
        title,
        description,
        images: imageUrls,
        buttonText,
        buttonTextColor: buttonTextColor || "black",
        buttonHoverTextColor: buttonHoverTextColor || "white",
        buttonBackground: buttonBackground || "red",
        buttonHoverBackground: buttonHoverBackground || "darkred",
        buttonShadow: buttonShadow || false,
        buttonShadowColor: buttonShadow ? (buttonShadowColor || "grey") : undefined,
        buttonBorder: buttonBorder || false,
        buttonBorderColor: buttonBorder ? buttonBorderColor : undefined,
        titleColor: titleColor || "black",
        tileBackground: tileBackground || "white",
        descriptionColor: descriptionColor || "black",
        discriptionBackgroundColor: discriptionBackgroundColor || "white",
        fontFamily: fontFamily || ["Arial"],
        category,
        // owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, store_carousel, "Carousel created successfully")
    );
});



// // Get all carousels for a store
// export const getStoreCarousels = asyncHandler(async (req, res) => {
//     const { storeId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     // Check if store exists
//     const store = await CreateStore.findById(storeId);
//     if (!store) {
//         throw new ApiError(404, "Store not found");
//     }

//     // Get carousels with pagination
//     const options = {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         sort: { createdAt: -1 }
//     };

//     const carousels = await Carousel.aggregatePaginate(
//         Carousel.aggregate([
//             { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "owner",
//                     foreignField: "_id",
//                     as: "ownerDetails"
//                 }
//             },
//             { $unwind: "$ownerDetails" },
//             {
//                 $project: {
//                     _id: 1,
//                     carouselname,
//                     title: 1,
//                     description: 1,
//                     images: 1,
//                     buttonText: 1,
//                     buttonTextColor: 1,
//                     buttonHoverTextColor: 1,
//                     buttonBackground: 1,
//                     buttonHoverBackground: 1,
//                     buttonShadow: 1,
//                     buttonShadowColor: 1,
//                     buttonBorder: 1,
//                     buttonBorderColor: 1,
//                     titleColor: 1,
//                     tileBackground: 1,
//                     descriptionColor: 1,
//                     discriptionBackgroundColor: 1,
//                     fontFamily: 1,
//                     category: 1,
//                     createdAt: 1,
//                     ownerDetails: {
//                         username: 1,
//                         fullName: 1,
//                         avatar: 1
//                     }
//                 }
//             }
//         ]),
//         options
//     );

//     return res.status(200).json(
//         new ApiResponse(200, carousels, "Store carousels retrieved successfully")
//     );
// });


// Get all carousels for a store
export const getStoreCarousels = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // // Validate storeId format
    // if (!mongoose.Types.ObjectId.isValid(storeId)) {
    //     throw new ApiError(400, "Invalid Store ID format");
    // }

    // Check if store exists
    // const store = await CreateStore.findById(storeId);
    // if (!store) {
    //     throw new ApiError(404, "Store not found");
    // }

    // Get carousels with pagination
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    };

    const store_carousels = await Store_Carousel.aggregatePaginate(
        Store_Carousel.aggregate([
            { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
            {
                $project: {
                    _id: 1,
                    carouselname: 1,
                    title: 1,
                    description: 1,
                    images: 1,
                    buttonText: 1,
                    buttonTextColor: 1,
                    buttonHoverTextColor: 1,
                    buttonBackground: 1,
                    buttonHoverBackground: 1,
                    buttonShadow: 1,
                    buttonShadowColor: 1,
                    buttonBorder: 1,
                    buttonBorderColor: 1,
                    titleColor: 1,
                    tileBackground: 1,
                    descriptionColor: 1,
                    discriptionBackgroundColor: 1,
                    fontFamily: 1,
                    category: 1,
                    createdAt: 1
                }
            }
        ]),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, store_carousels, "Store carousels retrieved successfully")
    );
});



// Update a carousel
export const updateCarousel = asyncHandler(async (req, res) => {
    const { carouselId, storeId } = req.params;
    const {
        title,
        carouselname,
        description,
        buttonText,
        buttonTextColor,
        buttonHoverTextColor,
        buttonBackground,
        buttonHoverBackground,
        buttonShadow,
        buttonShadowColor,
        buttonBorder,
        buttonBorderColor,
        titleColor,
        tileBackground,
        descriptionColor,
        discriptionBackgroundColor,
        fontFamily,
        category
    } = req.body;

    // Get the carousel
    const store_carousel = await Store_Carousel.findById(carouselId);
    if (!store_carousel) {
        throw new ApiError(404, "Carousel not found");
    }

    // // Verify ownership
    // if (carousel.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }

    // Handle new image uploads if provided
    if (req.files?.images && Array.isArray(req.files.images)) {
        const imageUrls = [];
        for (const image of req.files.images) {
            const result = await uploadResult(image.path);
            if (!result?.url) {
                throw new ApiError(500, "Error uploading image");
            }
            imageUrls.push(result.url);
        }
        store_carousel.images = imageUrls;
    }

    // Update other fields
    if (title) store_carousel.title = title;
    if(carouselname) store_carousel.carouselname =carouselname


    const existcarousel = await Store_Carousel.findOne({store:storeId,carouselname:carouselname})

    if (existcarousel){

        throw new ApiError(400,"Carousel name in store already exists in this store")
    }

    if (description) store_carousel.description = description;
    if (buttonText) store_carousel.buttonText = buttonText;
    if (buttonTextColor) store_carousel.buttonTextColor = buttonTextColor;
    if (buttonHoverTextColor) store_carousel.buttonHoverTextColor = buttonHoverTextColor;
    if (buttonBackground) store_carousel.buttonBackground = buttonBackground;
    if (buttonHoverBackground)store_carousel.buttonHoverBackground = buttonHoverBackground;
    if (buttonShadow !== undefined) store_carousel.buttonShadow = buttonShadow;
    if (buttonShadowColor) store_carousel.buttonShadowColor = buttonShadowColor;
    if (buttonBorder !== undefined) store_carousel.buttonBorder = buttonBorder;
    if (buttonBorderColor) store_carousel.buttonBorderColor = buttonBorderColor;
    if (titleColor) store_carousel.titleColor = titleColor;
    if (tileBackground) store_carousel.tileBackground = tileBackground;
    if (descriptionColor) store_carousel.descriptionColor = descriptionColor;
    if (discriptionBackgroundColor) store_carousel.discriptionBackgroundColor = discriptionBackgroundColor;
    if (fontFamily) store_carousel.fontFamily = fontFamily;
    if (category) store_carousel.category = category;

    await store_carousel.save();

    return res.status(200).json(
        new ApiResponse(200, store_carousel, "Carousel updated successfully")
    );
});

// Delete a carousel
export const deleteCarousel = asyncHandler(async (req, res) => {
    const { carouselId ,storeId} = req.params;

if(!storeId || !carouselId){

    throw new ApiError(400,"storeid and carouselId is required")
}

    const store_carousel = await Store_Carousel.findById(carouselId);
    if (!store_carousel) {
        throw new ApiError(404, "Carousel not found");
    }
   
    
   

    // // Verify ownership
    // if (carousel.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }

    await Store_Carousel.findByIdAndDelete(carouselId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Carousel deleted successfully")
    );
});
