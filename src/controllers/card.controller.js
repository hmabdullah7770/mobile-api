import mongoose, {isValidObjectId} from "mongoose"
import Card from "../models/card.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadResult} from "../utils/Claudnary.js"
import {ContentRegistry} from "../models/contentRegistry.model.js"
import { processSocialLinks } from "../utils/socialLinks.js"

//this like an instagram or facebook post (i.e person post the the thir post other can see only and the person who create that post belongs to that person and he can only update and delete their post )

//this is the varified user ID ==> req.userVerfied._id (MEANS USER WHO HAVE ACCESS TOKEN AND REFRESH TOKEN)
// i will provide you the user model and controller so that you get the user details only a user who is verfied can create the card and   the card belongs to his profile he can update and delete only the card he create not others 
//I tell you the task unverifed or vrifed user can do search cards
//verified user can only create cards
//unverified and verfied user can see the cards
//the user who create the card can update and delete the card
//use cloudinary to upload the images
//use aggragation where they are batter to use as your chose to use aggrgation or sub aggrigation piplines
//see the user controller so you can under stand how i write the code and how  i do the task use aggrigation where it only required

const getAllCards = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "averageRating", sortType = "desc", userId } = req.query
    
    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    
    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber
    
    // Prepare match stage for aggregation
    const matchStage = {}
    
    // Add search query if provided
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }
    
    // Add userId filter if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Add isPublished filter - only show published cards
    matchStage.isPublished = true
    
    // Prepare sort options
    const sortOptions = {}
    
    if (sortBy === "averageRating") {
        // First sort by averageRating, then by totalViews for cards with no ratings
        sortOptions.averageRating = sortType === "desc" ? -1 : 1
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy === "totalViews") {
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        // Default sort by rating, then views
        sortOptions.averageRating = -1
        sortOptions.totalViews = -1
    }
    
    // Execute aggregation pipeline
    const cards = await Card.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        },
        {
            $sort: sortOptions
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        }
    ])
    
    // Get total count for pagination info
    const totalCards = await Card.countDocuments(matchStage)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCards / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            cards,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalCards,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Cards fetched successfully")
    )
})



const getCardById = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Use aggregation to get card with owner details
    const card = await Card.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(cardId),
                isPublished: true // Only fetch published cards
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
            }
        }
    ])
    
    // Check if card exists
    if (!card || card.length === 0) {
        throw new ApiError(404, "Card not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, card[0], "Card fetched successfully")
    );
})

// controllers/card.controller.js

// Create Card
const publishCard = asyncHandler(async (req, res) => {
    const { title, description, category, ...socialPayload } = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if ( !category) {
        throw new ApiError(400, "Category is required");
    }

    const user = await User.findById(req.userVerfied._id);
    if (!user) throw new ApiError(404, "User not found");


    // Debug logging
    console.log("User social links:", {
        whatsapp: user.whatsapp,
        exists: user.whatsapp !== undefined
    });


    try {
        // Process social links for creation
        const socialLinks = processSocialLinks(user, socialPayload);

        // // Handle thumbnail upload
        // const thumbnail = await uploadResult(req.files?.path);
        // if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");


        // Handle thumbnail upload - FIXED
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail file is required");
        }
        
        const thumbnail = await uploadResult(thumbnailLocalPath);
        if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");


        console.log("Final socialLinks:", socialLinks);

        // Create card
        const card = await Card.create({
            title,
            description,
            category,
            thumbnail: thumbnail.url,
            owner: user._id,
            ...socialLinks.socialLinks 
        });


        await ContentRegistry.create({
            originalId: card._id,
            contentType: "card"
        });


        return res.status(201).json(
            new ApiResponse(201, card, "Card created successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
});


const updateCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { title,  category, description, ...socialPayload } = req.body;
    
    const card = await Card.findById(cardId);
    if (!card) throw new ApiError(404, "Card not found");
    
    try {
        // Process social links for update
        const user = await User.findById(req.userVerfied._id);
        const updateOps = processSocialLinks(user, socialPayload, card);
        
        // Initialize $set if it doesn't exist
        if (!updateOps.$set) updateOps.$set = {};
        
        // Add title/description updates if provided
        if (title) updateOps.$set.title = title;
        if (description) updateOps.$set.description = description;
        if (category) updateOps.$set.description = category;
        // Handle thumbnail upload (only if provided)
        const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
        if (thumbnailLocalPath) {
            const thumbnail = await uploadResult(thumbnailLocalPath);
            if (!thumbnail?.url) throw new ApiError(400, "Thumbnail upload failed");
            updateOps.$set.thumbnail = thumbnail.url;
        }
        
        // Check if there's anything to update
        if (Object.keys(updateOps).length === 0 || 
            (Object.keys(updateOps).length === 1 && 
             Object.keys(updateOps.$set).length === 0)) {
            throw new ApiError(400, "No updates provided");
        }
        
        // Perform update
        const updatedCard = await Card.findByIdAndUpdate(
            cardId,
            updateOps,
            { new: true }
        ).populate('owner', 'username fullName avatar');
        
        return res.status(200).json(
            new ApiResponse(200, updatedCard, "Card updated successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
});



// Error handling helper
const handleSocialLinkError = (error) => {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Operation failed: ${error.message}`);
};


// const updateCard = asyncHandler(async (req, res) => {
//     const { cardId } = req.params;
//     const { title, description, whatsapp, storeLink, facebook, instagram, productlink } = req.body;
    
//     // Validate cardId
//     if (!isValidObjectId(cardId)) {
//         throw new ApiError(400, "Invalid card ID");
//     }
    
//     // Find the card
//     const card = await Card.findById(cardId);
    
//     if (!card) {
//         throw new ApiError(404, "Card not found");
//     }
    
//     // Check if the user is the owner of the card
//     if (card.owner.toString() !== req.userVerfied._id.toString()) {
//         throw new ApiError(403, "You are not authorized to update this card");
//     }
    
//     // Get the user to verify they have the social links they're trying to use
//     const user = await User.findById(req.userVerfied._id);
    
//     // Get social links updates
//     let socialLinkUpdates;
//     try {
//         socialLinkUpdates = updateSocialLinks(user, card, req.body);
//     } catch (error) {
//         throw new ApiError(400, error.message);
//     }
    
//     // Handle thumbnail upload if provided
//     let thumbnailUrl = card.thumbnail;
    
//     if (req.file && req.file.path) {
//         const thumbnail = await uploadResult(req.file.path);
        
//         if (!thumbnail || !thumbnail.url) {
//             throw new ApiError(500, "Error uploading thumbnail to cloudinary");
//         }
        
//         thumbnailUrl = thumbnail.url;
//     }
    
//     // Update the card
//     const updateData = {
//         ...(title && { title }),
//         ...(description && { description }),
//         ...(thumbnailUrl !== card.thumbnail && { thumbnail: thumbnailUrl }),
//         ...socialLinkUpdates
//     };
    
//     const updatedCard = await Card.findByIdAndUpdate(
//         cardId,
//         { $set: updateData },
//         { new: true }
//     ).populate("owner", "username fullName avatar");
    
//     return res.status(200).json(
//         new ApiResponse(200, updatedCard, "Card updated successfully")
//     );
// });

const deleteCard = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    
    // Check if the user is the owner of the card
    if (card.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this card");
    }
    
//    // Remove from content registry
   await ContentRegistry.findOneAndDelete({
    originalId: cardId,
    contentType: "card"
});


    // Delete the card
    await Card.findByIdAndDelete(cardId);


    
    return res.status(200).json(
        new ApiResponse(200, {}, "Card deleted successfully")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { cardId } = req.params
    
    // Validate cardId
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID");
    }
    
    // Find the card
    const card = await Card.findById(cardId);
    
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    
    // Check if the user is the owner of the card
    if (card.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this card");
    }
    
    // Toggle the publish status
    card.isPublished = !card.isPublished;
    
    // Save the card
    await card.save();
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { isPublished: card.isPublished }, 
            `Card ${card.isPublished ? 'published' : 'unpublished'} successfully`
        )
    );
})

// New function to increment view count when a social link is clicked
const incrementSocialLinkView = asyncHandler(async (req, res) => {
    const { cardId, linkType } = req.params
    
    if (!isValidObjectId(cardId)) {
        throw new ApiError(400, "Invalid card ID")
    }
    
    if (!["whatsapp", "storeLink", "facebook", "instagram", "productlink"].includes(linkType)) {
        throw new ApiError(400, "Invalid link type")
    }
    
    // Find the card
    const card = await Card.findById(cardId)
    
    if (!card) {
        throw new ApiError(404, "Card not found")
    }
    
    // Check if the requested link type exists on this card
    if (!card[linkType]) {
        throw new ApiError(404, "This card doesn't have the requested social link")
    }
    
    // Increment view count
    card.totalViews += 1
    await card.save()
    
    // Return the link URL
    return res.status(200).json(
        new ApiResponse(200, { 
            url: card[linkType],
            totalViews: card.totalViews
        }, "View counted and link retrieved")
    )
})

export {
    getAllCards,
    publishCard,
    getCardById,
    updateCard,
    deleteCard,
    togglePublishStatus,
    incrementSocialLinkView
}
