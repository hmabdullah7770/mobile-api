// middlewares/timeSync.middleware.js
import { ApiError } from "../utils/ApiErrors.js";

const timeSyncMiddleware = (req, res, next) => {
    const clientTimestamp = req.headers['x-timestamp'];
    
    if (clientTimestamp) {
        const serverTime = Date.now();
        const clientTime = parseInt(clientTimestamp);
        const timeDiff = Math.abs(serverTime - clientTime);
        const TIME_TOLERANCE = 30000; // 30 seconds
        
        if (timeDiff > TIME_TOLERANCE) {
            return next(new ApiError(400, "Clock synchronization required", {
                serverTime: serverTime,
                clientTime: clientTime,
                difference: timeDiff
            }));
        }
    }
    
    next();
};

export { timeSyncMiddleware };