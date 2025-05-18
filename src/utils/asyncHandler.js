
export const asyncHandler = (HandleRequest) => {
    return (req, res, next) => {
        Promise.resolve(HandleRequest(req, res, next)).catch((error) => {
            next(error)
        })
    }
}