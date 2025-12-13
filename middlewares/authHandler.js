const jwt = require('jsonwebtoken')
const { secretAccessToken } = require('../config/config')
const ApiError = require('../utils/ApiError')

const jwtHandler = (req, res, next) => {
    try {
        const { access_token } = req.cookies

        if (!access_token) {
            throw new ApiError('Unhauthorized', 401)
        }

        const payload = jwt.verify(access_token, secretAccessToken)

        req.user = payload
        next()
    } catch (err) {
        next(err)
    }
}

module.exports = jwtHandler