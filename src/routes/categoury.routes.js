import {
    getCatagoury,
    getAllCategouryName,
    addCategoury,
    deleteCategoury
} from '../controllers/categoury.controller.js';

import express from 'express';


const router = express.Router();

router.route('/getcategoury').get(getCatagoury);
router.route('/allcategoury').get(getAllCategouryName);
router.route('/addcategoury').post(addCategoury);
router.route('/deletecategoury').delete(deleteCategoury);

export default router;