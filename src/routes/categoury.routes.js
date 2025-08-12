import {
    
  getPostsByCategory,
getFollowingUsersPosts ,

  getCatagoury,
    // getCatagourycount,
    getAllCategouryName,
    addCategoury,
    deleteCategoury,
    getFollowingUsersCategoryUltraFast,
      
     // New unified feed imports
  getUnifiedFeed,
//   getUnifiedFeedLegacy,
  getFollowingUsersUnifiedFeed




} from '../controllers/categoury.controller.js';

import VerfyJwt from '../middlewares/auth.middleware.js';


import express from 'express';


const router = express.Router();

router.route('/getfollowinguserscategoury').get(VerfyJwt,getFollowingUsersCategoryUltraFast);
router.route('/getcategoury').get(getCatagoury);
// router.route('/getcategourycount').get(getCatagourycount);
router.route('/allcategoury').get(getAllCategouryName);
router.route('/addcategoury').post(addCategoury);
router.route('/deletecategoury').delete(deleteCategoury);




// 🚀 NEW UNIFIED FEED ROUTES
// Public unified feed (admin access)
router.route("/unified-feed").get(getUnifiedFeed);

// Legacy version for older MongoDB
// router.route("/unified-feed-legacy").get(getUnifiedFeedLegacy);



// Following users unified feed (requires auth)
router.route("/following-unified-feed").get(VerfyJwt, getFollowingUsersUnifiedFeed);



router.route('/getfollowingusersposts').get(VerfyJwt,getFollowingUsersPosts);
router.route('/getpostsbycategory').get(VerfyJwt,getPostsByCategory);


router.route()


export default router;