const express = require('express')
const { login, register, refreshToken, logout } = require('../controllers/authController')
const schemaHandler = require('../middlewares/schemaHandler')
const jwtHandler = require('../middlewares/authHandler')
const { loginSchema, registerSchema } = require('../schemas/authSchema')
const { loginLimiter } = require('../utils/rateLimiters')
const router = express.Router()

router.post('/login', loginLimiter, schemaHandler(loginSchema, 'body'), login)
router.delete('/logout', jwtHandler, logout)
router.post('/register', schemaHandler(registerSchema, 'body'), register)
router.patch('/refresh-token', refreshToken)

module.exports = router