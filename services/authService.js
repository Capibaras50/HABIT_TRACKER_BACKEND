const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const ApiError = require('../utils/ApiError')
const { pool } = require('../config/db')
const { secretAccessToken, secretRefreshToken } = require('../config/config')

class AuthService {
    async createUser(userData) {
        try {
            const result = await pool.query('SELECT * FROM Auth WHERE email = $1', [userData.email])
            const userEmail = result.rows[0]
            if (userEmail) {
                throw new ApiError('The user already exists', 400)
            }
            const hashPassword = await bcrypt.hash(userData.password, 10)
            const resultUser = await pool.query('INSERT INTO Users (name) VALUES ($1) RETURNING id', [userData.name])
            const user = {
                name: userData.name,
                email: userData.email,
                password: hashPassword,
                userId: resultUser.rows[0].id
            }
            const resultAuth = await pool.query('INSERT INTO Auth (email, password, user_id) VALUES ($1, $2, $3)', [user.email, user.password, user.userId])
            return { message: 'User created successfully' }
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }

    async login(email, password) {
        try {
            const result = await pool.query('SELECT * FROM Auth INNER JOIN Users ON Users.id = Auth.user_id WHERE Auth.email = $1', [email])
            const user = result.rows[0]
            if (!user) {
                throw new ApiError('The credentials are incorrect', 401)
            }
            const { password: userPassword, recovery_token, recovery_token_created, refresh_token, ...userShow } = user
            const isMatch = await bcrypt.compare(password, userPassword)
            if (!isMatch) {
                throw new ApiError('Error logging in', 401)
            }
            const payload = {
                userId: user.user_id,
                email: user.email,
                name: user.name
            }
            const accessToken = jwt.sign(payload, secretAccessToken, { expiresIn: '1h' })
            const refreshToken = jwt.sign(payload, secretRefreshToken, { expiresIn: '7d' })
            await pool.query('UPDATE Auth SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id])
            return { accessToken, refreshToken, user: userShow }
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }

    async refresh(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, secretRefreshToken)
        } catch (err) {
            throw new ApiError('Jwt ha expirado o no funciona', 401)
        }

        const user = await pool.query('SELECT * FROM Auth INNER JOIN Users ON Users.id = Auth.user_id WHERE Auth.refresh_token = $1', [refreshToken])
        const foundUser = user.rows[0]
        if (!foundUser) {
            throw new ApiError('El usuario no esta autenticado', 401)
        }
        const accessToken = jwt.sign({ id: foundUser.user_id, email: foundUser.email, name: user.name }, secretAccessToken, { expiresIn: '1h' })
        const newRefreshToken = jwt.sign({ id: foundUser.user_id, email: foundUser.email, name: user.name }, secretRefreshToken, { expiresIn: '7d' })
        await pool.query('UPDATE Auth SET refresh_token = $1 WHERE id = $2', [newRefreshToken, foundUser.user_id])
        return { accessToken, newRefreshToken }
    }

    async logout(userId) {
        const resultUser = await pool.query('SELECT * FROM Users WHERE id = $1', [userId])
        if (!resultUser.rows[0]) {
            throw new ApiError('El usuario no existe', 403)
        }
        const result = await pool.query('UPDATE Auth SET refresh_token = null WHERE user_id = $1', [userId])
        return { message: 'logout successfully' }
    }
}

module.exports = AuthService