import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiErrors.js";
import Card from "../models/card.model.js";
import Categoury from "../models/categoury.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';
import {Post} from '../models/post.model.js'
import mongoose from 'mongoose';
import { moveSyntheticComments } from 'typescript';



//🚀 getpostByCotegoury 

export const getPostsByCategory = asyncHandler(async (req, res) => {
  const { categoury, adminpassword, page , limit  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  const loggedInUserId = req.userVerfied._id;


  // Input validation
  if (!adminpassword) {
    throw new ApiError(400, "Admin password is required");
  }

  if (adminpassword !== "(Bunny)tota#34#") {
    throw new ApiError(403, "Access denied");
  }

  if (!categoury) {
    throw new ApiError(400, "Categoury name is required");
  }

  try {
    // Build match condition
    const matchCondition = {
      isPublished: true // Only fetch published posts
    };
    
    if (categoury !== 'All') {
      matchCondition.category = categoury;
    }

    // 🚀 SINGLE ULTRA FAST QUERY
    const pipeline = [
      // Early filtering (uses index)
      { $match: matchCondition },
      
      // Early sorting (uses index)
      { $sort: { createdAt: -1 } },
      
      // Skip previous documents
      { $skip: skip },
      
      // Get 1 extra to check if there's next page
      { $limit: parsedLimit + 1 },
      
      // Get owner details
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
                email: 1,
                avatar: 1,
                fullName: 1,
                 stores: 1
                 
              }
            }
          ]
        }
      },
      
      // Unwind owner array
      { $unwind: "$owner" },


//  lookup for bidding 



      ...(loggedInUserId
        ? [
            // 👇 Lookup only the logged-in user's bid for each post
            {
              $lookup: {
                from: "biddings",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$postId", "$$postId"] },
                          { $eq: ["$userId", new mongoose.Types.ObjectId(loggedInUserId)] },
                        ],
                      },
                    },
                  },
                  { $project: { bidAmount: 1 } },
                ],
                as: "myBid",
              },
            },
            {
              $addFields: {
                hasBidded: { $gt: [{ $size: "$myBid" }, 0] },
                myBidAmount: {
                  $cond: {
                    if: { $gt: [{ $size: "$myBid" }, 0] },
                    then: { $arrayElemAt: ["$myBid.bidAmount", 0] },
                    else: null,
                  },
                },
              },
            },
            { $project: { myBid: 0 } },
          
       


   //lookup for rating 


   {
              $lookup: {
                from: "ratings",
                let: { postId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$postId", "$$postId"] },
                          { $eq: ["$owner", new mongoose.Types.ObjectId(loggedInUserId)] }
                        ]
                      }
                    }
                  },
                  { $project: { rating: 1 } }
                ],
                as: "myRating"
              }
            },
            {
              $addFields: {
                hasRated: { $gt: [{ $size: "$myRating" }, 0] },
                myRatingValue: {
                  $cond: {
                    if: { $gt: [{ $size: "$myRating" }, 0] },
                    then: { $arrayElemAt: ["$myRating.rating", 0] },
                    else: null
                  }
                }
              }
            },
            { $project: { myRating: 0 } },
           
            // ✅ comment lookup
       {
        $lookup: {
          from: "newcomments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$postId", "$$postId"] },
                    { $eq: ["$owner", new mongoose.Types.ObjectId(loggedInUserId)] },
                    { $eq: ["$isReply", false] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            {
              $project: {
                _id: 1,
                content: 1,
                audioUrl: 1,
                videoUrl: 1,
                stickerUrl: 1,
                createdAt: 1
              }
            }
          ],
          as: "myComments"
        }
      },
      {
        $addFields: {
          hasCommented: { $gt: [{ $size: "$myComments" }, 0] },
          myCommentCount: { $size: "$myComments" }
        }
      }
    ]
  : []),
    




      
      // Project required fields
      {
        $project: {
          store: 1,
          product:1,
          title: 1,
          
          // Social links
           facebook: 1,
          instagram: 1,
          whatsapp: 1,
          storeLink: 1,
          // social lInks urls
          facebookurl :1
          , instagramurl:1, 
          whatsappnumberurl:1, 
          storelinkurl:1,
        


          description: 1,
          content: 1,
          category: 1,
          thumbnail: 1,
          imageFiles:1,
          videoFiles:1,
          audioFile:1,

     //missing fields
          totalRating: 1,
          ratingCount: 1,
          totalViews: 1,
          commentCount: 1,
          


          videocount: 1,
          imagecount: 1,
          audiocount: 1,
          pattern:1,
          song:1,
          // owner: 1,

          owner: {
            _id: "$owner._id",
            username: "$owner.username",
            email: "$owner.email",
            avatar: "$owner.avatar",
            fullName: "$owner.fullName",
            stores: { $cond: { if: "$store", then: "$owner.stores", else: "$$REMOVE" } }
          },
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          views: 1,
          averageRating: 1,
          isPublished: 1,
          // for bidding  
          hasBidded: 1,     // 👈 added
          myBidAmount: 1,   // 👈 added


          // for Rating info
          hasRated: 1,
          myRatingValue: 1

     // for comment info
          , hasCommented: 1,
          myCommentCount: 1,
          myComments: 1

        }
      }
    ];

    // Execute single query
    const posts = await Post.aggregate(pipeline);
    
    // Check if there's more data
    const hasNextPage = posts.length > parsedLimit;
    if (hasNextPage) {
      posts.pop(); // Remove the extra item
    }

    if (posts.length === 0 && categoury !== 'All') {
      throw new ApiError(404, "No posts found in this category");
    }

    return res.status(200).json(
      new ApiResponse(200, `${categoury === 'All' ? 'All categories' : 'Category'} posts fetched successfully`, {
        posts,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          totalSkip: skip,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});



//🚀 getfollowing postv By Cotegoury 


export const getFollowingUsersPosts= asyncHandler(async (req, res) => {
  
  const { category, page, limit  } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);
    
    // Get current user ID from JWT token
    const currentUserId = req.userVerfied._id;
    
    // Input validation
    if (!category) {
        throw new ApiError(400, "Category name is required");
    }
    
    try {
        // 🔥 SINGLE MEGA-OPTIMIZED AGGREGATION PIPELINE
        const pipeline = [
            // 🚀 STEP 1: Start with Posts collection (indexed on category + createdAt)
            {
                $match: category !== 'All' ? { category } : {}
            },
            
            // 🚀 STEP 2: Early sort (uses index - SUPER FAST)
            { 
                $sort: { 
                    createdAt: -1,
                    _id: -1  // Secondary sort for consistency
                } 
            },
            
            // 🚀 STEP 3: Lookup to check if post owner is followed by current user
            {
                $lookup: {
                    from: "followlists",
                    let: { postOwnerId: "$owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$follower", currentUserId] },
                                        { $eq: ["$following", "$$postOwnerId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 } // Stop at first match
                    ],
                    as: "followCheck"
                }
            },
            
            // 🚀 STEP 4: Filter - only keep posts from followed users
            {
                $match: {
                    "followCheck.0": { $exists: true }
                }
            },
            
            // 🚀 STEP 5: Skip + Limit early (before expensive operations)
            { $skip: skip },
            { $limit: parsedLimit + 1 }, // +1 to check hasNextPage
            
            // 🚀 STEP 6: Get owner details (only for final results)
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ]
                }
            },
            
            // 🚀 STEP 7: Final projection - FIXED
            {
                $project: {
                    title: 1,
                    description: 1,
                    store: 1,
                    stores:1,
                    category: 1,
                    thumbnail: 1,
                    imageFiles:1,
                    videoFiles:1,
                     videocount: 1,
                      imagecount: 1,
                     audiocount: 1,
                     pattern:1,
                     song:1,
                    createdAt: 1,
                    updatedAt: 1,
                    // owner: { $arrayElemAt: ["$ownerDetails", 0] }

                     owner: {
            _id: "$owner._id",
            username: "$owner.username",
            email: "$owner.email",
            avatar: "$owner.avatar",
            fullName: "$owner.fullName",
            stores: { $cond: { if: "$store", then: "$owner.stores", else: "$$REMOVE" } }
          },

                    // Removed the exclusion fields - they won't appear anyway since we're using inclusion
                }
            }
        ];
        
        // Execute single aggregation
        const posts = await Post.aggregate(pipeline);
        
        // Check pagination
        const hasNextPage = posts.length > parsedLimit;
        if (hasNextPage) {
            posts.pop(); // Remove extra item
        }
        
        return res.status(200).json(
            new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} posts fetched`, {
                posts,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parsedLimit,
                    hasNextPage,
                    hasPrevPage: parseInt(page) > 1
                }
            })
        );
        
    } catch (error) {
        throw new ApiError(500, `Database error: ${error.message}`);
    }
});






// 🚀 ULTRA FAST VERSION - No counting, lightning speed
export const getCatagoury = asyncHandler(async (req, res) => {
  const { categoury, adminpassword, page , limit  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  // Input validation
  if (!adminpassword) {
    throw new ApiError(400, "Admin password is required");
  }

  if (adminpassword !== "(Bunny)tota#34#") {
    throw new ApiError(403, "Access denied");
  }

  if (!categoury) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Build match condition
    const matchCondition = {};
    if (categoury !== 'All') {
      matchCondition.category = categoury;
    }

    // 🚀 SINGLE ULTRA FAST QUERY
    const pipeline = [
      // Early filtering (uses index)
      ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
      
      // Early sorting (uses index)
      { $sort: { createdAt: -1 } },
      
      // Skip previous documents (fast operation)
      { $skip: skip },
      
      // Get 1 extra to check if there's next page
      { $limit: parsedLimit + 1 },
      
      // Expensive operations only on limited data
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
                email: 1,
                avatar: 1,
                fullName: 1
              }
            }
          ]
        }
      },
      { $unwind: "$owner" },
      {
        $project: {
            ownerDetails: 0 // Remove the array, keeping only the single owner object
          // title: 1,
          // description: 1,
          // category: 1,
          // owner: 1,
          // createdAt: 1,
          // updatedAt: 1,
          // thumbnail: 1
        }
      }
    ];

    // Execute single query
    const cards = await Card.aggregate(pipeline);
    
    // Check if there's more data
    const hasNextPage = cards.length > parsedLimit;
    if (hasNextPage) {
      cards.pop(); // Remove the extra item
    }

    if (cards.length === 0 && categoury !== 'All') {
      throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
      new ApiResponse(200, `${categoury === 'All' ? 'All categories' : 'Category'} fetched successfully`, {
        cards,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          totalSkip: skip,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
          // No totalPages or totalItems - saves counting time!
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});

  






export const getAllCategouryName = asyncHandler(async (req, res) => {

    

  const {adminpassword} = req.query

   if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    }

  if (adminpassword!=="(Bunny)tota#34#") {
    throw new ApiError(401,"you dont access the categoury ");
  }

    const allCategoury = await Categoury.find();

  return  res.status(200).json(new ApiResponse(201,`${allCategoury.length}`, allCategoury ));


})


//Add categoury name 


export const addCategoury = asyncHandler(async (req, res) => {
    const { categouryname,adminpassword } = req.body;
  
    if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    }

if(adminpassword!=="(Bunny)tota#34#"){
  throw new ApiError(401,"you dont access the category ");
}

    if (!categouryname) {
      throw new ApiError(404,"Categoury name is required");
    }

  
    const existingCategoury = await Categoury.findOne({ categouryname:categouryname  });
  
    if (existingCategoury) {
      throw new ApiError(401,"Categoury already exists");
    }
  
    const newCategoury = await Categoury.create({ categouryname:categouryname });
  
  return  res.status(200).json(new ApiResponse(201,"Categoury added successfully", newCategoury));
  });



//deletecategoury


export const deleteCategoury = asyncHandler(async (req, res) => {
    const { categouryname,adminpassword } = req.body;

    if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    } 

    if (adminpassword!=="(Bunny)tota#34#") {
      throw new ApiError(401,"you dont access the categoury");
    }
  

    if (!categouryname) {
      throw new ApiError(401,"Categoury name is required");
    }
  
    const existingCategoury = await Categoury.findOne({ categouryname });
  
    if (!existingCategoury) {
      throw new ApiError(404,"Categoury not found");
    }
  
    await Categoury.findByIdAndDelete(existingCategoury._id);
  
   return res.status(200).json(new ApiResponse(201,"Categoury deleted successfully"));
  });








  //get following user categoury 





  // 🚀 ULTRA-OPTIMIZED SINGLE QUERY VERSION - FASTEST
export const getFollowingUsersCategoryUltraFast = asyncHandler(async (req, res) => {
    const { category, page, limit  } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);
    
    // Get current user ID from JWT token
    const currentUserId = req.userVerfied._id;
    
    // Input validation
    if (!category) {
        throw new ApiError(400, "Category name is required");
    }
    
    try {
        // 🔥 SINGLE MEGA-OPTIMIZED AGGREGATION PIPELINE
        const pipeline = [
            // 🚀 STEP 1: Start with Cards collection (indexed on category + createdAt)
            {
                $match: category !== 'All' ? { category } : {}
            },
            
            // 🚀 STEP 2: Early sort (uses index - SUPER FAST)
            { 
                $sort: { 
                    createdAt: -1,
                    _id: -1  // Secondary sort for consistency
                } 
            },
            
            // 🚀 STEP 3: Lookup to check if card owner is followed by current user
            {
                $lookup: {
                    from: "followlists",
                    let: { cardOwnerId: "$owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$follower", currentUserId] },
                                        { $eq: ["$following", "$$cardOwnerId"] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 } // Stop at first match
                    ],
                    as: "followCheck"
                }
            },
            
            // 🚀 STEP 4: Filter - only keep cards from followed users
            {
                $match: {
                    "followCheck.0": { $exists: true }
                }
            },
            
            // 🚀 STEP 5: Skip + Limit early (before expensive operations)
            { $skip: skip },
            { $limit: parsedLimit + 1 }, // +1 to check hasNextPage
            
            // 🚀 STEP 6: Get owner details (only for final results)
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ]
                }
            },
            
            // 🚀 STEP 7: Final projection - FIXED
            {
                $project: {
                    title: 1,
                    description: 1,
                    store:1,
                    category: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    owner: { $arrayElemAt: ["$ownerDetails", 0] }
                    // Removed the exclusion fields - they won't appear anyway since we're using inclusion
                }
            }
        ];
        
        // Execute single aggregation
        const cards = await Card.aggregate(pipeline);
        
        // Check pagination
        const hasNextPage = cards.length > parsedLimit;
        if (hasNextPage) {
            cards.pop(); // Remove extra item
        }
        
        return res.status(200).json(
            new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} cards fetched`, {
                cards,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parsedLimit,
                    hasNextPage,
                    hasPrevPage: parseInt(page) > 1
                }
            })
        );
        
    } catch (error) {
        throw new ApiError(500, `Database error: ${error.message}`);
    }
});

// 🔥 ALTERNATIVE: If you have TONS of cards, use this version
export const getFollowingUsersCategoryMegaFast = asyncHandler(async (req, res) => {
    const { category, page , limit  } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);
    
    const currentUserId = req.userVerfied._id;
    
    if (!category) {
        throw new ApiError(400, "Category name is required");
    }
    
    try {
        // 🚀 MEGA OPTIMIZED: Start from Followlist (smaller collection)
        const pipeline = [
            // 🔥 STEP 1: Start with current user's followings
            {
                $match: { follower: currentUserId }
            },
            
            // 🔥 STEP 2: Join with Cards collection
            {
                $lookup: {
                    from: "cards",
                    let: { followingUserId: "$following" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$owner", "$$followingUserId"] },
                                        category !== 'All' ? { $eq: ["$category", category] } : {}
                                    ].filter(Boolean) // Remove empty conditions
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } }
                    ],
                    as: "userCards"
                }
            },
            
            // 🔥 STEP 3: Unwind cards
            { $unwind: "$userCards" },
            
            // 🔥 STEP 4: Replace root with card document
            { $replaceRoot: { newRoot: "$userCards" } },
            
            // 🔥 STEP 5: Sort all cards globally
            { $sort: { createdAt: -1 } },
            
            // 🔥 STEP 6: Pagination
            { $skip: skip },
            { $limit: parsedLimit + 1 },
            
            // 🔥 STEP 7: Get owner details
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
                                email: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ]
                }
            },
            
            // 🔥 STEP 8: Clean up
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] }
                }
            }
        ];
        
        const cards = await Followlist.aggregate(pipeline);
        
        const hasNextPage = cards.length > parsedLimit;
        if (hasNextPage) {
            cards.pop();
        }
        
        return res.status(200).json(
            new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} cards fetched`, {
                cards,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parsedLimit,
                    hasNextPage,
                    hasPrevPage: parseInt(page) > 1
                }
            })
        );
        
    } catch (error) {
        throw new ApiError(500, `Database error: ${error.message}`);
    }
});




// 🚀 UNIFIED FEED - Cards + Videos Combined (Instagram-like feed)
export const getUnifiedFeed = asyncHandler(async (req, res) => {
  const { categoury, adminpassword, page , limit  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  // Input validation
  if (!adminpassword) {
    throw new ApiError(400, "Admin password is required");
  }

  if (adminpassword !== "(Bunny)tota#34#") {
    throw new ApiError(403, "Access denied");
  }

  if (!categoury) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Build match condition
    const matchCondition = {};
    if (categoury !== 'All') {
      matchCondition.categoury = categoury;
    }

    // 🔥 CARDS PIPELINE
    const cardsPipeline = [
      // Match cards
      ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
      
      // Add content type identifier
      {
        $addFields: {
          contentType: "card",
          sortDate: "$createdAt"
        }
      },
      
      // Get owner details
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
                email: 1,
                avatar: 1,
                fullName: 1,
                stores:1
              }
            }
          ]
        }
      },
      { $unwind: "$owner" },
      
      // Project card fields
      {
        $project: {
          title: 1,
          store:1,
          description: 1,
          category: 1,
          thumbnail: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          contentType: 1,
          sortDate: 1,
          // Card specific fields
          totalViews: 1,
          averageRating: 1,
          whatsapp: 1,
          storeLink: 1,
          facebook: 1,
          instagram: 1,
          productlink: 1
        }
      }
    ];

    // 🔥 VIDEOS PIPELINE
    const videosPipeline = [
      // Match videos (Note: videos use 'Uploaded' instead of 'isPublished')
      {
        $match: {
          ...matchCondition,
          Uploaded: true
        }
      },
      
      // Add content type identifier
      {
        $addFields: {
          contentType: "video",
          sortDate: "$createdAt"
        }
      },
      
      // Get owner details
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
                email: 1,
                avatar: 1,
                fullName: 1,
                stores:1,
              }
            }
          ]
        }
      },
      { $unwind: "$owner" },
      
      // Project video fields
      {
        $project: {
          title: 1,
          store:1,
          description: 1,
          category: 1,
          thumbnail: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          contentType: 1,
          sortDate: 1,
          // Video specific fields
          videoFile: 1,
          duration: 1,
          onclicks: 1,
          averageRating: 1,
          whatsapp: 1,
          storeLink: 1,
          facebook: 1,
          instagram: 1,
          productlink: 1
        }
      }
    ];

    // 🚀 COMBINED PIPELINE USING $unionWith
    const combinedPipeline = [
      // Start with cards
      ...cardsPipeline,
      
      // Union with videos
      {
        $unionWith: {
          coll: "videos",
          pipeline: videosPipeline
        }
      },
      
      // Sort by creation date (newest first)
      {
        $sort: { sortDate: -1 }
      },
      
      // Skip for pagination
      { $skip: skip },
      
      // Limit + 1 to check if there's next page
      { $limit: parsedLimit + 1 }
    ];

    // Execute the combined query
    const content = await Card.aggregate(combinedPipeline);

    // Check pagination
    const hasNextPage = content.length > parsedLimit;
    if (hasNextPage) {
      content.pop(); // Remove extra item
    }

    if (content.length === 0 && categoury !== 'All') {
      throw new ApiError(404, "No content found for this category");
    }

    return res.status(200).json(
      new ApiResponse(200, `${categoury === 'All' ? 'All categories' : 'Category'} unified feed fetched successfully`, {
        content,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          totalSkip: skip,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});




// 🚀 FOLLOWING USERS UNIFIED FEED
export const getFollowingUsersUnifiedFeed = asyncHandler(async (req, res) => {
  const { category, page , limit  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);
  
  const currentUserId = req.userVerfied._id;
  
  if (!category) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Build match condition
    const matchCondition = {};
    if (category !== 'All') {
      matchCondition.category = category;
    }

    // 🔥 UNIFIED PIPELINE FOR FOLLOWING USERS
    const pipeline = [
      // Start with cards
      {
        $match: matchCondition
      },
      
      // Check if card owner is followed
      {
        $lookup: {
          from: "followlists",
          let: { ownerId: "$owner" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$follower", currentUserId] },
                    { $eq: ["$following", "$$ownerId"] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: "followCheck"
        }
      },
      
      // Only keep content from followed users
      {
        $match: {
          "followCheck.0": { $exists: true }
        }
      },
      
      // Add content type
      {
        $addFields: {
          contentType: "card",
          sortDate: "$createdAt"
        }
      },
      
      // Union with videos from followed users
      {
        $unionWith: {
          coll: "videos",
          pipeline: [
            {
              $match: {
                ...matchCondition,
                Uploaded: true
              }
            },
            {
              $lookup: {
                from: "followlists",
                let: { ownerId: "$owner" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$follower", currentUserId] },
                          { $eq: ["$following", "$$ownerId"] }
                        ]
                      }
                    }
                  },
                  { $limit: 1 }
                ],
                as: "followCheck"
              }
            },
            {
              $match: {
                "followCheck.0": { $exists: true }
              }
            },
            {
              $addFields: {
                contentType: "video",
                sortDate: "$createdAt"
              }
            }
          ]
        }
      },
      
      // Sort by creation date
      {
        $sort: { sortDate: -1 }
      },
      
      // Pagination
      { $skip: skip },
      { $limit: parsedLimit + 1 },
      
      // Get owner details
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
                email: 1,
                avatar: 1,
                fullName: 1,
                stores:1,
              }
            }
          ]
        }
      },
      
      // Clean up
      {
        $addFields: {
          owner: { $arrayElemAt: ["$owner", 0] }
        }
      },
      
      // Remove unnecessary fields
      {
        $project: {
          followCheck: 0
        }
      }
    ];

    const content = await Card.aggregate(pipeline);
    
    const hasNextPage = content.length > parsedLimit;
    if (hasNextPage) {
      content.pop();
    }

    return res.status(200).json(
      new ApiResponse(200, `Following users' ${category === 'All' ? 'all categories' : category} unified feed fetched`, {
        content,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parsedLimit,
          hasNextPage,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    throw new ApiError(500, `Database error: ${error.message}`);
  }
});