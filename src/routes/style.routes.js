import { Router } from "express";
import {
    createStyle,
    updateStyle,
    getStyles,
    deleteStyle,
    getStylesBySection
} from "../controllers/style.controller.js";

const router = Router();

router.route("/").post(createStyle).get(getStyles);
router.route("/:styleId").patch(updateStyle).delete(deleteStyle);
router.route("/section/:section").get(getStylesBySection);

export default router; 