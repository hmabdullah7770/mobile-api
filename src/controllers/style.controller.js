import { Style } from "../models/style.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";

// Server-side password (you should move this to environment variables)
const ADMIN_PASSWORD = "$2b$10$YOUR_HASHED_PASSWORD"; // Replace with your actual hashed password

const verifyPassword = async (password) => {
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD);
    if (!isValid) {
        throw new ApiError(401, "Invalid password");
    }
};

const createStyle = asyncHandler(async (req, res) => {
    const { 
        password,
        name, 
        type, 
        section,
        icons,
        colorScheme,
        typography,
        layout,
        componentStyles,
        animations,
        mediaQueries,
        customClasses 
    } = req.body;

    // Verify admin password
    await verifyPassword(password);

    if (!name || !type) {
        throw new ApiError(400, "Name and type are required");
    }

    const style = await Style.create({
        name,
        type,
        section,
        icons,
        colorScheme,
        typography,
        layout,
        componentStyles,
        animations,
        mediaQueries,
        customClasses
    });

    return res.status(201).json(
        new ApiResponse(201, style, "Style created successfully")
    );
});

const updateStyle = asyncHandler(async (req, res) => {
    const { styleId } = req.params;
    const { password, ...updates } = req.body;

    // Verify admin password
    await verifyPassword(password);

    const style = await Style.findByIdAndUpdate(
        styleId,
        updates,
        { new: true, runValidators: true }
    );

    if (!style) {
        throw new ApiError(404, "Style not found");
    }

    return res.status(200).json(
        new ApiResponse(200, style, "Style updated successfully")
    );
});

const getStyles = asyncHandler(async (req, res) => {
    const { type, section, isActive } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (section) query.section = section;
    if (isActive !== undefined) query.isActive = isActive;

    const styles = await Style.find(query)
        .sort({ priority: -1 })
        .select('-__v'); // Exclude version key

    return res.status(200).json(
        new ApiResponse(200, styles, "Styles retrieved successfully")
    );
});

const deleteStyle = asyncHandler(async (req, res) => {
    const { styleId } = req.params;
    const { password } = req.body;

    // Verify admin password
    await verifyPassword(password);

    const style = await Style.findByIdAndDelete(styleId);

    if (!style) {
        throw new ApiError(404, "Style not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Style deleted successfully")
    );
});

// Get all styles for a specific section or component
const getStylesBySection = asyncHandler(async (req, res) => {
    const { section } = req.params;
    
    const styles = await Style.find({ 
        section, 
        isActive: true 
    }).sort({ priority: -1 });

    return res.status(200).json(
        new ApiResponse(200, styles, "Section styles retrieved successfully")
    );
});

export {
    createStyle,
    updateStyle,
    getStyles,
    deleteStyle,
    getStylesBySection
}; 