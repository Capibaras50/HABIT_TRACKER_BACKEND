const { rateLimit } = require('express-rate-limit')

const loginLimiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 5,
    message: { message: 'Maximo de peticiones excedido' },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: true,
})

const apiLimiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 200,
    message: { message: 'Maximo de peticiones excedido' },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: true,
    skip: (req, res) => {
        if (req.originalUrl === '/api/v1/auth/login') {
            return true
        }

        return false
    }
})

module.exports = { loginLimiter, apiLimiter }