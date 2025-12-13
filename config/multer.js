const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary');
const ApiError = require('../utils/ApiError');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'Habit_Tracker'
    }
})

const fileFilter = (req, file, cb) => {
    const fileTypesAllowed = ['image/jpeg', 'image/png']
    if (!fileTypesAllowed.includes(file.mimetype)) {
        cb(new ApiError('El archivo no es valido', 400), false)
    }
    cb(null, true)
}

const upload = multer({ storage, fileFilter })

module.exports = upload