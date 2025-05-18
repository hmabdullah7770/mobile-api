// import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {
            status: "ok",
            message: "Server is healthy",
            uptime: process.uptime()
        }, "Health check successful")
    );
})

export {
    healthcheck
    }
    