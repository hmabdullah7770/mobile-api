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

import  Banner  from "../models/banner.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadResult } from "../utils/Claudnary.js";




// export const createbanner = asyncHandler(async (req, res) => {
//     const { 
       
//         store // Add store ID to request body
//     } = req.body;


//  // Check total active banners (less than 24 hours old)
//     const activeBanners = await Banner.countDocuments({
//         createdAt: { 
//             $gte: new Date(Date.now() - 24*60*60*1000) 
//         }
//     });

//     if (activeBanners >= 5) {
//         throw new ApiError(
//             400, 
//             "Maximum banner limit reached (5). Please try again when existing banners expire."
//         );
//     }


//     // // Validate required fields
//     // if(!bannerbutton) {
//     //     throw new ApiError(400, "Banner button is required");
//     // }

//     if (!req.files?.bannerImage?.[0]) {
//         throw new ApiError(400, "Banner image is required");
//     }

//     // Upload image to Cloudinary
//     const bannerimgLocalpath = req.files.bannerImage[0].path;
//     const bannerImage = await uploadResult(bannerimgLocalpath);
    
//     if (!bannerImage?.url) {
//         throw new ApiError(400, "Error while uploading banner image");
//     }

//     // Get user from middleware
//     const user = await User.findById(req.userVerfied._id);
//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

   

//     // Create banner with correct fields
//     const banner = await Banner.create({
//         // bannerbutton,
//         bannerImage: bannerImage.url, // Only store the URL
//         owner: user._id, // Set owner ID
//         store, // Set store ID
//         createdAt: new Date()
//     });

//     const expiryTime = new Date(banner.createdAt.getTime() + 24*60*60*1000);

//     return res.status(201).json(
//         new ApiResponse(
//             201, 
//             {
//                 ...banner.toObject(),
//                 expiryTime,
//                 timeRemaining: "24 hours"
//             },
//             "Banner created successfully"
//         )
//     );
// });





export const createbanner = asyncHandler(async (req, res) => {
    const { store } = req.body;

// Check total active banners (less than 24 hours old)
    const activeBanners = await Banner.countDocuments({
        createdAt: { 
            $gte: new Date(Date.now() - 24*60*60*1000) 
        }
    });

    if (activeBanners >= 5) {
        throw new ApiError(
            400, 
            "Maximum banner limit reached (5). Please try again when existing banners expire."
        );
    }


    // Get user from middleware
    const user = await User.findById(req.userVerfied._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if user already has an active banner (created within last 24 hours)
    const existingBanner = await Banner.findOne({
        owner: user._id,
        createdAt: { 
            $gte: new Date(Date.now() - 24*60*60*1000) 
        }
    });

    if (existingBanner) {
        const timeLeft = new Date(existingBanner.createdAt.getTime() + 24*60*60*1000) - new Date();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        throw new ApiError(
            400, 
            `You already have an active banner. Please wait ${hoursLeft}h ${minutesLeft}m before creating a new one.`
        );
    }

    // Validate banner image
    if (!req.files?.bannerImage?.[0]) {
        throw new ApiError(400, "Banner image is required");
    }

    // Upload image to Cloudinary
    const bannerimgLocalpath = req.files.bannerImage[0].path;
    const bannerImage = await uploadResult(bannerimgLocalpath);
    
    if (!bannerImage?.url) {
        throw new ApiError(401, "Error while uploading banner image");
    }

    // Create banner with correct fields
    const banner = await Banner.create({
        bannerImage: bannerImage.url,
        owner: user._id,
        store,
        createdAt: new Date()
    });

    const expiryTime = new Date(banner.createdAt.getTime() + 24*60*60*1000);

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                ...banner.toObject(),
                expiryTime,
                timeRemaining: "24 hours"
            },
            "Banner created successfully"
        )
    );


});




// export const getBanner = asyncHandler(async (req, res) => {

//     const {adminpassword} = req.query

//     if (adminpassword !== "(Bunny)tota#34#") {
//         throw new ApiError(403, "you dont access the banner");
        
//     } 
//     const banners = await Banner.find().populate("user");
    
//     const bannersWithTimeRemaining = banners.map(banner => {
//         const now = new Date();
//         const expiryTime = new Date(banner.createdAt.getTime() + 24*60*60*1000);
//         const remainingMs = expiryTime - now;
//         const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
//         const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

//         return {
//             ...banner.toObject(),
//             timeRemaining: `${remainingHours}h ${remainingMinutes}m`,
//             expiryTime
//         };
//     });

//     return res.status(200).json(
//         new ApiResponse(
//             200, 
//             bannersWithTimeRemaining, 
//             "Banners fetched successfully"
//         )


//           );
// });





export const getBanner = asyncHandler(async (req, res) => {
    const {adminpassword} = req.query

    if (adminpassword !== "(Bunny)tota#34#") {
        throw new ApiError(403, "you dont access the banner");
    }

    const banners = await Banner.aggregate([
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
        {
            $project: {
                bannerImage: 1,
                bannerbutton: 1,
                store: 1,
                createdAt: 1,
                ownerDetails: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    email: 1,
                    avatar: 1
                    // Add any other user fields you want to include
                }
            }
        }
    ]);
    
    const bannersWithTimeRemaining = banners.map(banner => {
        const now = new Date();
        const expiryTime = new Date(banner.createdAt.getTime() + 24*60*60*1000);
        const remainingMs = expiryTime - now;
        const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
        const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

        return {
            ...banner,
            timeRemaining: `${remainingHours}h ${remainingMinutes}m`,
            expiryTime
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200, 
            bannersWithTimeRemaining, 
            "Banners fetched successfully"
        )
    );
});



export const deleteBanner = asyncHandler(async (req, res) => {
    const { bannerId } = req.query;
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }
    return res.status(200).json(new ApiResponse(200, banner, "Banner deleted successfully"));
});

// //uploadResult
// // Helper function to get monthly banner limit based on user rank
// const getMonthlyBannerLimit = (userRank) => {
//     const limits = {
//         1: 3,  // Rank 1: 3 banners/month
//         2: 5,  // Rank 2: 5 banners/month
//         3: 6,  // Rank 3: 6 banners/month
//         4: 7,  // Rank 4: 7 banners/month
//         5: 7,  // Rank 5: 7 banners/month
//         default: 8  // Other ranks: 8 banners/month
//     };
//     return limits[userRank] || limits.default;
// };

// // Helper function to check if slot is available
// const isSlotAvailable = async (startDate, endDate) => {
//     const existingBanners = await Banner.countDocuments({
//         $or: [
//             { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
//             { startDate: { $gte: startDate, $lte: endDate } }
//         ]
//     });
//     return existingBanners < 3; // Maximum 3 banners at a time
// };

// // Create banner
// const createBanner = asyncHandler(async (req, res) => {
//     const {
//         bigheadingText,
//         bigheadingSize,
//         bigheadingColor,
//         bigheadingBackground,
//         smallheadingText,
//         smallheadingSize,
//         smallheadingColor,
//         smallheadingBackgroundcolor,
//         buttonText,
//         buttonTextColor,
//         buttonHoverTextColor,
//         buttonBackground,
//         buttonHoverBackground,
//         buttonshadow,
//         buttonshadowColor,
//         buttonborder,
//         buttonborderColor,
//         buttonborderSize,
//         category,
//         Image,
//         ImageAlt,
//         targetUrl,
//         animationType,
//         animationDuration,
//         animationDelay,
//         fontFamily,
//         startDate,
//         endDate
//     } = req.body;

//     // Check if user exists
//     const user = await User.findById(req.user._id);
//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     // Check monthly banner limit
//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();
//     const monthlyBannerCount = await Banner.countDocuments({
//         owner: user._id,
//         createdAt: {
//             $gte: new Date(currentYear, currentMonth, 1),
//             $lt: new Date(currentYear, currentMonth + 1, 1)
//         }
//     });

//     const monthlyLimit = getMonthlyBannerLimit(user.rank);
//     if (monthlyBannerCount >= monthlyLimit) {
//         throw new ApiError(400, `Monthly banner limit (${monthlyLimit}) reached`);
//     }

//     // Check slot availability
//     if (!await isSlotAvailable(startDate, endDate)) {
//         throw new ApiError(400, "Selected slot is not available");
//     }

//     // Upload background image
//     const backgroundImageLocalPath = req.files?.backgroundImage[0]?.path;
//     if (!backgroundImageLocalPath) {
//         throw new ApiError(400, "Background image is required");
//     }
//     const backgroundImage = await uploadResult(backgroundImageLocalPath);

//     // Create banner
//     const banner = await Banner.create({
//         bigheadingText,
//         bigheadingSize,
//         bigheadingColor,
//         bigheadingBackground,
//         smallheadingText,
//         smallheadingSize,
//         smallheadingColor,
//         smallheadingBackgroundcolor,
//         buttonText,
//         buttonTextColor,
//         buttonHoverTextColor,
//         buttonBackground,
//         buttonHoverBackground,
//         buttonshadow,
//         buttonshadowColor,
//         buttonborder,
//         buttonborderColor,
//         buttonborderSize,
//         category,
//         Image,
//         ImageAlt,
//         targetUrl,
//         BackgroundImage: backgroundImage.url,
//         animationType,
//         animationDuration,
//         animationDelay,
//         fontFamily,
//         startDate,
//         endDate,
//         owner: user._id,
//         bannerrank: user.rank
//     });

//     return res
//         .status(201)
//         .json(new ApiResponse(201, banner, "Banner created successfully"));
// });

// // Get available slots
// const getAvailableSlots = asyncHandler(async (req, res) => {
//     const { startDate, endDate } = req.query;

//     if (!startDate || !endDate) {
//         throw new ApiError(400, "Start date and end date are required");
//     }

//     const availableSlots = [];
//     const currentDate = new Date(startDate);
//     const endDateObj = new Date(endDate);

//     while (currentDate <= endDateObj) {
//         const nextDay = new Date(currentDate);
//         nextDay.setDate(nextDay.getDate() + 1);

//         const isAvailable = await isSlotAvailable(currentDate, nextDay);
//         if (isAvailable) {
//             availableSlots.push({
//                 startDate: new Date(currentDate),
//                 endDate: new Date(nextDay)
//             });
//         }

//         currentDate.setDate(currentDate.getDate() + 1);
//     }

//     return res
//         .status(200)
//         .json(new ApiResponse(200, availableSlots, "Available slots retrieved successfully"));
// });

// // Get all banners with pagination
// const getAllBanners = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, category } = req.query;
//     const options = {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         sort: { createdAt: -1 },
//         populate: 'owner'
//     };

//     const query = {};
//     if (category) {
//         query.category = category;
//     }

//     const banners = await Banner.paginate(query, options);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, banners, "Banners retrieved successfully"));
// });

// // Delete banner
// const deleteBanner = asyncHandler(async (req, res) => {
//     const { bannerId } = req.params;

//     const banner = await Banner.findById(bannerId);
//     if (!banner) {
//         throw new ApiError(404, "Banner not found");
//     }

//     // Check if user is owner or admin
//     if (banner.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//         throw new ApiError(403, "Not authorized to delete this banner");
//     }

//     await Banner.findByIdAndDelete(bannerId);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, null, "Banner deleted successfully"));
// });

// // Get user's monthly banner count
// const getMonthlyBannerCount = asyncHandler(async (req, res) => {
//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();

//     const monthlyBannerCount = await Banner.countDocuments({
//         owner: req.user._id,
//         createdAt: {
//             $gte: new Date(currentYear, currentMonth, 1),
//             $lt: new Date(currentYear, currentMonth + 1, 1)
//         }
//     });

//     const monthlyLimit = getMonthlyBannerLimit(req.user.rank);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, {
//             count: monthlyBannerCount,
//             limit: monthlyLimit,
//             remaining: monthlyLimit - monthlyBannerCount
//         }, "Monthly banner count retrieved successfully"));
// });

// export {
//     createBanner,
//     getAvailableSlots,
//     getAllBanners,
//     deleteBanner,
//     getMonthlyBannerCount
// };