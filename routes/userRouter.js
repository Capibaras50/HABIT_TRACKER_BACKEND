const express = require('express')
const { getProfile } = require('../controllers/userController')
const jwtHandler = require('../middlewares/authHandler')
const router = express.Router()

router.get('/', jwtHandler, getProfile)
// PATCH /
// POST /upload-image

module.exports = router