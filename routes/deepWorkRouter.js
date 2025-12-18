const express = require('express')
const jwtHandler = require('../middlewares/authHandler')
const schemaHandler = require('../middlewares/schemaHandler')
const { deepWorkSchema } = require('../schemas/deepWorkSchema')
const { createDeepWork } = require('../controllers/deepWorkController')
const router = express.Router()

router.post('/create/:id', jwtHandler, schemaHandler(deepWorkSchema, 'body'), createDeepWork)

module.exports = router