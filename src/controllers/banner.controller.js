// only the authorize user can create banner
//banner cotain banner with their owner data mean who create the banner all his info in response with it
// user create rank one banner three times a month
//rank two 5 times a month 
// rank three 6 times a month
//rank four 7 times a month
//rank five 7 times a month
//and all other 8 times a month
// if a persone want more in month he should pay for it
// user can book the banner
// banner delete after 24 hours
// banner deleted after 12 hours
// there are the limit of only 3 banner at a time 
// mean three differnt user add one banner if a fourth ueer try to add the banner and there are aleady three then he get banner is already fill you will not same for 5 and soo on user
// they can book their slot for banner according to the dates if the slot aleady filled then he get slot aleady book pick another date 
// from database check the avalible slot and send to user.
// catagoury,image,smallheading,bigheading,

import { Banner } from "../models/banner.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadResult } from "../utils/Claudnary.js";
//uploadResult
// Helper function to get monthly banner limit based on user rank
const getMonthlyBannerLimit = (userRank) => {
    const limits = {
        1: 3,  // Rank 1: 3 banners/month
        2: 5,  // Rank 2: 5 banners/month
        3: 6,  // Rank 3: 6 banners/month
        4: 7,  // Rank 4: 7 banners/month
        5: 7,  // Rank 5: 7 banners/month
        default: 8  // Other ranks: 8 banners/month
    };
    return limits[userRank] || limits.default;
};

// Helper function to check if slot is available
const isSlotAvailable = async (startDate, endDate) => {
    const existingBanners = await Banner.countDocuments({
        $or: [
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
            { startDate: { $gte: startDate, $lte: endDate } }
        ]
    });
    return existingBanners < 3; // Maximum 3 banners at a time
};

// Create banner
const createBanner = asyncHandler(async (req, res) => {
    const {
        bigheadingText,
        bigheadingSize,
        bigheadingColor,
        bigheadingBackground,
        smallheadingText,
        smallheadingSize,
        smallheadingColor,
        smallheadingBackgroundcolor,
        buttonText,
        buttonTextColor,
        buttonHoverTextColor,
        buttonBackground,
        buttonHoverBackground,
        buttonshadow,
        buttonshadowColor,
        buttonborder,
        buttonborderColor,
        buttonborderSize,
        category,
        Image,
        ImageAlt,
        targetUrl,
        animationType,
        animationDuration,
        animationDelay,
        fontFamily,
        startDate,
        endDate
    } = req.body;

    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check monthly banner limit
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyBannerCount = await Banner.countDocuments({
        owner: user._id,
        createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
        }
    });

    const monthlyLimit = getMonthlyBannerLimit(user.rank);
    if (monthlyBannerCount >= monthlyLimit) {
        throw new ApiError(400, `Monthly banner limit (${monthlyLimit}) reached`);
    }

    // Check slot availability
    if (!await isSlotAvailable(startDate, endDate)) {
        throw new ApiError(400, "Selected slot is not available");
    }

    // Upload background image
    const backgroundImageLocalPath = req.files?.backgroundImage[0]?.path;
    if (!backgroundImageLocalPath) {
        throw new ApiError(400, "Background image is required");
    }
    const backgroundImage = await uploadResult(backgroundImageLocalPath);

    // Create banner
    const banner = await Banner.create({
        bigheadingText,
        bigheadingSize,
        bigheadingColor,
        bigheadingBackground,
        smallheadingText,
        smallheadingSize,
        smallheadingColor,
        smallheadingBackgroundcolor,
        buttonText,
        buttonTextColor,
        buttonHoverTextColor,
        buttonBackground,
        buttonHoverBackground,
        buttonshadow,
        buttonshadowColor,
        buttonborder,
        buttonborderColor,
        buttonborderSize,
        category,
        Image,
        ImageAlt,
        targetUrl,
        BackgroundImage: backgroundImage.url,
        animationType,
        animationDuration,
        animationDelay,
        fontFamily,
        startDate,
        endDate,
        owner: user._id,
        bannerrank: user.rank
    });

    return res
        .status(201)
        .json(new ApiResponse(201, banner, "Banner created successfully"));
});

// Get available slots
const getAvailableSlots = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        throw new ApiError(400, "Start date and end date are required");
    }

    const availableSlots = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const isAvailable = await isSlotAvailable(currentDate, nextDay);
        if (isAvailable) {
            availableSlots.push({
                startDate: new Date(currentDate),
                endDate: new Date(nextDay)
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, availableSlots, "Available slots retrieved successfully"));
});

// Get all banners with pagination
const getAllBanners = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category } = req.query;
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: 'owner'
    };

    const query = {};
    if (category) {
        query.category = category;
    }

    const banners = await Banner.paginate(query, options);

    return res
        .status(200)
        .json(new ApiResponse(200, banners, "Banners retrieved successfully"));
});

// Delete banner
const deleteBanner = asyncHandler(async (req, res) => {
    const { bannerId } = req.params;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }

    // Check if user is owner or admin
    if (banner.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "Not authorized to delete this banner");
    }

    await Banner.findByIdAndDelete(bannerId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Banner deleted successfully"));
});

// Get user's monthly banner count
const getMonthlyBannerCount = asyncHandler(async (req, res) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyBannerCount = await Banner.countDocuments({
        owner: req.user._id,
        createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
        }
    });

    const monthlyLimit = getMonthlyBannerLimit(req.user.rank);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            count: monthlyBannerCount,
            limit: monthlyLimit,
            remaining: monthlyLimit - monthlyBannerCount
        }, "Monthly banner count retrieved successfully"));
});

export {
    createBanner,
    getAvailableSlots,
    getAllBanners,
    deleteBanner,
    getMonthlyBannerCount
};