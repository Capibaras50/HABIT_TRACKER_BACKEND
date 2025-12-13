const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('./cloudinary')

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'Habit_Tracker'
    }
})

const upload = multer({ storage })