import mongoose, {isValidObjectId} from "mongoose"
import {Post} from "../models/post.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadResult} from "../utils/Claudnary.js"
import { processSocialLinks } from "../utils/socialLinks.js"
import Categoury from "../models/categoury.model.js"

// Remove empty media arrays from response objects when counts are zero
const pruneEmptyMediaFields = (doc) => {
    if (!doc || typeof doc !== 'object') return doc;
    const pruned = { ...doc };
    if ((pruned.imagecount ?? (Array.isArray(pruned.imageFiles) ? pruned.imageFiles.length : 0)) === 0) {
        delete pruned.imageFiles;
    }
    if ((pruned.videocount ?? (Array.isArray(pruned.videoFiles) ? pruned.videoFiles.length : 0)) === 0) {
        delete pruned.videoFiles;
    }
    return pruned;
};

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





// Create new post

// const publishPost = asyncHandler(async (req, res) => {
//     const { 
//         title, 
//         description, 
//         category, 
//         store, 
//         pattern, 
//         productId,
//         // imageSizes, // Array of sizes for images
//         // videoSizes, // Array of sizes for videos
//         ...socialPayload 
//     } = req.body;
    
//     if (!title || !description) {
//         throw new ApiError(400, "Title and description are required");
//     }

//     if (!category) {
//         throw new ApiError(400, "Category is required");
//     }

//     // Validate files structure
//     validateMediaFiles(req.files || {});

//     // Check if category exists, create if not
//     const categoryExists = await Categoury.findOne({categouryname: category});
//     if (!categoryExists) {  
//         await Categoury.create({categouryname: category});
//     }

//     const user = await User.findById(req.userVerfied._id);
//     if (!user) throw new ApiError(404, "User not found");

//     // Validation: Check for video files and thumbnail conflict
//     const hasVideoFiles = req.files?.videoFiles && req.files.videoFiles.length > 0;
//     const hasThumbnail = req.files?.thumbnail && req.files.thumbnail.length > 0;
    
//     if (!hasVideoFiles && hasThumbnail) {
//         throw new ApiError(400, "Cannot upload thumbnail when video files are not present. Video posts don't require thumbnails.");
//     }

//     try {
//         // Process social links for creation
//         const socialLinks = processSocialLinks(user, socialPayload);

//         // Initialize upload results
//         let thumbnailUrl = null;
//         let imageUrls = [];
//         let videoUrls = [];
//         let audioUrls = [];
//         let songUrls = [];

//         // Compute placeholder counts BEFORE uploading (from text entries)
//         const imagePlaceholders = countPlaceholders(req.body?.imageFiles);
//         const videoPlaceholders = countPlaceholders(req.body?.videoFiles);

//         // Upload all files in parallel for better performance
//         const uploadTasks = [];

//         // Handle thumbnail upload
//         if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
//             uploadTasks.push(
//                 uploadResult(req.files.thumbnail[0].path)
//                     .then(result => {
//                         if (!result?.url) throw new Error("Thumbnail upload failed");
//                         thumbnailUrl = result.url;
//                     })
//                     .catch(error => {
//                         throw new ApiError(400, `Thumbnail upload failed: ${error.message}`);
//                     })
//             );
//         }

//         // Handle image uploads
//         if (req.files?.imageFiles && req.files.imageFiles.length > 0) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.imageFiles, 'image')
//                     .then(urls => {
//                         imageUrls = urls;
//                     })
//             );
//         }

//         // Handle video uploads
//         if (req.files?.videoFiles && req.files.videoFiles.length > 0) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.videoFiles, 'video')
//                     .then(urls => {
//                         videoUrls = urls;
//                     })
//             );
//         }

//         // Handle audio uploads
//         if (req.files?.audioFiles && req.files.audioFiles.length > 0) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.audioFiles, 'audio')
//                     .then(urls => {
//                         audioUrls = urls;
//                     })
//             );
//         }

//   if(req.files?.song && req.files.song.length > 0) {
//             uploadTasks.push(
//                 uploadMultipleFiles(req.files.song, 'song')
//                     .then(urls => {
//                     songUrls = urls;
//                     })
//             );
//         }





//         // Wait for all uploads to complete
//         await Promise.all(uploadTasks);

//         // Build ordered arrays with placeholders first, then uploaded files in order
//         const formattedImageFiles = [
//             ...Array.from({ length: imagePlaceholders }).map(() => ({})),
//             ...formatMediaFiles(imageUrls)
//         ].map((item, idx) => item.url ? { ...item, position: idx + 1 } : {});

//         const formattedVideoFiles = [
//             ...Array.from({ length: videoPlaceholders }).map(() => ({})),
//             ...formatMediaFiles(videoUrls)
//         ].map((item, idx) => item.url ? { ...item, position: idx + 1 } : {});

        
//         // //count the response of video and image without {}
//         // // Calculate real counts (exclude placeholder empty objects {})
//         // const realImageCount = formattedImageFiles.filter(x => x && x.url).length;
//         // const realVideoCount = formattedVideoFiles.filter(x => x && x.url).length;

        

        
//         // Create post with proper data structure
//         const postData = {
//             title,
//             description,
//             category,
//             productId,
//             thumbnail: thumbnailUrl,
//             // Conditionally include media arrays only when not empty
//             audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined, // Single string based on schema
//             song: songUrls.length > 0 ? songUrls[0] : undefined, // Single string based on schema
//             // include empty object to
//             imagecount: formattedImageFiles.length,
//             videocount: formattedVideoFiles.length,
               
//             // // exclude empty objects from counts
//             //      imagecount: realImageCount,
//             //      videocount: realVideoCount,



//             audiocount: audioUrls.length,
//             pattern: pattern || 'single',
//             owner: user._id,
//             store: Boolean(store),
//             ...socialLinks.socialLinks
//         };

//         // Store only real files in DB (skip placeholders), but keep full response with placeholders
//         const imageFilesForDb = formattedImageFiles.filter(x => x && x.url);
//         const videoFilesForDb = formattedVideoFiles.filter(x => x && x.url);
//         if (imageFilesForDb.length > 0) postData.imageFiles = imageFilesForDb;
//         if (videoFilesForDb.length > 0) postData.videoFiles = videoFilesForDb;

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
//             .lean();
        
//                 // with {}        
//             // Replace DB media arrays with response arrays that include placeholders
//         const responseDoc = { ...populatedPost };
//         if (formattedImageFiles.length > 0) responseDoc.imageFiles = formattedImageFiles;
//         if (formattedVideoFiles.length > 0) responseDoc.videoFiles = formattedVideoFiles;
//         responseDoc.imagecount = formattedImageFiles.length;
//         responseDoc.videocount = formattedVideoFiles.length;



//         // // without {}
//         // //   Replace DB media arrays with response arrays that include placeholders only when there's at least one real file
//         // const responseDoc = { ...populatedPost };
//         // if (realImageCount > 0) responseDoc.imageFiles = formattedImageFiles;
//         // if (realVideoCount > 0) responseDoc.videoFiles = formattedVideoFiles;

//         // // Ensure response counts exclude placeholders
//         // responseDoc.imagecount = realImageCount;
//         // responseDoc.videocount = realVideoCount;



//         return res.status(200).json(
//             new ApiResponse(201, pruneEmptyMediaFields(responseDoc), "Post created successfully")
//         );
//     } catch (error) {
//         handleSocialLinkError(error);
//     }
// });

// ...existing code...

//  const publishPost = asyncHandler(async (req, res) => {
//     const { 
//         title, 
//         description, 
//         category, 
//         store, 
//         pattern, 
//         productId,
//         // client should send positions as form-data text fields:
//         // imagePositions (single value or array of values) and videoPositions
//         imagePositions: rawImagePositions,
//         videoPositions: rawVideoPositions,
//         ...socialPayload 
//     } = req.body;

//     if (!title || !description) throw new ApiError(400, "Title and description are required");
//     if (!category) throw new ApiError(400, "Category is required");

//     validateMediaFiles(req.files || {});

//     // ensure category exists
//     const categoryExists = await Categoury.findOne({categouryname: category});
//     if (!categoryExists) await Categoury.create({categouryname: category});

//     const user = await User.findById(req.userVerfied._id);
//     if (!user) throw new ApiError(404, "User not found");

//     // video/thumbnail conflict check
//     const hasVideoFiles = req.files?.videoFiles && req.files.videoFiles.length > 0;
//     const hasThumbnail = req.files?.thumbnail && req.files.thumbnail.length > 0;
//     if (!hasVideoFiles && hasThumbnail) throw new ApiError(400, "Cannot upload thumbnail when video files are not present.");

//     try {
//         const socialLinks = processSocialLinks(user, socialPayload);

//         // uploads
//         let thumbnailUrl = null;
//         let imageUrls = [];
//         let videoUrls = [];
//         let audioUrls = [];
//         let songUrls = [];

//         const imagePlaceholders = countPlaceholders(req.body?.imageFiles);
//         const videoPlaceholders = countPlaceholders(req.body?.videoFiles);

//         const uploadTasks = [];
//         if (req.files?.thumbnail?.length) {
//             uploadTasks.push(uploadResult(req.files.thumbnail[0].path).then(r => { if (!r?.url) throw new Error("thumb failed"); thumbnailUrl = r.url; }));
//         }
//         if (req.files?.imageFiles?.length) {
//             uploadTasks.push(uploadMultipleFiles(req.files.imageFiles, 'image').then(urls => imageUrls = urls));
//         }
//         if (req.files?.videoFiles?.length) {
//             uploadTasks.push(uploadMultipleFiles(req.files.videoFiles, 'video').then(urls => videoUrls = urls));
//         }
//         if (req.files?.audioFiles?.length) {
//             uploadTasks.push(uploadMultipleFiles(req.files.audioFiles, 'audio').then(urls => audioUrls = urls));
//         }
//         if (req.files?.song?.length) {
//             uploadTasks.push(uploadMultipleFiles(req.files.song, 'song').then(urls => songUrls = urls));
//         }

//         await Promise.all(uploadTasks);

//         // parse positions sent by client (can be single value or array of strings)
//         const parsePositions = (raw) => {
//             if (!raw) return [];
//             const arr = Array.isArray(raw) ? raw : [raw];
//             return arr.map(v => {
//                 const n = parseInt(v, 10);
//                 return Number.isFinite(n) && n > 0 ? n : null;
//             }).filter(v => v !== null);
//         };
//         const imagePosArr = parsePositions(rawImagePositions);
//         const videoPosArr = parsePositions(rawVideoPositions);

//         // build slot arrays using explicit positions
//         const buildSlotsUsingPositions = (placeholdersCount, uploadedUrls, positionsArr) => {
//             // determine required length
//             const maxProvidedPos = positionsArr.length ? Math.max(...positionsArr) : 0;
//             const minSlots = placeholdersCount + uploadedUrls.length;
//             const totalSlots = Math.max(maxProvidedPos, minSlots, uploadedUrls.length ? Math.max(...positionsArr, 0) : 0) || minSlots;

//             const slots = Array.from({ length: totalSlots }).map(() => ({}));

//             // place uploaded items into slots according to positionsArr when provided
//             // positionsArr corresponds to uploadedUrls order (client must provide same order)
//             let uploadedIndex = 0;
//             // first, if positions provided, try placing accordingly
//             for (let i = 0; i < uploadedUrls.length; i++) {
//                 const url = uploadedUrls[i];
//                 const pos = positionsArr[i];
//                 if (pos && pos >= 1 && pos <= slots.length && !slots[pos - 1].url) {
//                     slots[pos - 1] = { url, position: pos };
//                     uploadedIndex++;
//                 } else {
//                     // will fill later into earliest empty
//                     break;
//                 }
//             }

//             // fill remaining uploaded urls into earliest empty slots left-to-right
//             let ui = 0;
//             for (let i = 0; i < uploadedUrls.length; i++) {
//                 const url = uploadedUrls[i];
//                 // skip those already placed (if positionsArr[i] was used)
//                 if (positionsArr[i] && slots[positionsArr[i] - 1] && slots[positionsArr[i] - 1].url === url) continue;
//                 // find first empty index
//                 const emptyIndex = slots.findIndex(s => !s.url);
//                 if (emptyIndex === -1) {
//                     // expand slots if no empty slot (shouldn't normally happen)
//                     slots.push({ url, position: slots.length + 1 });
//                 } else {
//                     slots[emptyIndex] = { url, position: emptyIndex + 1 };
//                 }
//             }

//             // set positions for any uploaded placed without explicit position
//             for (let i = 0; i < slots.length; i++) {
//                 if (slots[i].url) slots[i].position = i + 1;
//             }

//             return slots;
//         };

//         const formattedImageFiles = buildSlotsUsingPositions(imagePlaceholders, imageUrls, imagePosArr);
//         const formattedVideoFiles = buildSlotsUsingPositions(videoPlaceholders, videoUrls, videoPosArr);

//         // counts exclude placeholder {}
//         const realImageCount = formattedImageFiles.filter(x => x && x.url).length;
//         const realVideoCount = formattedVideoFiles.filter(x => x && x.url).length;

//         // prepare postData (DB: only store real media objects)
//         const imageFilesForDb = formattedImageFiles.filter(x => x && x.url);
//         const videoFilesForDb = formattedVideoFiles.filter(x => x && x.url);

//         const postData = {
//             title,
//             description,
//             category,
//             productId,
//             thumbnail: thumbnailUrl || undefined,
//             audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
//             song: songUrls.length > 0 ? songUrls[0] : undefined,
//             imagecount: realImageCount,
//             videocount: realVideoCount,
//             audiocount: audioUrls.length,
//             pattern: pattern || 'single',
//             owner: user._id,
//             store: Boolean(store),
//             ...socialLinks.socialLinks
//         };
//         if (imageFilesForDb.length > 0) postData.imageFiles = imageFilesForDb;
//         if (videoFilesForDb.length > 0) postData.videoFiles = videoFilesForDb;

//         // cleanup undefined
//         Object.keys(postData).forEach(k => postData[k] === undefined && delete postData[k]);

//         const post = await Post.create(postData);

//         const populatedPost = await Post.findById(post._id)
//             .populate('owner', 'username fullName avatar')
//             .lean();

//         // prepare response doc: include only real files (remove {} placeholders) and renumber positions
//         const responseDoc = { ...populatedPost };

//         if (realImageCount > 0) {
//             responseDoc.imageFiles = formattedImageFiles
//                 .filter(f => f && f.url)
//                 .map((f, idx) => ({ ...f, position: f.position || idx + 1 }));
//             responseDoc.imagecount = responseDoc.imageFiles.length;
//         } else {
//             delete responseDoc.imageFiles;
//             responseDoc.imagecount = 0;
//         }

//         if (realVideoCount > 0) {
//             responseDoc.videoFiles = formattedVideoFiles
//                 .filter(f => f && f.url)
//                 .map((f, idx) => ({ ...f, position: f.position || idx + 1 }));
//             responseDoc.videocount = responseDoc.videoFiles.length;
//         } else {
//             delete responseDoc.videoFiles;
//             responseDoc.videocount = 0;
//         }

//         return res.status(200).json(new ApiResponse(201, pruneEmptyMediaFields(responseDoc), "Post created successfully"));
//     } catch (error) {
//         handleSocialLinkError(error);
//     }
// });




// new publishPost  with imageFile1, imageFile2, videoFile1, videoFile2


// const publishPost = asyncHandler(async (req, res) => {
//     const { 
//         title, 
//         description, 
//         category, 
//         store, 
//         pattern, 
//         productId,
//         autoplay1,
//         autoplay2,
//         autoplay3,
//         autoplay4,
//         autoplay5,

//         ...socialPayload 
        
//     } = req.body;

//     if (!title || !description) throw new ApiError(400, "Title and description are required");
//     if (!category) throw new ApiError(400, "Category is required");

//     // Validate files structure - now checking for numbered fields
//     validateNumberedMediaFiles(req.files || {});

//     // Ensure category exists
//     const categoryExists = await Categoury.findOne({categouryname: category});
//     if (!categoryExists) await Categoury.create({categouryname: category});

//     const user = await User.findById(req.userVerfied._id);
//     if (!user) throw new ApiError(404, "User not found");

//     // Video/thumbnail conflict check
//     const hasVideoFiles = checkForNumberedVideoFiles(req.files);
//     const hasThumbnail = req.files?.thumbnail && req.files.thumbnail.length > 0;
//     if (!hasVideoFiles && hasThumbnail) {
//         throw new ApiError(400, "Cannot upload thumbnail when video files are not present.");
//     }

//     try {
//         const socialLinks = processSocialLinks(user, socialPayload);

//         // Initialize upload results
//         let thumbnailUrl = null;
//         let imageResults = {}; // Store as {position: url}
//         let videoResults = {}; // Store as {position: url}
//         let audioUrls = [];
//         let songUrls = [];

//         const uploadTasks = [];

//         // Handle thumbnail upload
//         if (req.files?.thumbnail?.length) {
//             uploadTasks.push(
//                 uploadResult(req.files.thumbnail[0].path)
//                     .then(result => {
//                         if (!result?.url) throw new Error("Thumbnail upload failed");
//                         thumbnailUrl = result.url;
//                     })
//             );
//         }

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

//         // Handle numbered video files (videoFile1, videoFile2, etc.)
//         for (let i = 1; i <= 5; i++) {
//             const fieldName = `videoFile${i}`;
//             if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
//                 uploadTasks.push(
//                     uploadResult(req.files[fieldName][0].path)
//                         .then(result => {
//                             if (!result?.url) throw new Error(`Video file ${i} upload failed`);
//                             videoResults[i] = result.url;
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
//             .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by position number
//             .map(position => ({
//                 url: imageResults[position],
//                 Imageposition: parseInt(position)
//             }));

//         const formattedVideoFiles = Object.keys(videoResults)
//             .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by position number
//             .map(position => ({
//                 url: videoResults[position],
//                 Videoposition: parseInt(position)
//             }));

//         // Create post data
//         const postData = {
//             title,
//             description,
//             category,
//             productId,
//             thumbnail: thumbnailUrl || undefined,
//             audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
//             song: songUrls.length > 0 ? songUrls[0] : undefined,
//             imagecount: formattedImageFiles.length,
//             videocount: formattedVideoFiles.length,
//             audiocount: audioUrls.length,
//             pattern: pattern || 'single',
//             owner: user._id,
//             store: Boolean(store),
//             ...socialLinks.socialLinks
//         };

//         // Add media arrays only if they have content
//         if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
//         if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;

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
//             .lean();

//         return res.status(200).json(
//             new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Post created successfully")
//         );
//     } catch (error) {
//         handleSocialLinkError(error);
//     }
// });



//new publishPost with check => autoplay1, autoplay2, autoplay3, autoplay4, autoplay5

const publishPost = asyncHandler(async (req, res) => {
    const { 
        title, 
        description, 
        category, 
        store, 
        pattern, 
        productId,
        autoplay1,
        autoplay2,
        autoplay3,
        autoplay4,
        autoplay5,

        ...socialPayload 
        
    } = req.body;
    
    if (!title || !description) throw new ApiError(400, "Title and description are required");
    if (!category) throw new ApiError(400, "Category is required");

    // Validate files structure - now checking for numbered fields
    validateNumberedMediaFiles(req.files || {});

    // Ensure category exists
    const categoryExists = await Categoury.findOne({categouryname: category});
    if (!categoryExists) await Categoury.create({categouryname: category});

    const user = await User.findById(req.userVerfied._id);
    if (!user) throw new ApiError(404, "User not found");

    // Video/thumbnail conflict check
    const hasVideoFiles = checkForNumberedVideoFiles(req.files);
    const hasThumbnail = req.files?.thumbnail && req.files.thumbnail.length > 0;
    if (!hasVideoFiles && hasThumbnail) {
        throw new ApiError(400, "Cannot upload thumbnail when video files are not present.");
    }

    try {
        const socialLinks = processSocialLinks(user, socialPayload);

        // Initialize upload results
        let thumbnailUrl = null;
        let imageResults = {}; // Store as {position: url}
        let videoResults = {}; // Store as {position: url}
        let audioUrls = [];
        let songUrls = [];

        const uploadTasks = [];

        // Handle thumbnail upload
        if (req.files?.thumbnail?.length) {
            uploadTasks.push(
                uploadResult(req.files.thumbnail[0].path)
                    .then(result => {
                        if (!result?.url) throw new Error("Thumbnail upload failed");
                        thumbnailUrl = result.url;
                    })
            );
        }

        // Handle numbered image files (imageFile1, imageFile2, etc.)
        for (let i = 1; i <= 5; i++) {
            const fieldName = `imageFile${i}`;
            if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
            uploadTasks.push(
                    uploadResult(req.files[fieldName][0].path)
                        .then(result => {
                            if (!result?.url) throw new Error(`Image file ${i} upload failed`);
                            imageResults[i] = result.url;
                        })
                        .catch(error => {
                            throw new ApiError(400, `Image file ${i} upload failed: ${error.message}`);
                        })
                );
            }
        }

        // Handle numbered video files (videoFile1, videoFile2, etc.)
        for (let i = 1; i <= 5; i++) {
            const fieldName = `videoFile${i}`;
            if (req.files?.[fieldName] && req.files[fieldName].length > 0) {
            uploadTasks.push(
                    uploadResult(req.files[fieldName][0].path)
                        .then(result => {
                            if (!result?.url) throw new Error(`Video file ${i} upload failed`);
                            videoResults[i] = result.url;
                        })
                        .catch(error => {
                            throw new ApiError(400, `Video file ${i} upload failed: ${error.message}`);
                        })
                );
            }
        }

        // Handle audio files (keeping original structure)
        if (req.files?.audioFiles?.length) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.audioFiles, 'audio')
                    .then(urls => audioUrls = urls)
            );
        }

        // Handle song files (keeping original structure)
        if (req.files?.song?.length) {
            uploadTasks.push(
                uploadMultipleFiles(req.files.song, 'song')
                    .then(urls => songUrls = urls)
            );
        }

        // Wait for all uploads to complete
        await Promise.all(uploadTasks);

        // Convert results to arrays with positions
        const formattedImageFiles = Object.keys(imageResults)
            .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by position number
            .map(position => ({
                url: imageResults[position],
                Imageposition: parseInt(position)
            }));

        // helper to parse autoplay values from form-data (accepts "1","true","yes","on" or boolean)
        const parseAutoplayFlag = (val) => {
            if (val === undefined || val === null) return false;
            if (typeof val === 'boolean') return val;
            const s = String(val).trim().toLowerCase();
            return ['1', 'true', 'yes', 'on'].includes(s);
        };

        // autoplay1..autoplay5 are destructured from req.body at top of publishPost
        const autoplayFlags = { 1: autoplay1, 2: autoplay2, 3: autoplay3, 4: autoplay4, 5: autoplay5 };

        const formattedVideoFiles = Object.keys(videoResults)
            .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by position number
            .map(position => ({
                url: videoResults[position],
                Videoposition: parseInt(position),
                autoplay: parseAutoplayFlag(autoplayFlags[position])
            }));

        // Create post data
        const postData = {
            title,
            description,
            category,
            productId,
            thumbnail: thumbnailUrl || undefined,
            audioFile: audioUrls.length > 0 ? audioUrls[0] : undefined,
            song: songUrls.length > 0 ? songUrls[0] : undefined,
            imagecount: formattedImageFiles.length,
            videocount: formattedVideoFiles.length,
            audiocount: audioUrls.length,
            pattern: pattern || 'single',
            owner: user._id,
            store: Boolean(store),
            ...socialLinks.socialLinks
        };

        // Add media arrays only if they have content
        if (formattedImageFiles.length > 0) postData.imageFiles = formattedImageFiles;
        if (formattedVideoFiles.length > 0) postData.videoFiles = formattedVideoFiles;

        // Remove undefined fields
        Object.keys(postData).forEach(key => {
            if (postData[key] === undefined) {
                delete postData[key];
            }
        });

        const post = await Post.create(postData);

        // Populate owner details for response
        const populatedPost = await Post.findById(post._id)
            .populate('owner', 'username fullName avatar')
            .lean();

        return res.status(200).json(
            new ApiResponse(201, pruneEmptyMediaFields(populatedPost), "Post created successfully")
        );
    } catch (error) {
        handleSocialLinkError(error);
    }
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
