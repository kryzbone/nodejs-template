
exports.validator = (schema) => {
    return (req, res, next) => {
        const data = req.body
        // parse location data
        if (data.location && typeof data.location == "string") {
            data.location = JSON.parse(data.location)
        }
        const result = schema.validate(data) 
        if(result.error) {
            return res.status(400).json({error: result.error.details})
        }
        next()
    }
}
