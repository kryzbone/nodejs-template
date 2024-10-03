const router = require("express").Router()
const { createError } = require("../utils/errors")
const { Profile } = require("../models/users")
const { User } = require("../models/users");
const { paginatedResponse, upload, cloudinaryUpload, convertBufferToDataUri } = require("../utils");
const { validator } = require("../validations");
const { authenticateUser, isAdmin } = require("../utils/authorization");
const { profileUpdateValidator, userUpdateValidator } = require("../validations/users");



//  update profile
router.patch("/profile/:id", authenticateUser, validator(profileUpdateValidator),  async (req, res, next) => {
    const data = req.body
    const _id = req.params.id
    const userId = req.user._id

    try {
        const profile = await Profile.findOneAndUpdate({_id, userId}, data, {new: true})
        if(!profile) {
            return next(createError(404, "Profile not found"))
        }

        return res.status(200).json({message: "profile updated", data: profile})
    }catch(err) {
        next(err)
    }   
})

router.patch("/", authenticateUser, validator(userUpdateValidator), async (req, res, next) => {
    if(!req.isAuthenticated)  return next(createError(401))

    try{
        const _id =  req.user._id
        const data = req.body
        const user = await User.findOneAndUpdate({_id}, data, {new: true})

        if (!user) return next(createError(404, "User not found"))
        return res.status(200).json({data: user })
    }catch(err) {
        err.status = 400
        return next(err)
    }  
})


router.get("/", isAdmin, async (req, res, next) => {
    if(!req. isAuthenticated) next(createError(401))

    try {
        const page = req.query.page
        const limit = req.query.limit

        const data =  await paginatedResponse(User, page, limit, {}) 
        return res.status(200).json(data)
    }catch(err) {
        next(err)
    }
})


router.get("/me", authenticateUser, async (req, res, next) => {
    if(req.isAuthenticated) {
        const _id =  req.user._id
        const user = await User.findOne({_id}).populate("profile")
        return res.status(200).json({data: user })
    }
    return next(createError(401))
})


router.post("/upload/profile-image", authenticateUser, upload.single("profileImage"), async (req, res, next) => {
    try {
        const file = req.file
        if (!file.mimetype.includes("image")) {
            return next(createError(400, "file must be an image"))
        }
    
        const dataURI = convertBufferToDataUri(file)
        const result = await  cloudinaryUpload(dataURI, "poppins/profile")

        // update user profile
        const userId =  req.user._id
        const profile = await Profile.findOne({userId})
        profile.profileImage.type = "image"
        profile.profileImage.url = result.secure_url
        profile.profileImage.publicId = result.public_id
        await profile.save()

        return res.status(200).json({message: "Profile Image updated", data: profile })
    }catch (e) {   
        next(new Error(e))
    }
})


module.exports = router