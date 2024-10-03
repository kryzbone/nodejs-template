const { User } = require("../models/users")
const jwt = require("jsonwebtoken")
const {createError} = require("./errors")
const secret = process.env.SECRET


exports.authorise = async (req, res, next) => {
    const myNext = (auth, user) => {
        req.isAuthenticated = auth
        req.user = user
        return next()
    }
    try{
        if(!req.headers.authorization) {
            return myNext(false, null)
        }

        const [bearer, token] = req.headers.authorization.split(" ")
        if (bearer != "Bearer") {
            return myNext(false, null)
        }

        // verfiy token
        if(token) {
            const data = jwt.verify(token, secret)
            const user = await User.findOne({_id: data.id, deleted: false }, "_id username email password accountType emailVerified")
            if (!user) return myNext(false, null)
                
            return myNext(true, user)
        }
        return myNext(false, null)
    }catch(err) {
        myNext(false, null)
    }
}

exports.authenticateUser = (req, res, next) => {
    if(!req.isAuthenticated) {
        err = createError(401)
        return next(err)
    }
    next()
}

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if(!req.isAuthenticated) {
        err = createError(401)
        return next(err)
    }
    if(req.user.accountType != "admin") {
        err = createError(403, "Must be an admin")
        return next(err)
    }
    next()
}

// Check if user is vendor
exports.isVendor = (req, res, next) => {
    if(!req.isAuthenticated) {
        err = createError(401)
        return next(err)
    }
    if(req.user.accountType != "vendor") {
        err = createError(403, "Must be a vendor")
        return next(err)
    }
    next()
}

exports.generateToken = (obj) => {
    const token = jwt.sign(obj, secret, {expiresIn: '1d'})
    return token
}

exports.generateRefreshToken = (obj) => {
    const refreshSecret = process.env.REFRESH_SECRET
    const refreshToken = jwt.sign(obj, refreshSecret, {expiresIn: '26w'})
    return refreshToken
}

exports.verifyRefreshToken = (refreshToken) => {
    const refreshSecret = process.env.REFRESH_SECRET
    const data = jwt.verify(refreshToken, refreshSecret)
    return data
}