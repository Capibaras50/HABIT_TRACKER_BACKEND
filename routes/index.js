const express = require('express')
const authRouter = require('./authRouter')
const userRouter = require('./userRouter')
const habitRouter = require('./habtiRouter')
const deepWorkRouter = require('./deepWorkRouter')
const focusRouter = require('./focusRouter')
const { apiLimiter } = require('../utils/rateLimiters')
const router = express.Router()

const routerApi = (app) => {
    app.use('/api/v1', apiLimiter, router)
    router.use('/auth', authRouter)
    router.use('/users', userRouter)
    router.use('/habits', habitRouter)
    router.use('/focus', focusRouter)
    router.use('/deep-work', deepWorkRouter)
}

module.exports = routerApi