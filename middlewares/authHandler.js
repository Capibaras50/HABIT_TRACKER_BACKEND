const jwt = require('jsonwebtoken')
const { secretAccessToken } = require('../config/config')
const ApiError = require('../utils/ApiError')

const jwtHandler = (req, res, next) => {
    const { access_token } = req.cookies

    if (!access_token) {
        return next(new ApiError('Unhauthorized', 401))
    }

    try {
        const payload = jwt.verify(access_token, secretAccessToken)

        req.user = payload
        next()
    } catch (err) {
        return next(new ApiError('Unhauthorized', 401))
    }
}

module.exports = jwtHandler