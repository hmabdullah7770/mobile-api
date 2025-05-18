
import express from 'express';
import { 
    verifyEmail,
    matchOtp,
    matchUsername,
    registerUser,
    loginUser, 
    logOut,
    refreshToken,
    changePassword,
    getuser,
    updateuser,
    changeavatar,
    changecoverImage,
    getWatchHistory,
    // getFavouret ,
    followlistcon,
    reSendOtp,
    resetPassword,
    forgetPassword
    

} from '../controllers/user.controller.js';
import {upload} from '../middlewares/multer.middleware.js';
import VerfyJwt from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/verify-email',verifyEmail)

router.post('/match-otp',matchOtp)

router.get('/match-username/:username',matchUsername)


router.post('/register',
    upload.fields([
        {name: 'avatar', maxCount: 1},
        {name: 'coverImage', maxCount: 1}
    ]),
    registerUser
);

router.post('/login', loginUser);
router.post('/logout', VerfyJwt, logOut);
router.post('/re-send-otp',reSendOtp)
router.post('/forget-password',forgetPassword)
router.post('/reset-password',resetPassword )

// Protected routes
router.post("/change-password", VerfyJwt, changePassword);
router.get("/current-user", VerfyJwt, getuser);
router.patch("/update-account", VerfyJwt, updateuser);
router.post('/refresh-token', refreshToken);

router.patch("/avatar", 
    VerfyJwt, 
    upload.fields([{ name: "avatar", maxCount: 1 }]), 
    changeavatar
);

router.patch("/cover-image", 
    VerfyJwt, 
    upload.fields([{ name: "coverImage", maxCount: 1 }]), 
    changecoverImage
);


router.get("/f/:username", VerfyJwt, followlistcon);
// router.get("/get-favourets", VerfyJwt, getFavouret );
router.route("/history").get(VerfyJwt, getWatchHistory)

export default router;






// import express from 'express';
// import { registerUser,loginUser, logOut ,refreshToken
// , changePassword, 
// getuser , 
// updateuser, 
// changeavatar, 
// changecoverImage, 
// getWatchHistory, 
// updateAccountDetails,
// subscription

// } from '../controllers/user.controller.js';
// import {upload} from '../middlewares/multer.middleware.js';
// import VerfyJwt from '../middlewares/auth.middleware.js';

// const router = express.Router();

// router.post('/register',
//     upload.fields([                 // middleware before register user
//     {name: 'avatar', maxCount: 1},   // check the avatar is uploaded
//     {name: 'coverImage', maxCount: 1} // check the cover image is uploaded

// ])
// ,
// registerUser
// )

// router.get('/register', (req, res) => {
//     res.send('we are in register');
// });

// router.post('/login',loginUser
// )

// //we cal also writer
// //router.route('/login).post(loginUser)


// //secure route
// router.post('/logout', 
//   VerfyJwt,  // Middleware first
//   logOut  ,
//    // Then handler
// );

// router.post('/refreshtoken',
//     refreshToken
// )


// router.post('/changepassword',
//     changepassword
// )






// router.post("/change-password",VerfyJwt, changePassword)
// router.get("/current-user",VerfyJwt, getuser )
// router.patch("/update-account",VerfyJwt, updateuser)

// router.patch("/avatar",VerfyJwt, upload.fields("avatar"), changeavatar)
// router.patch("/cover-image",VerfyJwt, upload.fields("coverImage"), changecoverImage)

// router.get("/c/:username",VerfyJwt, subscription)
// router.get("/history",VerfyJwt, getWatchHistory )


// export default router;