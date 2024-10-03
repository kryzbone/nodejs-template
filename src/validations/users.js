const Joi = require("joi")

// Validations
exports.userSignupValidator = Joi.object({
    username: Joi.string().min(3),
    email: Joi.string().required().email(),
    password: Joi.string().min(6)
 })

 exports.userLoginValidator = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().min(6)
 })

 exports.changePasswordValidator = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required()
 })

 exports.userUpdateValidator = Joi.object({
    username: Joi.string().min(3),
    email: Joi.string().email(),
 })
 
exports.profileCreateValidator = Joi.object({
     firstName: Joi.string().required(),
     lastName: Joi.string().required(),
     gender: Joi.string().required(),
     phone: Joi.string().allow(null, ''),
     dob: Joi.date().allow(null, ''),
     country: Joi.string().allow('')
 })


exports.profileUpdateValidator = Joi.object({
    firstName: Joi.string().trim(),
    lastName: Joi.string().trim(),
    gender: Joi.string(),
    phone: Joi.string().allow(null, ''),
    dob: Joi.date().allow(null, ''),
    country: Joi.string().allow('')
})

exports.verifyEmailValidator = Joi.object({
    otp: Joi.string().required(),
})

exports.resetPasswordValidator = Joi.object({
    email: Joi.string().required().email(),
})


exports.resetPasswordConfirmValidator = Joi.object({
    email: Joi.string().required().email(),
    otp: Joi.string().required(),
    password: Joi.string().min(6)
})


exports.refreshTokenValidator = Joi.object({
    token: Joi.string().required(),
})
 