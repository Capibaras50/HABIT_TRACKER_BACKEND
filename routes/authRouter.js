const express = require('express')
const { login, register, refreshToken, logout, recovery, changePasswordRecovery, changePassword } = require('../controllers/authController')
const schemaHandler = require('../middlewares/schemaHandler')
const jwtHandler = require('../middlewares/authHandler')
const { loginSchema, registerSchema, recoverySchema, changePasswordRecoverySchema, changePasswordSchema } = require('../schemas/authSchema')
const { loginLimiter } = require('../utils/rateLimiters')
const router = express.Router()

router.post('/login', loginLimiter, schemaHandler(loginSchema, 'body'), login)
router.delete('/logout', jwtHandler, logout)
router.post('/register', schemaHandler(registerSchema, 'body'), register)
router.patch('/refresh-token', refreshToken)
router.post('/recovery', schemaHandler(recoverySchema, 'body'), recovery)
router.patch('/recovery-change-password', schemaHandler(changePasswordRecoverySchema, 'body'), changePasswordRecovery)
router.patch('/change-password', jwtHandler, schemaHandler(changePasswordSchema, 'body'), changePassword)

module.exports = router