const express = require('express')
const { getProfile, uploadImage, uploadProfile } = require('../controllers/userController')
const jwtHandler = require('../middlewares/authHandler')
const schemaHandler = require('../middlewares/schemaHandler')
const { changeUserSchema } = require('../schemas/userSchema')
const upload = require('../config/multer')
const router = express.Router()

router.get('/', jwtHandler, getProfile)
router.patch('/', jwtHandler, schemaHandler(changeUserSchema, 'body'), uploadProfile)
router.post('/upload-image', jwtHandler, upload.single('image-profile'), uploadImage)

module.exports = router