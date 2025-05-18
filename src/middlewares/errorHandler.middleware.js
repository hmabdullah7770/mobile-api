import { ApiError } from '../utils/ApiErrors.js';

const errorHandler = (err, req, res, next) => {
    // Check if the error is an instance of ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle other errors (fallback)
    return res.status(500).json({
        statusCode: 500,
        message: err.message || 'Internal Server Error',
        success: false,
        error: [],
        data: null,
    });
};

export default errorHandler;