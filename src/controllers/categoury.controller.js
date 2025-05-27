
import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiErrors.js";
import Card from "../models/card.model.js";
import Categoury from "../models/categoury.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from '../models/user.model.js';


// getcatagoury

// export const getCatagoury = asyncHandler(async (req, res) => {

//    const {categoury,adminpassword} = req.query

//    if(!adminpassword){
//       throw new ApiError(400,"cate code is required")
//     }

//   if (adminpassword!=="(Bunny)tota#34#") {
//     throw new ApiError(403,"you dont access the categoury ");
//   }

//    if (!categoury) {

    
//         throw new ApiError(402,"Categoury name is required");
//    }

   
//     if(categoury ==='All'){
  
//      const allcards= await Card.find()

//      return res.status(200).json(new ApiResponse(201,"All Categoury fetched successfully", allcards));

//     }





//     const existingCategoury = await Card.find({ category:categoury });


//     if (!existingCategoury) {
//         throw new ApiError(404,"Categoury not found");
//     }


//    return res.status(200).json(new ApiResponse(201,"Categoury fetched successfully", existingCategoury));

// })
  
    export const getCatagoury = asyncHandler(async (req, res) => {
   const {categoury, adminpassword} = req.query

   if(!adminpassword){
      throw new ApiError(400, "cate code is required")
    }

  if (adminpassword !== "(Bunny)tota#34#") {
    throw new ApiError(403, "you dont access the categoury")
  }

   if (!categoury) {
        throw new ApiError(402, "Categoury name is required")
   }
   
   if(categoury === 'All'){
     // Use aggregation for All cards to include owner details
     const allcards = await Card.aggregate([
       {
         $lookup: {
           from: "users", // The users collection name
           localField: "owner",
           foreignField: "_id",
           as: "ownerDetails",
           pipeline: [
             {
               $project: {
                 username: 1,
                 email: 1,
                 avatar: 1,
                 _id: 1
               }
             }
           ]
         }
       },
       {
         $addFields: {
           owner: { $arrayElemAt: ["$ownerDetails", 0] }
         }
       },
       {
         $project: {
           ownerDetails: 0 // Remove the array, keeping only the single owner object
         }
       }
     ])

     return res.status(200).json(
       new ApiResponse(201, "All Categoury fetched successfully", allcards)
     )
   }

   // For specific category
   const existingCategoury = await Card.aggregate([
     {
       $match: { 
         category: categoury 
       }
     },
     {
       $lookup: {
         from: "users",
         localField: "owner",
         foreignField: "_id",
         as: "ownerDetails",
         pipeline: [
           {
             $project: {
               fullName: 1,
               email: 1,
               avatar: 1,
               _id: 1
             }
           }
         ]
       }
     },
     {
       $addFields: {
         owner: { $arrayElemAt: ["$ownerDetails", 0] }
       }
     },
     {
       $project: {
         ownerDetails: 0
       }
     }
   ])

   if (!existingCategoury.length) {
     throw new ApiError(404, "Categoury not found")
   }

   return res.status(200).json(
     new ApiResponse(201, "Categoury fetched successfully", existingCategoury)
   )
})
  






//get all categoru names



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



