import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse} from "../utils/ApiResponse.js"
import { User } from '../models/user.model.js';


// Time sync validation helper
const validateTokenTiming = (decodedToken, toleranceMs = 30000) => {
    const now = Math.floor(Date.now() / 1000);
    const iat = decodedToken.iat; // issued at time
    
    // Check if token was issued too far in the future (clock sync issue)
    if (iat > now + Math.floor(toleranceMs / 1000)) {
        return false;
    }
    
    return true;
};



const VerfyJwt =async (req,res,next)=>{

    //verified the login user
    try{

     const token = req.cookies?.accessToken || req.headers.authorization.replace('Bearer ', '')

    //  const token =  req.headers.authorization.replace('Bearer ', '')

    
     
     
     if(!token){

        return  ApiError(410 ,"accessToken is not in the header or cookies")
     }


         
     const decordtoken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

     if(!decordtoken){

         return ApiError(411, "Token is invalid or expired")
     }

       // Add time sync validation
        if (!validateTokenTiming(decordtoken)) {
            return next(new ApiError(412, "Token timestamp invalid - possible clock sync issue"))
        }
        
     const user = await User.findById(decordtoken._id)


        if(!user){

            return ApiError(413,"user not found")
        }


      
        req.userVerfied = user

        next()
    }
    catch(error){

     


      return next( new ApiError(414, error.message || "Authentication failed"))
    }
    }

    export default VerfyJwt