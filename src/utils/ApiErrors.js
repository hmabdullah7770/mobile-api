class ApiError extends Error {

    constructor(
        statusCode,
        error = "Something went  wrong",
        messege = [],
        stack

    ) {

        super(error)
        this.statusCode = statusCode
        this.messege = messege
        this.error = error
        this.data = null
        this.success = false

        if (stack) {
            this.stack
        }
        else {
            stack = Error.captureStackTrace(this, this.constructor)
        }




    }


// Method to convert the error to JSON format
    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.messege,
            error: this.error,
            success: this.success,
            data: this.data,
        };
    }

}

export { ApiError }