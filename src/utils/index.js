const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const multer = require('multer')
const cloudinary = require('cloudinary').v2;
const { Readable} = require('stream');
const { getVideoDurationInSeconds } = require('get-video-duration')

const {OTP} = require("../models/users");
const { createError } = require('./errors');
const {FROM_EMAIL, EMAIL_PASS} = process.env





// Multer setup
const storage = multer.memoryStorage()  // store image in memory
const upload = multer({storage:storage})
exports.upload = upload


// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Upload image to Cloudinary
exports.cloudinaryUpload = async (filePath, folder="poppins") => {
    const result = await cloudinary.uploader.upload(filePath , {
        folder,
        resource_type: "auto",
        timeout:60000
     });
     return result
}

exports.convertBufferToDataUri = (file) => {
    if (file.buffer) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = "data:" + file.mimetype + ";base64," + b64;
        return dataURI
    }
    return file
}


exports.getVideoLength = async (file) => {  
    const stream = Readable.from(file)
    const duration = await getVideoDurationInSeconds(stream)
    return duration
    
}


exports.handleFileUpload = async (file, folder="poppins") => {
    if (!file.mimetype.includes("image") && !file.mimetype.includes("video")) {
        throw createError(400, "file must be an image or video")
    }

    // check video lenght
    if (file.mimetype.includes("video")) {
        const lenInSecs = await this.getVideoLength(file.buffer)

        if (lenInSecs > 60) {
            throw createError(400, "Video longer than 60 Secs")
        }
    }
    
    const dataURI = this.convertBufferToDataUri(file)
    const result = await this.cloudinaryUpload(dataURI, folder)
    return result
}

exports.getFileType = (file) => {
    if (file.mimetype.includes("image")) {
        return "image"
    }
    if  (file.mimetype.includes("video")) {
        return "video"
    }
    return "file"
}


// Generate OTP and send email
exports.generateOTP = async (email) => {
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const res = await OTP.create({ email, otp });

    // Send OTP via email (replace with your email sending logic)
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 587,
        secure: false,
        auth: {
            user: '0fa16d201071ca',
            pass: EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: FROM_EMAIL,
        to: email,
        subject: 'OTP Verification',
        text: `Your OTP for verification is: ${otp}`
    });

    return res
};

// Verify OTP
exports.verifyOTP = async (email, otp) => {
    const otpRecord = await OTP.findOne({ email, otp }).sort("-createdAt");
    if (otpRecord) {
        return true;
    } 
    return false
};

// Paginated Response
const LIMIT = parseInt(process.env.PAGE_LIMIT)
exports.paginatedResponse = async (model, page=1, limit=LIMIT, filter={}, sort=null, populate=[]) => {
    page = Math.abs(parseInt(page)) || 1;
    limit = Math.abs(parseInt(limit)) || 10;

    filter = {...filter, deleted: false}

    const startIndex = (page - 1) * limit;
    const total = await model.find(filter).countDocuments();

    const data = await model.find(filter).populate(populate).skip(startIndex).limit(limit).sort(sort);

    return{
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,   
        data
    };
}
