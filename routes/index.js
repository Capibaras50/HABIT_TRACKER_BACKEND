const express = require('express')
const authRouter = require('./authRouter')
const userRouter = require('./userRouter')
const { apiLimiter } = require('../utils/rateLimiters')
const router = express.Router()

const routerApi = (app) => {
    app.use('/api/v1', apiLimiter, router)
    router.use('/auth', authRouter)
    router.use('/users', userRouter)
}

module.exports = routerApi