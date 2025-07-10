import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import {Otp} from "../models/otp.model.js"
import { uploadResult } from "../utils/Claudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"
import transporter from "../utils/nodemailer.js"
import { Followlist } from "../models/followlist.model.js";



//mogration code for store

// const runMigrations = async () => {
//     try {
//         // Check if migration is needed
//         const usersWithoutStores = await User.countDocuments({ stores: { $exists: false } });
        
//         if (usersWithoutStores > 0) {
//             console.log(`Found ${usersWithoutStores} users without stores field. Running migration...`);
            
//             const result = await User.updateMany(
//                 { stores: { $exists: false } },
//                 { $set: { stores: [] } }
//             );
            
//             console.log(`Migration completed: Updated ${result.modifiedCount} users`);
//         } else {
//             console.log("No migration needed - all users have stores field");
//         }
//     } catch (error) {
//         console.error("Migration failed:", error);
//     }
// };

// // Run migrations on app startup
// runMigrations();


const generateAccessTokenAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.getAccessToken();
  const refreshToken = user.getRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const verifyEmail = asyncHandler(async(req,res)=>{

  const {email} = req.body

  if(!email){

    throw new ApiError(400,"email is required for Email Verification")
  }
   
  const user = await User.findOne({email})

  if(user){
    throw new ApiError(409, "user already exist")
  }


   // Check for existing OTP and delete it
   await Otp.deleteMany({ 
    email, 
    purpose: 'registration'
  });

// await User.updateMany(
//   { storeLink: null },
//   { $set: { storeLink: undefined } }
// );
  //generate otp

     const otp = Math.floor(100000 + Math.random() * 900000).toString();
     console.log("otp is :",otp)
    const otpHash = await bcrypt.hash(otp, 10);
    console.log("otpHash is :",otpHash)
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    await Otp.create({
      email,
      otp: otpHash,
      expiresAt,
      purpose: 'registration'
    });

    // Send email using nodemailer
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Email Verification OTP",
        text: `Your Email Verification OTP is ${otp}. It will expire in 20 minutes.`,
        html: `
          <div>
            <h3>Email Verification Request</h3>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
          </div>
        `
      });
    } catch (error) {
     res.json(500,"Failed to  Verifiy email");
      // Clean up OTP if email fails
      await Otp.deleteOne({ email, purpose: 'registration' });
      return res.json(
         500 ,"Failed to send reset email"
      );
    }


    return res.status(200).json(
      new ApiResponse(
        201,
      
        { messege: "OTP sent to your email",
          otp:`${otp}`
         }
      )
    );
});






export const matchUsername = asyncHandler(async(req,res)=>{

 const {username} = req.params;

if(!username){
  throw new ApiError("username is required")
}

const user = await User.findOne({username})

if(user){
  throw new ApiError(402,"Username Already taken please chose another")
}

return res
    .status(200)
    .json(new ApiResponse(201, `Successfull.You can take ${username} as username`));

})


export const matchOtp = asyncHandler(async(req, res)=>{

  const { email, otp} = req.body

  if (!email || !otp){

    throw new ApiError(400,"Email and otp is required")

    

  }

   const enteredOtp = await Otp.findOne({ email , purpose :'registration'})


   if(!enteredOtp){
    throw new ApiError(404,"Otp not found")
   }

  const isValid = await bcrypt.compare(otp, enteredOtp.otp)

  if(!isValid){
    throw new ApiError(401,"Otp is not matched")
  }

  // const isExpired = enteredOtp.expiresAt < new Date()

  // if(isExpired){
  //   throw new ApiError(400,"Otp is expired")
  // }

  //cleanup Otp
  
  res.status(200).json(
    new ApiResponse(200, "Otp matched successfully")
  )


})


//social links


export const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message: "user registered succesfully"
  // })

  //request from frontent send accept data in request.body
  // validation of data  we get all the data required
  // check if the user already exit findone()
  // upload the avatar (req) and backgorund image
  // upload to cloudnay
  // save the user in database
  // cheack the user is created
  // remove the password and refresh token from responce
  // return response

  const { username, email, otp,password, fullName, whatsapp, storeLink, facebook, instagram, productlink, gender, age, bio } = req.body;
  console.log("email is :", email);

  //-----for biggners this is good methord but we write professional so we follow another
  //if (!username || !email || !password || !fullName) {
  //res.status(400).json({
  //message: "All fields are required"})
  //throw new Error("All fields are required") }
  //res.status(200).json({
  //message: "user registered successfully"});
  //console.log("username is:",username.trim(), "email", email.trim());

  if (
    [username, email, password, fullName, gender, age, bio,otp].some((fields) => fields?.trim() == "")
  ) {
    throw new ApiError(400, "All fields are required some of them are empty");
  }

 


  // Check if at least one social link is provided
  if (!whatsapp && !storeLink && !facebook && !instagram) {
    throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required");
  }

  const CheckUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  console.log("USer is :", CheckUser);

  if (CheckUser) {
    throw new ApiError(409, "User already exist");
  }

  // Check for duplicate social links if provided
  const socialLinksQuery = [];
  if (whatsapp) socialLinksQuery.push({ whatsapp });
  if (storeLink) socialLinksQuery.push({ storeLink });
  if (facebook) socialLinksQuery.push({ facebook });
  if (instagram) socialLinksQuery.push({ instagram });

  if (socialLinksQuery.length > 0) {
    const existingSocialLink = await User.findOne({
      $or: socialLinksQuery
    });

    if (existingSocialLink) {
      throw new ApiError(409, "One of the social links is already in use");
    }
  }

  const avatarLocalpath = req.files.avatar[0].path; //local file path for multer
  const coverImageLocalpath = req.files.coverImage[0].path;

  // let coverImageLocalpath;
  // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  // const coverImageLocalpath = req.files.coverImage[0].path ;   //local file path for multer
  // }
  // console.log(" coverImageLocalpath",coverImageLocalpath)
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadResult(avatarLocalpath);

  const coverImage = await uploadResult(coverImageLocalpath);

  if (!avatar) {
    throw new ApiError(500, "Avatar is not on cloudnary");
  }

  const otpRecord = await Otp.findOne({ email, purpose:'registration' });
  if (!otpRecord) {
    
   throw new ApiError(404,"Invalid or expired OTP empty") 
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otp);
  const isExpired = otpRecord.expiresAt < new Date();

  if(!isValid){
    ApiError(
       401,"Invalid Otp please enter the valid otp")}


       if (isExpired) {
       
        // Cleanup expired/invalid OTP
        await Otp.deleteOne({ _id: otpRecord._id });
        ApiError( 400,
           " Expired OTP ...");
      }

       // Cleanup O
    // Cleanup OTP
    await Otp.deleteOne({ email, purpose: 'registration' });


  const createuser = await User.create({
    username,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    fullName,
    gender,
    age,
    otp,
    bio,

    // Add social links that exist
  ...(whatsapp ? { whatsapp } : {}),
  ...(storeLink ? { storeLink } : {}),
  ...(facebook ? { facebook } : {}),
  ...(instagram ? { instagram } : {}),
    // whatsapp,
    //  storeLink,
    // facebook,
    // instagram,
    productlink
  });

// // Only add social links if they exist
// if (whatsapp) userData.whatsapp = whatsapp;
// if (storeLink) userData.storeLink = storeLink;
// if (facebook) userData.facebook = facebook;
// if (instagram) userData.instagram = instagram;
// if (productlink) userData.productlink = productlink;




  const createdUser = await User.findById(createuser._id).select(
    " -password -refreshToken -otp"
  );

  if (!createdUser) {
    throw new ApiError(500, "someting went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // req.body = data from frontend
  //username or email  shoudl be unique
  // find user from db
  // check if user exist
  // check if password is correct if not reset password using gmail
  // generate access token and refresh token send both to the user
  // send cookies to the user

  const { email, username, password } = req.body;

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const checkpassword = await user.isPasswordCorrect(password);

  if (!checkpassword) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser =await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiError(500, "something went wrong while login");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  //  res.cookie("accessToken", accessToken, options)
  //  res.cookie("refreshToken" , refreshToken , options)

  //   return res.status(201).json(

  //     new ApiResponse(200, loggedInUser, "User logged in successfullu")
  //   )

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)

    .json(
      new ApiResponse(
        201,
        { user: loggedInUser, accessToken, refreshToken },
        { messege: "User logged in successfully" }
      )
    );
});

export const logOut = asyncHandler(async (req, res) => {
 
 
  try{

   
  await User.findByIdAndUpdate(
    req.userVerfied._id,
    {
      $set: {
        refreshToken: null, //remove the accessToken
      },
    },
    {
      new: true, //return the updated user without refresh token
    }
  );


  const options = {
    httpOnly: true,
    secure: true,
  };

  
  // req.userVerfied._id;
return res
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "User logged out successfully"
  ))
  }

  catch (error) {
    console.error("Logout error:", error);
    throw new ApiError(400, `logout error:${error}`)}
    


  //remove refreshtoken from Db
  //redirect to the register screen
});


export const refreshToken = asyncHandler(async (req, res)=>{

  //get the refresh token from the cookies
  //verify the refresh token
  //find the user from the database 
  //generate new access token and refresh token
  //send the new access token and refresh token to the user
  //send the cookies to the user
  //return the response
 try{
  const incommingrefreshToken = req.cookies?.refreshToken || req.headers.authorization?.replace('Bearer ', '')

  if(!incommingrefreshToken ){

    throw new ApiError(410,"Refresh token is not in the header or cookies")

  }

  const decordreftoken = jwt.verify(incommingrefreshToken,process.env.REFRESH_TOKEN_SECRET)

  if(!decordreftoken?._id){

    throw new ApiError(411,"Refresh token is invalid or expired")

  }

  const user = await User.findById(decordreftoken._id)

  if(!user){
    throw new ApiError(412,"decorded user not found in the database")

  }

  console.log('Incoming Token:', incommingrefreshToken);
  console.log('Stored Token:', user.refreshToken);
          if (await user.refreshToken !== incommingrefreshToken) {
             
           throw new ApiError(413,"refresh token does not match with the user in the dat")
           
          }


  const {accessToken,refreshToken}= await generateAccessTokenAndRefreshToken(user._id)

  console.log('After generating new Stored Token:', user.refreshToken);
  const options = {
    httpOnly: true,
    security: true,
  }

  return res.status(200).cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(new ApiResponse(200,{accessToken,refreshToken},"Token refreshed successfully"))
}
catch (error) {
    // console.error('Refresh token error:', error);
    
    // if (error.name === 'TokenExpiredError') {
    //   throw new ApiError(401, "Refresh token expired");
    // } else if (error.name === 'JsonWebTokenError') {
    //   throw new ApiError(401, "Invalid refresh token");
    // }
    
    throw new ApiError(414, error.message , error.name || "Token refresh failed");
  }

}
)


export const forgetPassword = asyncHandler(async(req,res)=>{

  const {email} = req.body

  if(!email){

    throw new ApiError(400,"email is required for forget password")
  }
   
  const user = await User.findOne({email})

  if(!user){
    throw new ApiError(404, "user not found")
  }


   // Check for existing OTP and delete it
   await Otp.deleteMany({ 
    email, 
    purpose: 'password_reset'
  });

  //generate otp

     const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 5 minutes

    await Otp.create({
      email,
      otp: otpHash,
      expiresAt,
      purpose: 'password_reset'
    });

    // Send email using nodemailer
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It will expire in 20 minutes.`,
        html: `
          <div>
            <h3>Password Reset Request</h3>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 5 minutes.</p>
          </div>
        `
      });
    } catch (error) {
     res.json(500,"Failed to send password reset email");
      // Clean up OTP if email fails
      await Otp.deleteOne({ email, purpose: 'password_reset' });
      return res.json(
         500 ,"Failed to send reset email"
      );
    }


    return res.status(200).json(
      new ApiResponse(
        201,
      
        { messege: "OTP sent to your email" }
      )
    );
});


export const resetPassword = asyncHandler(async(req,res)=>{

  const {email,otp,newpassword}=req.body

  if(!email || !otp || !newpassword){

    throw new ApiError(404,"email ,opt and password is rrequired")
  }

  const otpRecord = await Otp.findOne({ email, purpose:'password_reset' });
  if (!otpRecord) {
    
   throw new ApiError(404,"Invalid or expired OTP empty") 
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otp);
  const isExpired = otpRecord.expiresAt < new Date();

  if(!isValid){
    ApiError(
       401,"Invalid Otp please enter the valid otp")}


       if (isExpired) {
       
        // Cleanup expired/invalid OTP
        await Otp.deleteOne({ _id: otpRecord._id });
        ApiError( 400,
           " Expired OTP ...");
      }

       // Update password
    const hashedPassword = await bcrypt.hash(newpassword, 10);
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }
    );
 
    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }
  
    // Cleanup O
    // Cleanup OTP
    await Otp.deleteOne({ email, purpose: 'password_reset' });

    return res.status(200).json(
      new ApiResponse(201,"password reset successfully")
    )
    
      

})


export const reSendOtp= asyncHandler(async(req,res)=>{

   const {email} = req.body

   if(!email){
       ApiError(409,"email is required")
   }
   const user = await User.findOne({ email });

   if (!user){
    ApiError(404,"user not found")
   }

  //  if (user.verified) {
  //   ApiError(400,"User is already verified")}

  // Generate new OTP and update the record.
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  console.log("resend-otp:",otp);
  await Otp.findOneAndUpdate(
    { email },
    { otp: otpHash, expiresAt },
    { upsert: true, new: true }
  );


    // Send the new OTP via email.
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Resend: Email Verification OTP",
      html: `<p>Your new OTP for email verification is: <strong>${otp}</strong></p>
             <p>This OTP is valid for 5 minutes.</p>`,
    });

    return res
    .status(200)
    .json(
      new ApiResponse(201,"otp re-send successfully")
    )

  })


export const changePassword = asyncHandler(async(req,res)=>{

  //get the password from frontend
  //validate the pasword
  //verify the password is correct
  //find the user from the database
  //cahnge password save in db
  //return response

  const {oldpassword,newpassword} = req.body

  // try{
    if(!oldpassword || !newpassword){

    throw new ApiError(400,"Old password and new password is required")
  }
   
  

  const user = await User.findById(req.userVerfied?._id)

   // Add null check
   if(!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  const validpassword = await user.isPasswordCorrect(oldpassword)
  
  if(!validpassword){
  throw new ApiError(401,"Old password is incorrect")
  }

  user.password = newpassword
  await user.save({validateBeforeSave:false})


  return res.status(200).json(new ApiResponse(200,"Password changed successfully"))
// }
// catch(error){
//   throw new ApiError(500,error)

// }
})



export const getuser = asyncHandler(async(req,res)=>{

  //get the user from the database
  
  const user = await User.findById(req.userVerfied._id).select("-password -refreshToken -otp")

  if(!user){
    throw new ApiError(404,"User not found")

  }


  return res.status(200).json(new ApiResponse(200,user,"User found successfully"))
})

//update user

// export const updateuser = asyncHandler(async(req,res)=>{

//   //get the user from the database
//   //update the user in the database 
//   //return response 
//   const {email,fullName, whatsapp, storeLink, facebook, instagram, productlink } = req.body

//   if(!email || !fullName){
//     throw new ApiError(400,"Email and fullname is required")

//   }

//   // Check if at least one social link will be available after update
//   // First get current user data
//   const currentUser = await User.findById(req.userVerfied._id);
  
//   // Determine which social links will be present after update
//   const willHaveWhatsapp = whatsapp !== undefined ? whatsapp : currentUser.whatsapp;
//   const willHaveStoreLink = storeLink !== undefined ? storeLink : currentUser.storeLink;
//   const willHaveFacebook = facebook !== undefined ? facebook : currentUser.facebook;
//   const willHaveInstagram = instagram !== undefined ? instagram : currentUser.instagram;

//   // Check if at least one social link will be present
//   if (!willHaveWhatsapp && !willHaveStoreLink && !willHaveFacebook && !willHaveInstagram) {
//     throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required");
//   }

//   // Check for duplicate social links if updating any
//   const socialLinksQuery = [];
//   if (whatsapp && whatsapp !== currentUser.whatsapp) socialLinksQuery.push({ whatsapp });
//   if (storeLink && storeLink !== currentUser.storeLink) socialLinksQuery.push({ storeLink });
//   if (facebook && facebook !== currentUser.facebook) socialLinksQuery.push({ facebook });
//   if (instagram && instagram !== currentUser.instagram) socialLinksQuery.push({ instagram });

//   if (socialLinksQuery.length > 0) {
//     const existingSocialLink = await User.findOne({
//       $or: socialLinksQuery,
//       _id: { $ne: req.userVerfied._id } // Exclude current user
//     });

//     if (existingSocialLink) {
//       throw new ApiError(409, "One of the social links is already in use by another user");
//     }
//   }

//   // Create update object with only provided fields
//   const updateData = {
//     email,
//     fullName
//   };
  
//   if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
//   if (storeLink !== undefined) updateData.storeLink = storeLink;
//   if (facebook !== undefined) updateData.facebook = facebook;
//   if (instagram !== undefined) updateData.instagram = instagram;
//   if (productlink !== undefined) updateData.productlink = productlink;

//   const user = await User.findByIdAndUpdate(
//     req.userVerfied._id,
//     { $set: updateData },
//     { new: true }
//   );

//   if (!user) {
//     throw new ApiError(404, "Verified user not found");
//   }

//   return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
// })

export const updateuser = asyncHandler(async(req, res) => {
    const { email, fullName, whatsapp, storeLink, facebook, instagram, productlink, bio } = req.body;
    
    // Get current user data first
    const currentUser = await User.findById(req.userVerfied._id);
    if (!currentUser) {
        throw new ApiError(404, "User not found");
    }
    
    // Create update object with only provided fields
    const updateData = {};
    
    // Only add fields that are actually being updated
    if (email !== undefined) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (productlink !== undefined) updateData.productlink = productlink;
    
    // Handle social links
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (storeLink !== undefined) updateData.storeLink = storeLink;
    if (facebook !== undefined) updateData.facebook = facebook;
    if (instagram !== undefined) updateData.instagram = instagram;
    
    // Validate at least one social link will remain after update
    const finalWhatsapp = whatsapp !== undefined ? whatsapp : currentUser.whatsapp;
    const finalStoreLink = storeLink !== undefined ? storeLink : currentUser.storeLink;
    const finalFacebook = facebook !== undefined ? facebook : currentUser.facebook;
    const finalInstagram = instagram !== undefined ? instagram : currentUser.instagram;
    
    if (!finalWhatsapp && !finalStoreLink && !finalFacebook && !finalInstagram) {
        throw new ApiError(400, "At least one social link (WhatsApp, storeLink, Facebook, or Instagram) must be provided");
    }
    
    // Check for duplicate social links (only for fields being updated)
    const uniqueChecks = [];
    if (whatsapp !== undefined && whatsapp !== currentUser.whatsapp && whatsapp) {
        uniqueChecks.push({ whatsapp });
    }
    if (storeLink !== undefined && storeLink !== currentUser.storeLink && storeLink) {
        uniqueChecks.push({ storeLink });
    }
    if (facebook !== undefined && facebook !== currentUser.facebook && facebook) {
        uniqueChecks.push({ facebook });
    }
    if (instagram !== undefined && instagram !== currentUser.instagram && instagram) {
        uniqueChecks.push({ instagram });
    }
    
    if (uniqueChecks.length > 0) {
        const existingUser = await User.findOne({
            $or: uniqueChecks,
            _id: { $ne: req.userVerfied._id }
        });
        
        if (existingUser) {
            throw new ApiError(409, "One of the social links is already in use by another user");
        }
    }
    
    // If no fields to update, return current user
    if (Object.keys(updateData).length === 0) {
        return res.status(200).json(
            new ApiResponse(200, currentUser, "No changes to update")
        );
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
        req.userVerfied._id,
        { $set: updateData },
        { 
            new: true,
            runValidators: true // This will run your schema validations
        }
    ).select("-password -refreshToken"); // Don't return sensitive fields
    
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User updated successfully")
    );
});


//change avatar image
export const changeavatar = asyncHandler(async(req,res)=>{

  //get the avatar from image frontend
  //upload the image to cloudnary 
  //update the user in the database
  

  if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
    throw new ApiError(400, "Avatar is required");
}


 
  
   const avatarLocalpath = req.files.avatar[0].path; //local file path for multer
   const avatar = await uploadResult(avatarLocalpath);
   if (!avatar) {
    
    throw new ApiError(400,"Avatar is required")
  }

  if(!avatar.url){
    throw new ApiError('404', "Avatar url not found")
  }

  const user =await User.findByIdAndUpdate(req.userVerfied._id,{

    $set:{
      avatar:avatar.url
    }

  },{new:true})
  if(!user){
    throw new ApiError(404,"verified user not found")
  }
  // user.avatar = avatar.url
  // await user.save({validateBeforeSave:false})

  return res.status(200).json(new ApiResponse(200,user,"Avatar changed successfully",avatar.url))

  })

//change cover image
  export const changecoverImage= asyncHandler(async(req,res)=>{

    //get the cover image from the frontend
    //upload the image to cloudinary
    //update the user in the database
    // const coverImageLocalPath = req.file?.path
   
    // if (!coverImageLocalPath) {
    //     throw new ApiError(400, "Cover image file is missing")
    // }


    
    const coverImageLocalpath = req.files.coverImage[0].path;

    const coverImage = await uploadResult(coverImageLocalpath);

    if(!coverImage.url){

      throw new ApiError(400,"Cover image is required")
    }

    const user =await User.findByIdAndUpdate(req.userVerfied._id,{
      $set:{
        coverImage:coverImage.url
      }

    },{new:true})

    if(!user){
      throw new ApiError(404,"Verified user not found")
    }


    return res.status(200).json(new ApiResponse(200,user,"cover image change succesfully ",coverImage.url))

  })

  export const followlistcon=asyncHandler(async(req,res)=>{

      const {username}= req.params


      if(!username?.trim()) {
        throw new ApiError(400, "username is required")
    }

    // Simple query to check if user exists
    const user = await User.findOne({username});
    console.log("Direct user lookup:", user);

    if (!user) {
        throw new ApiError(404, "profile does not exist - direct lookup")
    }




    if(!username?.trim()){

      throw new ApiError(400,"username is required")
    }

    // const user = await User.find({username})

  const followprof = await User.aggregate([{

    $match:{username:username},
    }
  
  ,{
    $lookup:{
      from:"followlists",
      localField:"_id",
      foreignField:"following",
      as: "followers"
      
    }
  },
  {
    $lookup:{
      from:"followlists",
      localField:"_id",
      foreignField:"follower",
      as:"following"

    }
  },{
    $addFields:{
         followerCount:{
          $size:"$followers"
         },
         followingCount:{
          $size:"$following"
         },
         followbutton: {
          $cond: {
              if: {$in: [req.userVerfied._id, "$followers.follower"]},
              then: true,
              else: false
          }
      }
    }
  },{$project:{
        fullName:1,
        username:1,
        email:1,
        followerCount:1,
        followingCount:1,
        followbutton:1,
        coverImage:1,
        avatar:1,
        bio:1,
        stores:1,
        createdAt:1,
        updatedAt:1,
       
  }}
  
  ])   
  console.log("User match result:", followprof);
  // console.log("Follow Profile Data:", followprof);

  if (!followprof?.length) {
    throw new ApiError(404, "profile does not exists")
}

return res
.status(200)
.json(
    new ApiResponse(200, followprof[0], "User channel fetched successfully")
)
    




  })



 export const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})






  // export const getFavouret = asyncHandler(async(req, res) => {
  //     const user = await User.aggregate([
  //         {
  //             $match: {
  //                 _id: new mongoose.Types.ObjectId(req.user._id)
  //             }
  //         },
  //         {
  //             $lookup: {
  //                 from: "videos",
  //                 localField: "addtoFavouret",
  //                 foreignField: "_id",
  //                 as: "addtoFavouret",
  //                 pipeline: [
  //                     {
  //                         $lookup: {
  //                             from: "users",
  //                             localField: "owner",
  //                             foreignField: "_id",
  //                             as: "owner",
  //                             pipeline: [
  //                                 {
  //                                     $project: {
  //                                         fullName: 1,
  //                                         username: 1,
  //                                         avatar: 1
  //                                     }
  //                                 }
  //                             ]
  //                         }
  //                     },
  //                     {
  //                         $addFields:{
  //                             owner:{
  //                                 $first: "$owner"
  //                             }
  //                         }
  //                     }
  //                 ]
  //             }
  //         }
  //     ])
  
  //     return res
  //     .status(200)
  //     .json(
  //         new ApiResponse(
  //             200,
  //             user[0].watchHistory,
  //             "favouret history fetched successfully"
  //         )
  //     )
  // })
