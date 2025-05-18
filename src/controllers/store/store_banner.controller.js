import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadResult } from "../../utils/Claudnary.js";
import Store_Banner from "../../models/store/store_banner.model.js";
import mongoose  from "mongoose";

// Add a banner to a store
export const addBanner = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { title, description, product ,addbutton,buttontextcolor,buttontexthover,buttoncolor,buttoncolorhover} = req.body;



    const existbanner = await Store_Banner.findOne({store:storeId,title:title})

    if (existbanner){

        throw new ApiError(400,"Banner in store already exists in this store")
    }
    // if (!req.files?.bannerImage) {
    //     throw new ApiError(400, "Banner image is required");
    // }
    
    // const bannerImage = await uploadResult(req.files.bannerImage[0]?.path);
    
    // if (!bannerImage.url) {
    //     throw new ApiError(500, "Error uploading banner image");
    // }



    // // Check if store exists and user is the owner
    // const store = await CreateStore.findById(storeId);
    // if (!store) {
    //     throw new ApiError(404, "Store not found");
    // }
    // if (store.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }


    if (!req.files || !req.files.bannerImage || !req.files.bannerImage[0]) {
        throw new ApiError(400, "Banner image is required");
    }
    
    const bannerLocalpath = req.files.bannerImage[0].path;
    if (!bannerLocalpath) {
        throw new ApiError(400, "Banner Image path not found");
    }
    
    const bannerImage = await uploadResult(bannerLocalpath);
    if (!bannerImage.url) {
        throw new ApiError(404, "Banner Image url not found");
    }
    
      
    



    const store_banner = await Store_Banner.create({
        store: storeId,
        title,
        description,
        bannerImage: bannerImage.url,
        product,
        addbutton,
        buttontextcolor,
        buttontexthover,
        buttoncolor,
        buttoncolorhover
    });
    
    return res.status(201).json(
        new ApiResponse(201, store_banner, "Banner added successfully")
    );
});

// Get all banners for a store
export const getStoreBanners = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    console.log("Searching for banners with storeId:", storeId);
    
    const store_banners = await Store_Banner.find({ store: storeId });
    console.log("Found banners:", store_banners);
    
    return res.status(200).json(
        new ApiResponse(200, store_banners, "Store banners retrieved successfully")
    );
});

// Update a banner
export const updateBanner = asyncHandler(async (req, res) => {
    // const { bannerId } = req.params;
    const { bannerId, storeId } = req.params;
    const { title, description, product } = req.body;
    
    const store_banner = await Store_Banner.findById(bannerId);
    
    if (!store_banner) {
        throw new ApiError(404, "Banner not found");
    }
    
    // Check if the banner belongs to the store
    if (store_banner.store.toString() !== req.store._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this banner");
    }
    
    if (title) store_banner.title = title;

    const existbanner = await Store_Banner.findOne({store:storeId,title:title})

    if (existbanner){

        throw new ApiError(400,"Banner in store  already exists in this store")
    }
    if (description) store_banner.description = description;
    if (product) store_banner.product = product;
    
    if (req.files?.bannerImage) {
        const bannerImage = await uploadResult(req.files.bannerImage[0]?.path);
        
        if (!bannerImage.url) {
            throw new ApiError(500, "Error uploading banner image");
        }
        
        store_banner.image = bannerImage.url;
    }
    
    await store_banner.save();
    
    return res.status(200).json(
        new ApiResponse(200, store_banner, "Banner updated successfully")
    );
});

// Delete a banner
export const deleteBanner = asyncHandler(async (req, res) => {
    const { bannerId } = req.params;
    
    const store_banner = await Store_Banner.findById(bannerId);
    
    if (!store_banner) {
        throw new ApiError(404, "Banner not found");
    }
    
    // Check if the banner belongs to the store
    if (store_banner.store.toString() !== req.store._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this banner");
    }
    
    await Store_Banner.findByIdAndDelete(bannerId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Banner deleted successfully")
    );
});
