import { ApiError } from "../utils/ApiErrors.js";
import CreateStore from "../models/store/store.createstore.model.js";

// Middleware to verify if the user is the owner of a store
const verifyStoreOwner = async (req, res, next) => {
    console.log("Route:", req.originalUrl, "Params:", req.params)
    try {
         const  {storeId}  = req.params || req.body
           // Correctly check for storeId in both places
        //    const storeId = req.params.storeId || req.body.storeId;
        // const storeId = req.params.storeId || req.body.storeId;
        if (!storeId) {
            throw new ApiError(400, "Store ID is required");
        }

        // Ensure user is authenticated
    if (!req.userVerfied._id) {
        throw new ApiError(401, "Unauthorized: User not authenticated");
    }

        const store = await CreateStore.findById(storeId);
        
        if (!store) {
            throw new ApiError(404, "Store not found");
        }
        
        // Check if the authenticated user is the owner of the store
        if (store.owner.toString() !== req.userVerfied._id.toString()) {
            throw new ApiError(403, "You are not authorized to perform this action");
        }
        
        // Attach store to request object for later use
        req.store = store;
        next();
    } catch (error) {
        next(new ApiError(error.statusCode || 500, error.message || "Error verifying store ownership"));
    }
};

export { verifyStoreOwner };
