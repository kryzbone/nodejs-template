const { v4:uuid } = require("uuid")
const { Schema, model } = require("mongoose");
const { defaultOptions, defaultPlugin, mediaSchema } = require("./index");


// User
const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        trim: true,
        minlength: 3,
        default: () => `${uuid()}.${Date.now()}`
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        select: false
    },
    accountType: {
        type: String,
        enum: ["admin", "vendor", "user"],
        default: "user",
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
}, defaultOptions)

userSchema.plugin(defaultPlugin)

userSchema.virtual('profile', {
    ref: 'Profile',
    localField: '_id',
    foreignField: 'userId',
    justOne : true
  });

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    return userObject;
}


// Profile
const profileSchema = new Schema({
    userId : {
        type: String,
        ref: "User",
        required: true
    },
    firstName: {
        type: String,
        required: false,
        trim: true,
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
    },
    phone: {
        type: String,
        required: false
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: false,
    },
    dob: {
        type: Date,
        required: false
    },
    profileImage: mediaSchema

}, defaultOptions)

profileSchema.plugin(defaultPlugin)


// OTP
const otpSchema = Schema({
    email: String,
    otp: String,
}, defaultOptions);

// Set doc to expire and be romeved after 10mins
otpSchema.index({createdAt: 1},{expireAfterSeconds: 600});




exports.User = model("User", userSchema);
exports.Profile = model("Profile", profileSchema)
exports.OTP = model('OTP', otpSchema);

