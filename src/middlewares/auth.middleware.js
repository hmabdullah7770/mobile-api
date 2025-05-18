import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse} from "../utils/ApiResponse.js"
import { User } from '../models/user.model.js';

const VerfyJwt =async (req,res,next)=>{
debugger
    //verified the login user
    try{

     const token = req.cookies?.accessToken || req.headers.authorization.replace('Bearer ', '')

    //  const token =  req.headers.authorization.replace('Bearer ', '')

    
     
     
     if(!token){

        return  ApiError(401 ,"accessToken is not in the header or cookies")
     }


         
     const decordtoken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

     if(!decordtoken){

         return ApiError(401, "Token is invalid or expired")
     }
        
     const user = await User.findById(decordtoken._id)


        if(!user){

            return ApiError(404,"user not found")
        }


      
        req.userVerfied = user

        next()
    }
    catch(error){

        next(new ApiError(401, error.message || "Authentication failed"));
    }
    }

    export default VerfyJwt