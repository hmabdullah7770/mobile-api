import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiErrors.js";
import Card from "../models/card.model.js";
import Categoury from "../models/categoury.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';

// optimized code
// 🚀 SUPER OPTIMIZED VERSION - Even faster counting!
//  (with total count)
// export const getCatagourycount = asyncHandler(async (req, res) => {
//   const { categoury, adminpassword, page = 1, limit = 10 } = req.query;
//   const skip = (parseInt(page) - 1) * parseInt(limit);
//   const parsedLimit = parseInt(limit);

//   // Input validation
//   if (!adminpassword) {
//     throw new ApiError(400, "Admin password is required");
//   }

//   if (adminpassword !== "(Bunny)tota#34#") {
//     throw new ApiError(403, "Access denied");
//   }

//   if (!categoury) {
//     throw new ApiError(400, "Category name is required");
//   }

//   try {
//     // 🎯 SOLUTION: Build match condition once
//     const matchCondition = {};
//     if (categoury !== 'All') {
//       matchCondition.category = categoury;
//     }
//     // Add other filters if needed
//     // matchCondition.isPublished = true;

//     // 🚀 SUPER OPTIMIZED: Single pipeline with smart counting
//     const pipeline = [
//       // ✅ EARLY FILTERING (uses index)
//       ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
      
//       // ✅ EARLY SORTING (uses index)
//       { $sort: { createdAt: -1 } },
      
//       // 🔥 SMART FACET - More efficient counting
//       {
//         $facet: {
//           // Get paginated data with expensive operations
//           data: [
//             { $skip: skip },
//             { $limit: parsedLimit },
//             // Expensive operations ONLY on limited data
//             {
//               $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "owner",
//                 pipeline: [
//                   {
//                     $project: {
//                       username: 1,
//                       email: 1,
//                       avatar: 1,
//                       fullName: 1
//                     }
//                   }
//                 ]
//               }
//             },
//             { $unwind: "$owner" },
//             {
//               $project: {
//                   //  ownerDetails: 0 // Remove the array, keeping only the single owner object
//                 title: 1,
//                 description: 1,
//                 category: 1,
//                 owner: 1,
//                 createdAt: 1,
//                 updatedAt: 1,
//                 thumbnail: 1
//               }
//             }
//           ],
          
//           // 🔥 OPTIMIZED COUNTING - Only count, no expensive operations
//           totalCount: [
//             { $count: "count" }
//           ]
//         }
//       }
//     ];

//     // Execute single optimized query
//     const result = await Card.aggregate(pipeline);
    
//     const cards = result[0].data;
//     const totalCount = result[0].totalCount[0]?.count || 0;

//     if (totalCount === 0 && categoury !== 'All') {
//       throw new ApiError(404, "Category not found");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, `${categoury === 'All' ? 'All categories' : 'Category'} fetched successfully`, {
//         cards,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(totalCount / parsedLimit),
//           totalItems: totalCount,
//           itemsPerPage: parsedLimit,
//           hasNextPage: skip + parsedLimit < totalCount,
//           hasPrevPage: parseInt(page) > 1
//         }
//       })
//     );

//   } catch (error) {
//     throw new ApiError(500, `Database error: ${error.message}`);
//   }
// });

// 🔥 EVEN MORE OPTIMIZED VERSION - If you want to avoid counting altogether
// (without totalcount)
// export const getCatagoury = asyncHandler(async (req, res) => {
//   const { categoury, adminpassword, page = 1, limit = 10 } = req.query;
//   const skip = (parseInt(page) - 1) * parseInt(limit);
//   const parsedLimit = parseInt(limit);

//   // Input validation (same as above)
//   if (!adminpassword || adminpassword !== "(Bunny)tota#34#" || !categoury) {
//     throw new ApiError(400, "Invalid request");
//   }

//   try {
//     const matchCondition = {};
//     if (categoury !== 'All') {
//       matchCondition.category = categoury;
//     }

//     // 🚀 ULTRA FAST: Get data + check if there's more (no total count)
//     const pipeline = [
//       ...(Object.keys(matchCondition).length > 0 ? [{ $match: matchCondition }] : []),
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: parsedLimit + 1 }, // Get 1 extra to check if there's next page
//       {
//         $lookup: {
//           from: "users",
//           localField: "owner",
//           foreignField: "_id",
//           as: "owner",
//           pipeline: [
//             { $project: { username: 1, email: 1, avatar: 1, fullName: 1 } }
//           ]
//         }
//       },
//       { $unwind: "$owner" },
//       {
//         $project: {
//           title: 1,
//           description: 1,
//           category: 1,
//           owner: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           thumbnail: 1
//         }
//       }
//     ];

//     const cards = await Card.aggregate(pipeline);
    
//     // Check if there's more data
//     const hasNextPage = cards.length > parsedLimit;
//     if (hasNextPage) {
//       cards.pop(); // Remove the extra item
//     }

//     if (cards.length === 0 && categoury !== 'All') {
//       throw new ApiError(404, "Category not found");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, `${categoury === 'All' ? 'All categories' : 'Category'} fetched successfully`, {
//         cards,
//         pagination: {
//           currentPage: parseInt(page),
//           itemsPerPage: parsedLimit,
//           hasNextPage,
//           hasPrevPage: parseInt(page) > 1
//           // No totalPages or totalItems - saves counting time!
//         }
//       })
//     );

//   } catch (error) {
//     throw new ApiError(500, `Database error: ${error.message}`);
//   }
// });

// 📊 PERFORMANCE COMPARISON:

/*
🔥 UNDERSTANDING THE COUNTING:

Scenario: 1000 cards total, filtering "shirts" category = 100 cards, page 3, limit 3

❌ OLD WAY:
1. countDocuments({category: "shirts"}) - scans 100 cards (~10ms)
2. aggregate() - processes 100 cards with $lookup (~200ms)
Total: ~210ms

✅ CURRENT OPTIMIZED (your code):
1. Single aggregate:
   - $match: filters to 100 cards (fast - uses index)
   - $sort: sorts 100 cards (fast - uses index) 
   - $facet:
     * data: skip(6) + limit(3) + $lookup on 3 cards (~5ms)
     * count: counts 100 cards (no $lookup, just counting) (~8ms)
Total: ~13ms

🚀 ULTRA FAST VERSION:
1. Single aggregate:
   - $match: filters to 100 cards
   - $sort: sorts 100 cards
   - $skip: skips 6 cards
   - $limit: gets 4 cards (3 + 1 extra)
   - $lookup: only on 4 cards (~6ms)
Total: ~6ms (50% faster than optimized!)

The trade-off: No total count, but lightning fast!
*/

// 🤔 WHICH VERSION TO USE?

/*
USE FIRST VERSION IF:
- You need total count for pagination UI
- You want to show "Page X of Y" 
- You need "Showing 1-10 of 234 results" 

USE ULTRA FAST VERSION IF:
- You only need "Next/Previous" buttons
- Mobile app with infinite scroll
- Performance is more important than exact counts
- Netflix/Instagram style pagination (no page numbers)
*/



// 🚀 ULTRA FAST VERSION - No counting, with skipped we are using this now (current)

// 🚀 ULTRA FAST VERSION - No counting, lightning speed
export const getCatagoury = asyncHandler(async (req, res) => {
  const { categoury, adminpassword, page = 1, limit = 10 } = req.query;
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

  

// simple code 

 // export const getCatagoury = asyncHandler(async (req, res) => {
//    const {categoury, adminpassword} = req.query

//    if(!adminpassword){
//       throw new ApiError(400, "cate code is required")
//     }

//   if (adminpassword !== "(Bunny)tota#34#") {
//     throw new ApiError(403, "you dont access the categoury")
//   }

//    if (!categoury) {
//         throw new ApiError(402, "Categoury name is required")
//    }
   
//    if(categoury === 'All'){
//      // Use aggregation for All cards to include owner details
//      const allcards = await Card.aggregate([
//        {
//          $lookup: {
//            from: "users", // The users collection name
//            localField: "owner",
//            foreignField: "_id",
//            as: "ownerDetails",
//            pipeline: [
//              {
//                $project: {
//                  username: 1,
//                  email: 1,
//                  avatar: 1,
//                  _id: 1
//                }
//              }
//            ]
//          }
//        },
//        {
//          $addFields: {
//            owner: { $arrayElemAt: ["$ownerDetails", 0] }
//          }
//        },
//        {
//          $project: {
//            ownerDetails: 0 // Remove the array, keeping only the single owner object
//          }
//        },
//        {
//          $sort: { createdAt: -1 } // Sort by createdAt in descending order
//        }
//      ])

//      return res.status(200).json(
//        new ApiResponse(201, "All Categoury fetched successfully", allcards)
//      )
//    }

//    // For specific category
//    const existingCategoury = await Card.aggregate([
//      {
//        $match: { 
//          category: categoury 
//        }
//      },
//      {
//        $lookup: {
//          from: "users",
//          localField: "owner",
//          foreignField: "_id",
//          as: "ownerDetails",
//          pipeline: [
//            {
//              $project: {
//                fullName: 1,
//                email: 1,
//                avatar: 1,
//                _id: 1
//              }
//            }
//          ]
//        }
//      },
//      {
//        $addFields: {
//          owner: { $arrayElemAt: ["$ownerDetails", 0] }
//        }
//      },
//      {
//        $project: {
//          ownerDetails: 0
//        }
//      },
//      {
//        $sort: { createdAt: -1 } // Sort by createdAt in descending order
//      }
//    ])

//    if (!existingCategoury.length) {
//      throw new ApiError(404, "Categoury not found")
//    }

//    return res.status(200).json(
//      new ApiResponse(201, "Categoury fetched successfully", existingCategoury)
//    )
// })
  




// Additional optimization: Create indexes
// Run these in your MongoDB shell or migration script:
/*
db.cards.createIndex({ "category": 1, "createdAt": -1 })
db.cards.createIndex({ "createdAt": -1 })
db.cards.createIndex({ "owner": 1 })
db.users.createIndex({ "_id": 1 })
*/







export const getAllCategouryName = asyncHandler(async (req, res) => {

    

  const {adminpassword} = req.query

   if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    }

  if (adminpassword!=="(Bunny)tota#34#") {
    throw new ApiError(401,"you dont access the categoury ");
  }

    const allCategoury = await Categoury.find();

  return  res.status(200).json(new ApiResponse(201,"Categoury fetched successfully", allCategoury));


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



