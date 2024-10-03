const router = require("express").Router()
const bcrypt = require('bcrypt')
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Profile } = require("../models/users")
const { validator } = require("../validations")
const { userSignupValidator, userLoginValidator, changePasswordValidator, verifyEmailValidator, resetPasswordValidator, resetPasswordConfirmValidator, refreshTokenValidator} = require("../validations/users")
const { generateToken, authenticateUser, verifyRefreshToken, generateRefreshToken } = require("../utils/authorization")
const { generateOTP, verifyOTP } = require("../utils")
const { createError } = require("../utils/errors")


// configure passport
passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/api/auth/google',
  }, async function verify(accessToken, refreshToken, profile, cb) {
    try {
        const email = profile?._json?.email
        // get user
        let user = await User.findOne({email, deleted: false}).select('+password')
        if (!user) {
            const username = profile?._json?.name
            const emailVerified = profile?._json.email_verified
            user = await User.create({username, email, emailVerified})
        }
        // Check if email was used with email authentication
        if (user.password) {
            const err = new Error("Account with email already exist")
            return cb(err)
        }
    
        cb(null, user)
    }catch (err) {
        cb(err)
    }
  }));

// Sign in with google
router.get('/login/google', passport.authenticate('google', { scope: [, "email",'profile'] }));

router.get('/google', passport.authenticate('google', { session:false }), async (req, res, next) => {
    try { 
        if( !req.isAuthenticated() ) return next(createError(401))

        const user = req.user
        const payload = {id: user.id}
        const token = generateToken(payload)
        const refresh = generateRefreshToken(payload)

        return res.status(200).json({
            refresh,
            token,
            user
        })
    } catch  (err) {
        next(err)
    }
    
});


// Signup User
router.post("/register", validator(userSignupValidator), async (req, res, next) => {
    const {username, email, password} = req.body
    const salt = parseInt(process.env.SALT)
    try{
        // Check for existing User
        const exist = await User.findOne({$or: [{email}, {username}], deleted: false})
        if(exist) {
            return res.status(400).json({
                error: {
                    message: "user already exist"
                }
            })
        }
        // hash password and create user
        const hashed = bcrypt.hashSync(password, salt)
        const user = await User.create({username, email, password:hashed})

        // create user profile
        await Profile.create({userId: user.id})

        const payload = {id: user.id}
        const token = generateToken(payload)
        const refresh = generateRefreshToken(payload)

        res.status(201).json({message: "user created", data: {refresh, token, user}})
    }catch(err){
        next(err)
    }
})

// Login User
router.post("/login", validator(userLoginValidator), async (req, res, next) => {
    try {
        const {email, password} = req.body
        // Get user
        const user = await User.findOne({email, deleted: false}).select('+password')
        if(!user) {
            return res.status(400).json({
                error: {
                    message: "Invalid email or passwrd"
                }
            })
        }
        // check if password
        if (!user.password) {
            return res.status(400).json({
                error: {
                    message: "Invalid email or password"
                }
            })
        }
        // check if password matches
        const match = bcrypt.compareSync(password, user.password)
        if(!match) {
            return res.status(400).json({
                error: {
                    message: "Invalid email or password"
                }
            })
        }

        if(match) {
            const payload = {id: user.id}
            const token = generateToken(payload)
            const refresh = generateRefreshToken(payload)
            return res.status(200).json({
                refresh,
                token,
                user
            })
        }

        res.sendStatus(401)
    } catch (err) {
        next(err)
    } 
})


// Change User password
router.post("/change-password", authenticateUser, validator(changePasswordValidator),  async (req, res, next) => {
    try {const {oldPassword, newPassword} = req.body
        const salt = parseInt(process.env.SALT)
        const user = req.user
        
        // check if password matches
        const match = bcrypt.compareSync(oldPassword, user.password)
        if(!match) {
            return res.status(400).json({
                error: {
                    message: "Invalid password"
                }
            })
        }

        if(match) {
            const hashed = bcrypt.hashSync(newPassword, salt)
            user.password = hashed
            await user.save()
            return res.status(200).json({
                message: "Password changed",
                data: user
            })
        }

        res.sendStatus(401)
    } catch (err) {
        next(err)
    }

})


// Reset Password
router.post("/reset-password", validator(resetPasswordValidator), async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({email, deleted: false})
        if (user) {
            // send otp to email
            await generateOTP(email)
        }
        res.status(200).json({message: "Check email for OTP code"})
    } catch (err) {
        next(err)
    }
    
})


// Confirm reset password
router.post("/confirm-reset-password", validator(resetPasswordConfirmValidator), async (req, res, next) => {
    const { otp, email, password } = req.body
    const salt = parseInt(process.env.SALT)
    const user = await User.findOne({email, deleted: false})

    if (!user) {
        const err = createError(400, "Invalid Code")
        next(err)
    }
    // Verify otp
    const isVerified = await verifyOTP(email, otp)
    if (!isVerified) {
        const err = createError(400, "Invalid Code")
        next(err)
    }

    // Reset password
    const hashed = bcrypt.hashSync(password, salt)
    user.password = hashed
    await user.save()
    return res.status(200).json({
        message: "Password reset" 
    }) 
})


// Verify Use email
router.get("/verify-email", authenticateUser, async (req, res, next) => {
    const user = req.user
    // send otp to email
    await generateOTP(user.email)
    
    res.status(200).json({message: "Check email for OTP code"})
})


// Verify Use email
router.post("/confirm-verify-email", authenticateUser, validator(verifyEmailValidator), async (req, res, next) => {
    const {otp} = req.body
    const user = req.user

    // Verify otp
    const isVerified = await verifyOTP(user.email, otp)
    if (!isVerified) {
        const err = createError(400, "Invalid Code")
        next(err)
    }
    
    user.emailVerified = true
    await user.save()
    res.status(200).json({message: "Email verified"})
})


// Refresh token
router.post("/refresh-token", validator(refreshTokenValidator), async (req, res, next) => {
    try {
        const {token: refreshToken} = req.body

        // Verify refresh token
        const data = verifyRefreshToken(refreshToken)      
        // Generate new access token
        const token = generateToken({id: data.id})

       return res.status(200).json({refresh: refreshToken, token})
    }catch (err) {
        next(err)
    }
    
})




module.exports = router
