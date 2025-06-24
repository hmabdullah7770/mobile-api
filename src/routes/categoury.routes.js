import {
    getCatagoury,
    // getCatagourycount,
    getAllCategouryName,
    addCategoury,
    deleteCategoury,
    getFollowingUsersCategoryUltraFast,
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

export default router;