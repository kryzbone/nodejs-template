const defaultMessages = {
    400: "Bad request",
    401: "Unauthorised",
    403: "Forbidden",
    404: "Not found",
    500: "Server error"
}

exports.createError = (status, msg="") => {
    if(typeof status !== "number") {
        throw new Error("status should be number")
    }
    if(typeof msg !== "string") {
        throw new Error("message should be string")
    }
    const err = new Error(msg || defaultMessages[status])
    err.status = status
    return err
}