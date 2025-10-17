import mongoose, {isValidObjectId} from "mongoose"
import {Post} from "../models/post.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadResult} from "../utils/Claudnary.js"
import { processSocialLinks } from "../utils/socialLinks.js"
import Categoury from "../models/categoury.model.js"
// Add this import at the top of post.controller.js
import { progressStore } from "../utils/progressStore.js";


// // Remove empty media arrays from response objects when counts are zero
// const pruneEmptyMediaFields = (doc) => {
//     if (!doc || typeof doc !== 'object') return doc;
//     const pruned = { ...doc };
//     if ((pruned.imagecount ?? (Array.isArray(pruned.imageFiles) ? pruned.imageFiles.length : 0)) === 0) {
//         delete pruned.imageFiles;
//     }
//     if ((pruned.videocount ?? (Array.isArray(pruned.videoFiles) ? pruned.videoFiles.length : 0)) === 0) {
//         delete pruned.videoFiles;
//     }
//     return pruned;
// };

// Count empty placeholder text entries ("" or "null") for a given multipart text field
const countPlaceholders = (rawField) => {
    const arr = Array.isArray(rawField)
        ? rawField
        : (rawField !== undefined && rawField !== null ? [rawField] : []);
    return arr.filter((v) => v === '' || v === 'null').length;
};

// Helper function to upload multiple files in parallel
const uploadMultipleFiles = async (files, fileType = 'media') => {
    if (!files || !Array.isArray(files) || files.length === 0) {
        return [];
    }

    try {
        // Upload all files in parallel for better performance
        const uploadPromises = files.map(async (file) => {
            if (!file || !file.path) {
                throw new Error(`Invalid ${fileType} file`);
            }
            
            const result = await uploadResult(file.path);
            if (!result?.url) {
                throw new Error(`${fileType} upload failed`);
            }
            
            return result.url;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        return uploadedUrls.filter(url => url); // Filter out any null/undefined urls
    } catch (error) {
        throw new ApiError(400, `Failed to upload ${fileType} files: ${error.message}`);
    }
};

// Helper function to format media files according to schema using parallel arrays
const formatMediaFiles = (mediaUrls, 
    
    // mediaSizes = []

) => {
    return mediaUrls.map((url, index) => ({
        url: url,
        // size: mediaSizes[index] || 'L',
        position: index + 1
    }));
};

// Helper function to validate media files structure
const validateMediaFiles = (files) => {
    const errors = [];
    
    if (files.imageFiles && !Array.isArray(files.imageFiles)) {
        errors.push("imageFiles must be an array");
    }
    
    if (files.videoFiles && !Array.isArray(files.videoFiles)) {
        errors.push("videoFiles must be an array");
    }
    
    if (files.audioFiles && !Array.isArray(files.audioFiles)) {
        errors.push("audioFiles must be an array");
    }
    
    if (errors.length > 0) {
        throw new ApiError(400, errors.join(", "));
    }
};

// Get all posts with pagination and filtering
const getAllPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, category, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
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
    
    // Add category filter if provided
    if (category) {
        matchStage.category = category
    }
    
    // Add userId filter if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }
    
    // Add isPublished filter - only show published posts
    matchStage.isPublished = true
    
    // Prepare sort options
    const sortOptions = {}
    
    if (sortBy === "averageRating") {
        sortOptions.averageRating = sortType === "desc" ? -1 : 1
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy === "totalViews") {
        sortOptions.totalViews = sortType === "desc" ? -1 : 1
    } else if (sortBy) {
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        // Default sort by creation date
        sortOptions.createdAt = -1
    }
    
    // Execute aggregation pipeline
    let posts = await Post.aggregate([
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
                            avatar: 1,
                            stores: 1,
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
    
    // Prune empty media arrays per post
    posts = posts.map(pruneEmptyMediaFields);
    
    // Get total count for pagination info
    const totalPosts = await Post.countDocuments(matchStage)
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalPosts / limitNumber)
    const hasNextPage = pageNumber < totalPages
    const hasPrevPage = pageNumber > 1
    
    // Return response
    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPosts,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        }, "Posts fetched successfully")
    )
})

// Get single post by ID
const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Use aggregation to get post with owner details
    let post = await Post.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(postId),
                isPublished: true // Only fetch published posts
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
    
    // Check if post exists
    if (!post || post.length === 0) {
        throw new ApiError(404, "Post not found");
    }
    
    // Increment view count
    await Post.findByIdAndUpdate(postId, {
        $inc: { views: 1, totalViews: 1 }
    })
    
    return res.status(200).json(
        new ApiResponse(200, pruneEmptyMediaFields(post[0]), "Post fetched successfully")
    );
})







// latest with ffmpeg 


// import ffmpeg from 'fluent-ffmpeg';
// import path from 'path';
// import fs from 'fs';
// import { promisify } from 'util';

// // Promisify fs operations
// const unlink = promisify(fs.unlink);
// const access = promisify(fs.access);

// // FFmpeg thumbnail generation middleware/utility
// const generateVideoThumbnail = async (videoPath, outputPath, timeSeek = '50%') => {
//     return new Promise((resolve, reject) => {
//         ffmpeg(videoPath)
//             .screenshots({
//                 timestamps: [timeSeek],
//                 filename: path.basename(outputPath),
//                 folder: path.dirname(outputPath),
//                 size: '640x480'
//             })
//             .on('end', () => {
//                 resolve(outputPath);
//             })
//             .on('error', (err) => {
//                 reject(new Error(`Thumbnail generation failed: ${err.message}`));
//             });
//     });
// };

// // Generate post URL from video center frame
// const generatePostUrl = async (videoPath) => {
//     const tempThumbnailPath = `${videoPath}_temp_thumb.jpg`;
    
//     try {
//         await generateVideoThumbnail(videoPath, tempThumbnailPath, '50%');
        
//         // Upload the generated thumbnail to cloudinary
//         const uploadResult = await uploadResult(tempThumbnailPath);
        
//         // Clean up temp file
//         try {
//             await unlink(tempThumbnailPath);
//         } catch (cleanupError) {
//             console.warn('Failed to cleanup temp thumbnail:', cleanupError.message);
//         }
        
//         return uploadResult?.url || null;
//     } catch (error) {
//         console.error('Post URL generation failed:', error.message);
//         return null;
//     }
// };


// const publishPost = asyncHandler(async (req, res) => {
//     const { 
//         title, 
//         description, 
//         category, 
//         pattern,
        
//         // Store data
//         storeisActive,
//         storeIconSize,
//         storeId,
//         storeUrl,
        
//         // Product data
//         productisActive,
//         productIconSize,
//         ProductId,
//         productUrl,
        
//         // Video autoplay flags
//         autoplay1,
//         autoplay2,
//         autoplay3,
//         autoplay4,
//         autoplay5,

//         // New URL fields
//         facebookurl,
//         instagramurl,
//         whatsappnumberurl,
//         storelinkurl,

//         ...socialPayload 
        
//     } = req.body;
    
//     // STEP 1: VALIDATE ALL INPUT DATA FIRST (BEFORE ANY UPLOADS)
//     // if (!title || !description) throw new ApiError(400, "Title and description are required");
//     if (!category) throw new ApiError(400, "Category is required");

//     // Validate files structure - now checking for numbered fields
//     validateNumberedMediaFiles(req.files || {});

//     const user = await User.findById(req.userVerfied._id);
//     if (!user) throw new ApiError(404, "User not found");

//     // Helper function to check if value is true (handles both boolean and string)
//     const isTrue = (val) => {
//         return val === true || val === 'true' || val === '1';
//     };

//     // STEP 2: VALIDATE SOCIAL MEDIA LOGIC BEFORE UPLOADS
//     // Facebook validation
//     if (isTrue(socialPayload.facebook) && facebookurl) {
//         throw new ApiError(400, "Cannot provide both facebook=true and facebookurl. Choose one.");
//     }
    
//     // Instagram validation  
//     if (isTrue(socialPayload.instagram) && instagramurl) {
//         throw new ApiError(400, "Cannot provide both instagram=true and instagramurl. Choose one.");
//     }
    
//     // WhatsApp validation
//     if (isTrue(socialPayload.whatsapp) && whatsappnumberurl) {
//         throw new ApiError(400, "Cannot provide both whatsapp=true and whatsappnumberurl. Choose one.");
//     }
    
//     // Store link validation
//     if (isTrue(socialPayload.storeLink) && storelinkurl) {
//         throw new ApiError(400, "Cannot provide both storeLink=true and storelinkurl. Choose one.");
//     }

//     // STEP 3: VALIDATE SOCIAL LINKS STRUCTURE
//     let socialLinks = { socialLinks: {} };
//     try {
//         socialLinks = processSocialLinks(user, socialPayload);
//     } catch (socialError) {
//         // If the only error is "At least one social link required", ignore it for posts
//         if (socialError.message === "At least one social link required") {
//             socialLinks = { socialLinks: {} };
//         } else {
//             // Re-throw other social link errors (like missing profile data)
//             throw socialError;
//         }
//     }

//     // Ensure category exists (this is a quick DB operation)
//     const categoryExists = await Categoury.findOne({categouryname: category});
//     if (!categoryExists) await Categoury.create({categouryname: category});

//     // STEP 4: NOW START FILE UPLOADS (ONLY AFTER ALL VALIDATIONS PASS)
//     try {
//         // Initialize upload results
//         let imageResults = {}; // Store as {position: url}
//         let videoResults = {}; // Store as {position: {url, thumbnail, posturl}}
//         let thumbnailResults = {}; // Store thumbnails by position
//         let audioUrls = [];
//         let songUrls = [];

//         const uploadTasks = [];

//         // Handle numbered image files (imageFile1, imageFile2, etc.)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `imageFile${i}`;
//             if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
//                 uploadTasks.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (!result?.url) throw new Error(`Image file ${i} upload failed`);
//                             imageResults[i] = result.url;
//                         })
//                         .catch(error => {
//                             throw new ApiError(400, `Image file ${i} upload failed: ${error.message}`);
//                         })
//                 );
//             }
//         }

//         // Handle numbered thumbnail files (thumbnail1, thumbnail2, etc.)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `thumbnail${i}`;
//             if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
//                 uploadTasks.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (!result?.url) throw new Error(`Thumbnail ${i} upload failed`);
//                             thumbnailResults[i] = result.url;
//                         })
//                         .catch(error => {
//                             throw new ApiError(400, `Thumbnail ${i} upload failed: ${error.message}`);
//                         })
//                 );
//             }
//         }

//         // Handle numbered video files (videoFile1, videoFile2, etc.)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `videoFile${i}`;
//             if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
//                 uploadTasks.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(async (result) => {
//                             if (!result?.url) throw new Error(`Video file ${i} upload failed`);
                            
//                             const videoData = {
//                                 url: result.url,
//                                 thumbnail: null,
//                                 posturl: null
//                             };

//                             // Handle thumbnail: use user-provided or generate if not provided
//                             if (thumbnailResults[i]) {
//                                 // User provided thumbnail - use it
//                                 videoData.thumbnail = thumbnailResults[i];
//                             } else {
//                                 // No user thumbnail - generate one using ffmpeg
//                                 try {
//                                     const generatedThumbnail = await generatePostUrl(req.files[fieldName][0].path);
//                                     if (generatedThumbnail) {
//                                         videoData.thumbnail = generatedThumbnail;
//                                     }
//                                 } catch (thumbError) {
//                                     console.warn(`Failed to generate thumbnail for video ${i}:`, thumbError.message);
//                                 }
//                             }

//                             // Generate post URL only if user didn't provide thumbnail for this video
//                             if (!thumbnailResults[i]) {
//                                 try {
//                                     const postUrl = await generatePostUrl(req.files[fieldName][0].path);
//                                     if (postUrl) {
//                                         videoData.posturl = postUrl;
//                                     }
//                                 } catch (postUrlError) {
//                                     console.warn(`Failed to generate post URL for video ${i}:`, postUrlError.message);
//                                 }
//                             }

//                             videoResults[i] = videoData;
//                         })
//                         .catch(error => {
//                             throw new ApiError(400, `Video file ${i} upload failed: ${error.message}`);
//                         })
//                 );
//             }
//         }

//         // Handle audio files (keeping original structure)
//         if (req.files?.audioFiles?.length) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.audioFiles, 'audio')
//                     .then(urls => audioUrls = urls)
//             );
//         }

//         // Handle song files (keeping original structure)
//         if (req.files?.song?.length) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.song, 'song')
//                     .then(urls => songUrls = urls)
//             );
//         }

//         // Wait for all uploads to complete
//         await Promise.all(uploadTasks);

//         // Convert results to arrays with positions
//         const formattedImageFiles = Object.keys(imageResults)
//             .sort((a, b) => parseInt(a) - parseInt(b))
//             .map(position => ({
//                 url: imageResults[position],
//                 Imageposition: parseInt(position)
//             }));

//         // Helper to parse autoplay values from form-data
//         const parseAutoplayFlag = (val) => {
//             if (val === undefined || val === null) return false;
//             if (typeof val === 'boolean') return val;
//             const s = String(val).trim().toLowerCase();
//             return ['1', 'true', 'yes', 'on'].includes(s);
//         };

//         // Parse autoplay flags
//         const autoplayFlags = { 
//             1: autoplay1, 
//             2: autoplay2, 
//             3: autoplay3, 
//             4: autoplay4, 
//             5: autoplay5 
//         };

//         // Format video files with all metadata
//         const formattedVideoFiles = Object.keys(videoResults)
//             .sort((a, b) => parseInt(a) - parseInt(b))
//             .map(position => {
//                 const videoData = videoResults[position];
//                 const formattedVideo = {
//                     url: videoData.url,
//                     Videoposition: parseInt(position),
//                     autoplay: parseAutoplayFlag(autoplayFlags[position])
//                 };

//                 // Add thumbnail if available
//                 if (videoData.thumbnail) {
//                     formattedVideo.thumbnail = videoData.thumbnail;
//                 }

//                 // Add post URL if available
//                 if (videoData.posturl) {
//                     formattedVideo.posturl = videoData.posturl;
//                 }

//                 return formattedVideo;
//             });

//         // Format store data
//         const storeData = [];
//         if (storeisActive || storeId || storeUrl) {
//             storeData.push({
//                 storeisActive: Boolean(storeisActive),
//                 storeIconSize: storeIconSize || 'L',
//                 storeId: storeId || undefined,
//                 storeUrl: storeUrl || undefined
//             });
//         }

//         // Format product data
//         const productData = [];
//         if (productisActive || ProductId || productUrl) {
//             productData.push({
//                 productisActive: Boolean(productisActive),
//                 productIconSize: productIconSize || 'S',
//                 ProductId: ProductId || undefined,
//                 productUrl: productUrl || undefined
//             });
//         }

//         // Handle new URL fields with conditions (validation already done above)
//         const urlFields = {};
        
//         // Facebook logic - if facebook is true, use user's profile data; if not true, save URL
//         if (isTrue(socialPayload.facebook)) {
//             // Use the user's facebook from their profile (processed by processSocialLinks)
//             // The socialLinks already contains the correct facebook value from user profile
//         } else if (facebookurl) {
//             urlFields.facebookurl = facebookurl;
//         }
        
//         // Instagram logic - if instagram is true, use user's profile data; if not true, save URL  
//         if (isTrue(socialPayload.instagram)) {
//             // Use the user's instagram from their profile (processed by processSocialLinks)
//             // The socialLinks already contains the correct instagram value from user profile
//         } else if (instagramurl) {
//             urlFields.instagramurl = instagramurl;
//         }
        
//         // WhatsApp logic - if whatsapp is true, use user's profile data; if not true, save URL
//         if (isTrue(socialPayload.whatsapp)) {
//             // Use the user's whatsapp number from their profile (processed by processSocialLinks)
//             // The socialLinks already contains the correct whatsapp number from user profile
//             // Don't add anything to urlFields - let processSocialLinks handle it
//         } else if (whatsappnumberurl) {
//             urlFields.whatsappnumberurl = whatsappnumberurl;
//         }
        
//         // Store link logic - if storeLink is true, use user's profile data; if not true, save URL
//         if (isTrue(socialPayload.storeLink)) {
//             // Use the user's storeLink from their profile (processed by processSocialLinks)
//             // The socialLinks already contains the correct storeLink value from user profile
//         } else if (storelinkurl) {
//             urlFields.storelinkurl = storelinkurl;
//         }

//         // Create post data
//         const postData = {
//             title,
//             description,
//             category,
//             audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
//             song: songUrls.length > 0 ? songUrls : undefined,
//             imagecount: formattedImageFiles.length,
//             videocount: formattedVideoFiles.length,
//             audiocount: audioUrls.length,
//             pattern: pattern || 'single',
//             owner: user._id,
//             ...socialLinks.socialLinks,
//             ...urlFields  // Add the conditional URL fields
//         };

//         // Add arrays only if they have content
//         if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
//         if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;
//         if (storeData.length > 0) postData.store = storeData;
//         if (productData.length > 0) postData.product = productData;

//         // Remove undefined fields
//         Object.keys(postData).forEach(key => {
//             if (postData[key] === undefined) {
//                 delete postData[key];
//             }
//         });

//         const post = await Post.create(postData);

//         // Populate owner details for response
//         const populatedPost = await Post.findById(post._id)
//             .populate('owner', 'username fullName avatar')
//             .populate('store.storeId')
//             .populate('product.ProductId')
//             .lean();

//         return res.status(200).json(
//             new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Post created successfully")
//         );
//     } catch (error) {
//         console.error('Post creation error:', error);
//         handleSocialLinkError(error);
//     }
// });





// ============= Verified ======================//
// thummbnail (creation handle at frontend )  at frontend 


// const publishPost = asyncHandler(async (req, res) => {
//     const { 
//         title, 
//         description, 
//         category, 
//         pattern,
//         storeisActive,
//         storeIconSize,
//         storeId,
//         storeUrl,
//         productisActive,
//         productIconSize,
//         ProductId,
//         productUrl,
//         autoplay1,
//         autoplay2,
//         autoplay3,
//         autoplay4,
//         autoplay5,
//         facebookurl,
//         instagramurl,
//         whatsappnumberurl,
//         storelinkurl,
//         ...socialPayload 
//     } = req.body;
    
//     // STEP 1: VALIDATE INPUT
//     if (!category) throw new ApiError(400, "Category is required");
//     validateNumberedMediaFiles(req.files || {});

//     // OPTIMIZATION 1: Run user fetch and category check in parallel
//     const [user, categoryExists] = await Promise.all([
//         User.findById(req.userVerfied._id),
//         Categoury.findOne({categouryname: category})
//     ]);

//     if (!user) throw new ApiError(404, "User not found");

//     // Create category if doesn't exist (non-blocking - can happen in background)
//     if (!categoryExists) {
//         // Don't await - let it happen in background
//         Categoury.create({categouryname: category}).catch(err => 
//             console.error('Category creation failed:', err)
//         );
//     }

//     const isTrue = (val) => {
//         return val === true || val === 'true' || val === '1';
//     };

//     // STEP 2: VALIDATE SOCIAL MEDIA LOGIC
//     if (isTrue(socialPayload.facebook) && facebookurl) {
//         throw new ApiError(400, "Cannot provide both facebook=true and facebookurl. Choose one.");
//     }
//     if (isTrue(socialPayload.instagram) && instagramurl) {
//         throw new ApiError(400, "Cannot provide both instagram=true and instagramurl. Choose one.");
//     }
//     if (isTrue(socialPayload.whatsapp) && whatsappnumberurl) {
//         throw new ApiError(400, "Cannot provide both whatsapp=true and whatsappnumberurl. Choose one.");
//     }
//     if (isTrue(socialPayload.storeLink) && storelinkurl) {
//         throw new ApiError(400, "Cannot provide both storeLink=true and storelinkurl. Choose one.");
//     }

//     // STEP 3: PROCESS SOCIAL LINKS
//     let socialLinks = { socialLinks: {} };
//     try {
//         socialLinks = processSocialLinks(user, socialPayload);
//     } catch (socialError) {
//         if (socialError.message === "At least one social link required") {
//             socialLinks = { socialLinks: {} };
//         } else {
//             throw socialError;
//         }
//     }

//     // STEP 4: OPTIMIZE FILE UPLOADS - Process all in truly parallel batches
//     try {
//         let imageResults = {};
//         let videoResults = {};
//         let thumbnailResults = {};
//         let audioUrls = [];
//         let songUrls = [];

//         // OPTIMIZATION 2: Batch all uploads by type for better parallelization
//         const uploadPromises = [];

//         // Batch 1: All images (parallel)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `imageFile${i}`;
//             if (req.files?.[fieldName]?.[0]) {
//                 uploadPromises.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (result?.url) imageResults[i] = result.url;
//                             return { type: 'image', position: i, success: !!result?.url };
//                         })
//                         .catch(error => {
//                             console.error(`Image ${i} upload failed:`, error);
//                             return { type: 'image', position: i, success: false };
//                         })
//                 );
//             }
//         }

//         // Batch 2: All thumbnails (parallel)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `thumbnail${i}`;
//             if (req.files?.[fieldName]?.[0]) {
//                 uploadPromises.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (result?.url) thumbnailResults[i] = result.url;
//                             return { type: 'thumbnail', position: i, success: !!result?.url };
//                         })
//                         .catch(error => {
//                             console.error(`Thumbnail ${i} upload failed:`, error);
//                             return { type: 'thumbnail', position: i, success: false };
//                         })
//                 );
//             }
//         }

//         // OPTIMIZATION 3: Wait for thumbnails and images first (they're needed for video processing)
//         await Promise.all(uploadPromises);
//         uploadPromises.length = 0; // Clear array

//         // Batch 3: All videos (parallel) - now thumbnails are ready
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `videoFile${i}`;
//             if (req.files?.[fieldName]?.[0]) {
//                 uploadPromises.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (result?.url) {
//                                 videoResults[i] = {
//                                     url: result.url,
//                                     thumbnail: thumbnailResults[i] || null
//                                 };
//                             }
//                             return { type: 'video', position: i, success: !!result?.url };
//                         })
//                         .catch(error => {
//                             console.error(`Video ${i} upload failed:`, error);
//                             return { type: 'video', position: i, success: false };
//                         })
//                 );
//             }
//         }

//         // Batch 4: Audio files (parallel)
//         if (req.files?.audioFiles?.length) {
//             uploadPromises.push(
//                 uploadMultipleFiles(req.files.audioFiles, 'audio')
//                     .then(urls => {
//                         audioUrls = urls;
//                         return { type: 'audio', success: true };
//                     })
//                     .catch(error => {
//                         console.error('Audio upload failed:', error);
//                         return { type: 'audio', success: false };
//                     })
//             );
//         }

//         // Batch 5: Song files (parallel)
//         if (req.files?.song?.length) {
//             uploadPromises.push(
//                 uploadMultipleFiles(req.files.song, 'song')
//                     .then(urls => {
//                         songUrls = urls;
//                         return { type: 'song', success: true };
//                     })
//                     .catch(error => {
//                         console.error('Song upload failed:', error);
//                         return { type: 'song', success: false };
//                     })
//             );
//         }

//         // Wait for all remaining uploads
//         await Promise.all(uploadPromises);

//         // OPTIMIZATION 4: Format results (fast, in-memory operations)
//         const formattedImageFiles = Object.keys(imageResults)
//             .sort((a, b) => parseInt(a) - parseInt(b))
//             .map(position => ({
//                 url: imageResults[position],
//                 Imageposition: parseInt(position)
//             }));

//         const parseAutoplayFlag = (val) => {
//             if (val === undefined || val === null) return false;
//             if (typeof val === 'boolean') return val;
//             const s = String(val).trim().toLowerCase();
//             return ['1', 'true', 'yes', 'on'].includes(s);
//         };

//         const autoplayFlags = { 
//             1: autoplay1, 
//             2: autoplay2, 
//             3: autoplay3, 
//             4: autoplay4, 
//             5: autoplay5 
//         };

//         const formattedVideoFiles = Object.keys(videoResults)
//             .sort((a, b) => parseInt(a) - parseInt(b))
//             .map(position => {
//                 const videoData = videoResults[position];
//                 const formattedVideo = {
//                     url: videoData.url,
//                     Videoposition: parseInt(position),
//                     autoplay: parseAutoplayFlag(autoplayFlags[position])
//                 };
//                 if (videoData.thumbnail) {
//                     formattedVideo.thumbnail = videoData.thumbnail;
//                 }
//                 return formattedVideo;
//             });

//         // Format store and product data
//         const storeData = [];
//         if (storeisActive || storeId || storeUrl) {
//             storeData.push({
//                 storeisActive: Boolean(storeisActive),
//                 storeIconSize: storeIconSize || 'L',
//                 storeId: storeId || undefined,
//                 storeUrl: storeUrl || undefined
//             });
//         }

//         const productData = [];
//         if (productisActive || ProductId || productUrl) {
//             productData.push({
//                 productisActive: Boolean(productisActive),
//                 productIconSize: productIconSize || 'S',
//                 ProductId: ProductId || undefined,
//                 productUrl: productUrl || undefined
//             });
//         }

//         // Handle URL fields
//         const urlFields = {};
//         if (isTrue(socialPayload.facebook)) {
//             // Use user's profile data
//         } else if (facebookurl) {
//             urlFields.facebookurl = facebookurl;
//         }
        
//         if (isTrue(socialPayload.instagram)) {
//             // Use user's profile data
//         } else if (instagramurl) {
//             urlFields.instagramurl = instagramurl;
//         }
        
//         if (isTrue(socialPayload.whatsapp)) {
//             // Use user's profile data
//         } else if (whatsappnumberurl) {
//             urlFields.whatsappnumberurl = whatsappnumberurl;
//         }
        
//         if (isTrue(socialPayload.storeLink)) {
//             // Use user's profile data
//         } else if (storelinkurl) {
//             urlFields.storelinkurl = storelinkurl;
//         }

//         // OPTIMIZATION 5: Create lean post data
//         const postData = {
//             title,
//             description,
//             category,
//             audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
//             song: songUrls.length > 0 ? songUrls : undefined,
//             imagecount: formattedImageFiles.length,
//             videocount: formattedVideoFiles.length,
//             audiocount: audioUrls.length,
//             pattern: pattern || 'single',
//             owner: user._id,
//             ...socialLinks.socialLinks,
//             ...urlFields
//         };

//         if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
//         if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;
//         if (storeData.length > 0) postData.store = storeData;
//         if (productData.length > 0) postData.product = productData;

//         // Remove undefined fields
//         Object.keys(postData).forEach(key => {
//             if (postData[key] === undefined) {
//                 delete postData[key];
//             }
//         });

//         // OPTIMIZATION 6: Create post and populate in parallel (if possible)
//         const post = await Post.create(postData);

//         // Use lean() for faster queries
//         const populatedPost = await Post.findById(post._id)
//             .populate('owner', 'username fullName avatar')
//             .populate('store.storeId')
//             .populate('product.ProductId')
//             .lean();

//         return res.status(200).json(
//             new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Post created successfully")
//         );
//     } catch (error) {
//         console.error('Post creation error:', error);
//         handleSocialLinkError(error);
//     }
// });



// with pregress bar


// ============================================
// BACKEND: post.controller.js - Modified publishPost
// ============================================

const publishPost = asyncHandler(async (req, res) => {
    const { 
        title, description, category, pattern,
        storeisActive, storeIconSize, storeId, storeUrl,
        productisActive, productIconSize, ProductId, productUrl,
        autoplay1, autoplay2, autoplay3, autoplay4, autoplay5,
        facebookurl, instagramurl, whatsappnumberurl, storelinkurl,
        ...socialPayload 
    } = req.body;
    
    // Progress tracking helper
    let progressPercentage = 0;
    const updateProgress = (percent, message) => {
        progressPercentage = percent;
        // Store progress in a shared cache (Redis recommended for production)
        // For now, we'll use a simple in-memory store
        progressStore.set(req.userVerfied._id.toString(), {
            progress: percent,
            message: message,
            timestamp: Date.now()
        });
    };

    try {
        updateProgress(5, 'Validating input data...');
        
        // STEP 1: VALIDATE INPUT
        if (!category) throw new ApiError(400, "Category is required");
        validateNumberedMediaFiles(req.files || {});

        updateProgress(10, 'Fetching user data...');

        const [user, categoryExists] = await Promise.all([
            User.findById(req.userVerfied._id),
            Categoury.findOne({categouryname: category})
        ]);

        if (!user) throw new ApiError(404, "User not found");

        if (!categoryExists) {
            Categoury.create({categouryname: category}).catch(err => 
                console.error('Category creation failed:', err)
            );
        }

        updateProgress(15, 'Processing social links...');

        const isTrue = (val) => {
            return val === true || val === 'true' || val === '1';
        };

        // Validate social media logic
        if (isTrue(socialPayload.facebook) && facebookurl) {
            throw new ApiError(400, "Cannot provide both facebook=true and facebookurl. Choose one.");
        }
        if (isTrue(socialPayload.instagram) && instagramurl) {
            throw new ApiError(400, "Cannot provide both instagram=true and instagramurl. Choose one.");
        }
        if (isTrue(socialPayload.whatsapp) && whatsappnumberurl) {
            throw new ApiError(400, "Cannot provide both whatsapp=true and whatsappnumberurl. Choose one.");
        }
        if (isTrue(socialPayload.storeLink) && storelinkurl) {
            throw new ApiError(400, "Cannot provide both storeLink=true and storelinkurl. Choose one.");
        }

        let socialLinks = { socialLinks: {} };
        try {
            socialLinks = processSocialLinks(user, socialPayload);
        } catch (socialError) {
            if (socialError.message === "At least one social link required") {
                socialLinks = { socialLinks: {} };
            } else {
                throw socialError;
            }
        }

        updateProgress(20, 'Starting file uploads...');

        // File upload tracking
        let imageResults = {};
        let videoResults = {};
        let thumbnailResults = {};
        let audioUrls = [];
        let songUrls = [];

        const uploadPromises = [];
        
        // Calculate total upload items for progress calculation
        let totalItems = 0;
        let completedItems = 0;
        
        for (let i = 1; i <= 5; i++) {
            if (req.files?.[`imageFile${i}`]?.[0]) totalItems++;
            if (req.files?.[`thumbnail${i}`]?.[0]) totalItems++;
            if (req.files?.[`videoFile${i}`]?.[0]) totalItems++;
        }
        if (req.files?.audioFiles?.length) totalItems += req.files.audioFiles.length;
        if (req.files?.song?.length) totalItems += req.files.song.length;

        const trackUploadProgress = () => {
    completedItems++;
    if (totalItems > 0) {
        const uploadProgress = Math.floor(20 + (completedItems / totalItems) * 50);
        updateProgress(uploadProgress, `Uploading files... ${completedItems}/${totalItems}`);
    }
};

        // Batch 1: Images
        for (let i = 1; i <= 5; i++) {
            const fieldName = `imageFile${i}`;
            if (req.files?.[fieldName]?.[0]) {
                uploadPromises.push(
                    uploadResult(req.files[fieldName][0].path)
                        .then(result => {
                            if (result?.url) imageResults[i] = result.url;
                            trackUploadProgress();
                            return { type: 'image', position: i, success: !!result?.url };
                        })
                        .catch(error => {
                            console.error(`Image ${i} upload failed:`, error);
                            trackUploadProgress();
                            return { type: 'image', position: i, success: false };
                        })
                );
            }
        }

        // Batch 2: Thumbnails
        for (let i = 1; i <= 5; i++) {
            const fieldName = `thumbnail${i}`;
            if (req.files?.[fieldName]?.[0]) {
                uploadPromises.push(
                    uploadResult(req.files[fieldName][0].path)
                        .then(result => {
                            if (result?.url) thumbnailResults[i] = result.url;
                            trackUploadProgress();
                            return { type: 'thumbnail', position: i, success: !!result?.url };
                        })
                        .catch(error => {
                            console.error(`Thumbnail ${i} upload failed:`, error);
                            trackUploadProgress();
                            return { type: 'thumbnail', position: i, success: false };
                        })
                );
            }
        }

        await Promise.all(uploadPromises);
        uploadPromises.length = 0;

        updateProgress(70, 'Processing videos...');

        // Batch 3: Videos
        for (let i = 1; i <= 5; i++) {
            const fieldName = `videoFile${i}`;
            if (req.files?.[fieldName]?.[0]) {
                uploadPromises.push(
                    uploadResult(req.files[fieldName][0].path)
                        .then(result => {
                            if (result?.url) {
                                videoResults[i] = {
                                    url: result.url,
                                    thumbnail: thumbnailResults[i] || null
                                };
                            }
                            trackUploadProgress();
                            return { type: 'video', position: i, success: !!result?.url };
                        })
                        .catch(error => {
                            console.error(`Video ${i} upload failed:`, error);
                            trackUploadProgress();
                            return { type: 'video', position: i, success: false };
                        })
                );
            }
        }

        // Batch 4: Audio
        if (req.files?.audioFiles?.length) {
            uploadPromises.push(
                uploadMultipleFiles(req.files.audioFiles, 'audio')
                    .then(urls => {
                        audioUrls = urls;
                        trackUploadProgress();
                        return { type: 'audio', success: true };
                    })
                    .catch(error => {
                        console.error('Audio upload failed:', error);
                        trackUploadProgress();
                        return { type: 'audio', success: false };
                    })
            );
        }

        // Batch 5: Songs
        if (req.files?.song?.length) {
            uploadPromises.push(
                uploadMultipleFiles(req.files.song, 'song')
                    .then(urls => {
                        songUrls = urls;
                        trackUploadProgress();
                        return { type: 'song', success: true };
                    })
                    .catch(error => {
                        console.error('Song upload failed:', error);
                        trackUploadProgress();
                        return { type: 'song', success: false };
                    })
            );
        }

        await Promise.all(uploadPromises);

        updateProgress(80, 'Formatting media files...');

        // Format results
        const formattedImageFiles = Object.keys(imageResults)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(position => ({
                url: imageResults[position],
                Imageposition: parseInt(position)
            }));

        const parseAutoplayFlag = (val) => {
            if (val === undefined || val === null) return false;
            if (typeof val === 'boolean') return val;
            const s = String(val).trim().toLowerCase();
            return ['1', 'true', 'yes', 'on'].includes(s);
        };

        const autoplayFlags = { 
            1: autoplay1, 2: autoplay2, 3: autoplay3, 
            4: autoplay4, 5: autoplay5 
        };

        const formattedVideoFiles = Object.keys(videoResults)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(position => {
                const videoData = videoResults[position];
                const formattedVideo = {
                    url: videoData.url,
                    Videoposition: parseInt(position),
                    autoplay: parseAutoplayFlag(autoplayFlags[position])
                };
                if (videoData.thumbnail) {
                    formattedVideo.thumbnail = videoData.thumbnail;
                }
                return formattedVideo;
            });

        const storeData = [];
        if (storeisActive || storeId || storeUrl) {
            storeData.push({
                storeisActive: Boolean(storeisActive),
                storeIconSize: storeIconSize || 'L',
                storeId: storeId || undefined,
                storeUrl: storeUrl || undefined
            });
        }

        const productData = [];
        if (productisActive || ProductId || productUrl) {
            productData.push({
                productisActive: Boolean(productisActive),
                productIconSize: productIconSize || 'S',
                ProductId: ProductId || undefined,
                productUrl: productUrl || undefined
            });
        }

        const urlFields = {};
        if (isTrue(socialPayload.facebook)) {
        } else if (facebookurl) {
            urlFields.facebookurl = facebookurl;
        }
        
        if (isTrue(socialPayload.instagram)) {
        } else if (instagramurl) {
            urlFields.instagramurl = instagramurl;
        }
        
        if (isTrue(socialPayload.whatsapp)) {
        } else if (whatsappnumberurl) {
            urlFields.whatsappnumberurl = whatsappnumberurl;
        }
        
        if (isTrue(socialPayload.storeLink)) {
        } else if (storelinkurl) {
            urlFields.storelinkurl = storelinkurl;
        }

        updateProgress(90, 'Creating post...');

        const postData = {
            title,
            description,
            category,
            audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
            song: songUrls.length > 0 ? songUrls : undefined,
            imagecount: formattedImageFiles.length,
            videocount: formattedVideoFiles.length,
            audiocount: audioUrls.length,
            pattern: pattern || '1',
            owner: user._id,
            ...socialLinks.socialLinks,
            ...urlFields
        };

        if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
        if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;
        if (storeData.length > 0) postData.store = storeData;
        if (productData.length > 0) postData.product = productData;

        Object.keys(postData).forEach(key => {
            if (postData[key] === undefined) {
                delete postData[key];
            }
        });

        const post = await Post.create(postData);

        updateProgress(95, 'Finalizing...');

        const populatedPost = await Post.findById(post._id)
            .populate('owner', 'username fullName avatar')
            .populate('store.storeId')
            .populate('product.ProductId')
            .lean();

        updateProgress(100, 'Post created successfully!');

        // Clean up progress data
        setTimeout(() => {
            progressStore.delete(req.userVerfied._id.toString());
        }, 5000);

        return res.status(200).json(
            new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Post created successfully")
        );
    } catch (error) {
        console.error('Post creation error:', error);
        // progressStore.delete(userId); // Clean up on error
        progressStore.delete(req.userVerfied._id.toString());
        handleSocialLinkError(error);
    }
    // finally {
    //     // Optional: ensure cleanup happens
    //     setTimeout(() => {
    //         progressStore.delete(req.userVerfied._id.toString());
    //     }, 5000);
    // }
});







// Helper function to validate numbered media files
const validateNumberedMediaFiles = (files) => {
    const errors = [];
    
    // Check for invalid numbered fields beyond the expected range
    Object.keys(files).forEach(key => {
        if (key.startsWith('imageFile')) {
            const num = key.replace('imageFile', '');
            if (!/^[1-5]$/.test(num)) {
                errors.push(`Invalid image field: ${key}. Only imageFile1 to imageFile5 are allowed`);
            }
        }
        if (key.startsWith('videoFile')) {
            const num = key.replace('videoFile', '');
            if (!/^[1-5]$/.test(num)) {
                errors.push(`Invalid video field: ${key}. Only videoFile1 to videoFile5 are allowed`);
            }
        }
        if (key.startsWith('thumbnail')) {
            const num = key.replace('thumbnail', '');
            if (!/^[1-5]$/.test(num)) {
                errors.push(`Invalid thumbnail field: ${key}. Only thumbnail1 to thumbnail5 are allowed`);
            }
        }
    });
    
    if (errors.length > 0) {
        throw new ApiError(400, errors.join(", "));
    }
};

// Helper function to check for numbered video files
const checkForNumberedVideoFiles = (files) => {
    if (!files) return false;
    
    for (let i = 1; i <= 5; i++) {
        const fieldName = `videoFile${i}`;
        if (files[fieldName] && files[fieldName].length > 0) {
            return true;
        }
    }
    return false;
};

// Enhanced pruning function to handle new structure
const pruneEmptyMediaFields = (post) => {
    if (!post) return post;

    // Remove empty arrays
    if (post.imageFiles && post.imageFiles.length === 0) delete post.imageFiles;
    if (post.videoFiles && post.videoFiles.length === 0) delete post.videoFiles;
    if (post.store && post.store.length === 0) delete post.store;
    if (post.product && post.product.length === 0) delete post.product;
    if (post.song && post.song.length === 0) delete post.song;

    // Clean store array - remove objects with all falsy values
    if (post.store) {
        post.store = post.store.filter(store => 
            store.storeisActive || store.storeId || store.storeUrl || store.storeIconSize
        );
        if (post.store.length === 0) delete post.store;
    }

    // Clean product array - remove objects with all falsy values
    if (post.product) {
        post.product = post.product.filter(product => 
            product.productisActive || product.ProductId || product.productUrl
        );
        if (post.product.length === 0) delete post.product;
    }

    return post;
};













// Update existing post
const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { 
        title, 
        description, 
        category, 
        pattern,
        imageSizes, // Array of sizes for new images
        videoSizes, // Array of sizes for new videos
        ...socialPayload 
    } = req.body;
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }

    // Validate files structure
    validateMediaFiles(req.files || {});
    
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");
    
    // Check ownership
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    try {
        // Process social links for update
        const user = await User.findById(req.userVerfied._id);
        const updateOps = processSocialLinks(user, socialPayload, post);
        
        // Initialize $set if it doesn't exist
        if (!updateOps.$set) updateOps.$set = {};
        
        // Add basic field updates if provided
        if (title) updateOps.$set.title = title;
        if (description) updateOps.$set.description = description;
        if (category) updateOps.$set.category = category;
        if (pattern) updateOps.$set.pattern = pattern;

        // Initialize upload results
        let thumbnailUrl = null;
        let newImageUrls = [];
        let newVideoUrls = [];
        let newAudioUrls = [];

        // Upload all new files in parallel
        const uploadTasks = [];

        // Handle thumbnail upload (only if provided)
        if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
            uploadTasks.push(
                uploadResult(req.files.thumbnail[0].path)
                    .then(result => {
                        if (!result?.url) throw new Error("Thumbnail upload failed");
                        thumbnailUrl = result.url;
                    })
                    .catch(error => {
                        throw new ApiError(400, `Thumbnail upload failed: ${error.message}`);
                    })
            );
        }

        // Handle new image uploads
        if (req.files?.imageFiles && req.files.imageFiles.length > 0) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.imageFiles, 'image')
                    .then(urls => {
                        newImageUrls = urls;
                    })
            );
        }

        // Handle new video uploads
        if (req.files?.videoFiles && req.files.videoFiles.length > 0) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.videoFiles, 'video')
                    .then(urls => {
                        newVideoUrls = urls;
                    })
            );
        }

        // Handle new audio uploads
        if (req.files?.audioFiles && req.files.audioFiles.length > 0) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.audioFiles, 'audio')
                    .then(urls => {
                        newAudioUrls = urls;
                    })
            );
        }

        if(req.files?.song && req.files.song.length > 0) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.song, 'song')
                    .then(urls => {
                    songUrls = urls;
                    })
            );
        }



        // Wait for all uploads to complete
        if (uploadTasks.length > 0) {
            await Promise.all(uploadTasks);
        }

        // Parse sizes from request body (they come as strings from form-data)
        let parsedImageSizes = [];
        let parsedVideoSizes = [];
        if (imageSizes) parsedImageSizes = Array.isArray(imageSizes) ? imageSizes : [imageSizes];
        if (videoSizes) parsedVideoSizes = Array.isArray(videoSizes) ? videoSizes : [videoSizes];

        // Update thumbnail if uploaded
        if (thumbnailUrl) {
            updateOps.$set.thumbnail = thumbnailUrl;
        }

        // Update media files if new ones were uploaded
        if (newImageUrls.length > 0) {
            // Extract existing image URLs from the current post
            const existingImageUrls = post.imageFiles?.map(img => 
                typeof img === 'string' ? img : img.url
            ) || [];
            
            // Combine existing and new image URLs
            const allImageUrls = [...existingImageUrls, ...newImageUrls];
            const formattedImageFiles = formatMediaFiles(allImageUrls, parsedImageSizes);
            
            updateOps.$set.imageFiles = formattedImageFiles;
            updateOps.$set.imagecount = formattedImageFiles.length;
        }

        if (newVideoUrls.length > 0) {
            // Extract existing video URLs from the current post
            const existingVideoUrls = post.videoFiles?.map(video => 
                typeof video === 'string' ? video : video.url
            ) || [];
            
            // Combine existing and new video URLs
            const allVideoUrls = [...existingVideoUrls, ...newVideoUrls];
            const formattedVideoFiles = formatMediaFiles(allVideoUrls, parsedVideoSizes);
            
            updateOps.$set.videoFiles = formattedVideoFiles;
            updateOps.$set.videocount = formattedVideoFiles.length;
        }

        if (newAudioUrls.length > 0) {
            // Based on schema, audioFile is a single string, so take the first new audio
            updateOps.$set.audioFile = newAudioUrls[0];
            updateOps.$set.audiocount = 1; // Since it's a single file
        }
        
        // Check if there's anything to update
        if (Object.keys(updateOps).length === 0 || 
            (Object.keys(updateOps).length === 1 && 
             Object.keys(updateOps.$set || {}).length === 0)) {
            throw new ApiError(400, "No updates provided");
        }
        
        // Perform update
        let updatedPost = await Post.findByIdAndUpdate(
            postId,
            updateOps,
            { new: true }
        ).populate('owner', 'username fullName avatar').lean();
        updatedPost = pruneEmptyMediaFields(updatedPost);
        
        return res.status(200).json(
            new ApiResponse(200, updatedPost, "Post updated successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
});



//if the Creator delete the  post the the user who bid on that post will also be deleted

// so add a permoission to return the other user bid who insvest before delete 



// Delete post
const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    // Check if the user is the owner of the post
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }
    
    // Delete the post (this will also trigger cascading delete for comments)
    await Post.findByIdAndDelete(postId);
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Post deleted successfully")
    );
})

// Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params
    
    // Validate postId
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
        throw new ApiError(404, "Post not found");
    }
    
    // Check if the user is the owner of the post
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    // Toggle the publish status
    post.isPublished = !post.isPublished;
    
    // Save the post
    await post.save();
    
    return res.status(200).json(
        new ApiResponse(
            200, 
            { isPublished: post.isPublished }, 
            `Post ${post.isPublished ? 'published' : 'unpublished'} successfully`
        )
    );
})

// Increment view count when a social link is clicked
const incrementSocialLinkView = asyncHandler(async (req, res) => {
    const { postId, linkType } = req.params
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID")
    }
    
    if (!["whatsapp", "storeLink", "facebook", "instagram", "productlink"].includes(linkType)) {
        throw new ApiError(400, "Invalid link type")
    }
    
    // Find the post
    const post = await Post.findById(postId)
    
    if (!post) {
        throw new ApiError(404, "Post not found")
    }
    
    // Check if the requested link type exists on this post
    if (!post[linkType]) {
        throw new ApiError(404, "This post doesn't have the requested social link")
    }
    
    // Increment view count
    post.totalViews += 1
    await post.save()
    
    // Return the link URL
    return res.status(200).json(
        new ApiResponse(200, { 
            url: post[linkType],
            totalViews: post.totalViews
        }, "View counted and link retrieved")
    )
})

// Remove specific media files from post
const removeMediaFiles = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { imageUrls = [], videoUrls = [], audioUrls = [] } = req.body;
    
    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid post ID");
    }
    
    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");
    
    // Check ownership
    if (post.owner.toString() !== req.userVerfied._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    
    const updateOps = { $set: {} };
    
    // Remove specified image files and update count
    if (imageUrls.length > 0) {
        const filteredImages = post.imageFiles.filter(imgObj => {
            const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
            return !imageUrls.includes(url);
        }).map((imgObj, idx) => ({ ...(typeof imgObj === 'string' ? { url: imgObj } : imgObj), position: idx + 1 }));
        updateOps.$set.imageFiles = filteredImages;
        updateOps.$set.imagecount = filteredImages.length;
    }
    
    // Remove specified video files and update count
    if (videoUrls.length > 0) {
        const filteredVideos = post.videoFiles.filter(videoObj => {
            const url = typeof videoObj === 'string' ? videoObj : videoObj.url;
            return !videoUrls.includes(url);
        }).map((videoObj, idx) => ({ ...(typeof videoObj === 'string' ? { url: videoObj } : videoObj), position: idx + 1 }));
        updateOps.$set.videoFiles = filteredVideos;
        updateOps.$set.videocount = filteredVideos.length;
    }
    
    // Remove specified audio files and update count
    if (audioUrls.length > 0 && post.audioFile) {
        if (audioUrls.includes(post.audioFile)) {
            updateOps.$set.audioFile = null;
            updateOps.$set.audiocount = 0;
        }
    }
    
    let updatedPost = await Post.findByIdAndUpdate(
        postId,
        updateOps,
        { new: true }
    ).populate('owner', 'username fullName avatar').lean();
    updatedPost = pruneEmptyMediaFields(updatedPost);
    
    return res.status(200).json(
        new ApiResponse(200, updatedPost, "Media files removed successfully")
    );
});

// Error handling helper
const handleSocialLinkError = (error) => {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Operation failed: ${error.message}`);
};

export {
    getAllPosts,
    publishPost,
    getPostById,
    updatePost,
    deletePost,
    togglePublishStatus,
    incrementSocialLinkView,
    removeMediaFiles
}
