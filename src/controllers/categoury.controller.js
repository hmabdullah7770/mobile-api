
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiErrors.js";
import Card from "../models/card.model.js";
import Categoury from "../models/categoury.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";



// getcatagoury

export const getCatagoury = asyncHandler(async (req, res) => {

   const {categoury,adminpassword} = req.body

   if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    }

  if (adminpassword!=="(Bunny)tota#34#") {
    throw new ApiError(401,"you dont access the categoury ");
  }

   if (!categoury) {

    
        throw new ApiError(401,"Categoury name is required");
   }

   
    if(categoury ==='All'){
  
     const allcards= await Card.find()

      res.status(200).json(new ApiResponse(201,"All Categoury fetched successfully", allcards));

    }





    const existingCategoury = await Card.findOne({ categoury });


    if (!existingCategoury) {
        throw new ApiError(404,"Categoury not found");
    }


    res.status(200).json(new ApiResponse(201,"Categoury fetched successfully", existingCategoury));

})
  
    
  






//get all categoru names



export const getAllCategouryName = asyncHandler(async (req, res) => {

    

  const {adminpassword} = req.body()

   if(!adminpassword){
      throw new ApiError(400,"cate code is required")
    }

  if (adminpassword!=="(Bunny)tota#34#") {
    throw new ApiError(401,"you dont access the categoury ");
  }

    const allCategoury = await Categoury.find();

    res.status(200).json(new ApiResponse(201,"Categoury fetched successfully", allCategoury));


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

  
    const existingCategoury = await Categoury.findOne({ categouryname  });
  
    if (existingCategoury) {
      throw new ApiError(401,"Categoury already exists");
    }
  
    const newCategoury = await Categoury.create({ categoury });
  
    res.status(200).json(new ApiResponse(201,"Categoury added successfully", newCategoury));
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
  
    res.status(200).json(new ApiResponse(201,"Categoury deleted successfully"));
  });



