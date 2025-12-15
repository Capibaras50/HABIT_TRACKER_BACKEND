const { pool } = require("../config/db")
const ApiError = require("../utils/ApiError")
const { colombiaOffset } = require('../config/config')

class UserService {
    async getUser(id) {
        try {
            const result = await pool.query('SELECT * FROM Users WHERE id = $1', [id])
            const user = result.rows[0]

            if (result.rowCount === 0) {
                throw new ApiError('El usuario no existe', 403)
            }

            return user
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }

    async uploadImage(userId, linkImage) {
        await this.getUser(userId)
        await pool.query('UPDATE Users SET image_profile = $1 WHERE id = $2', [linkImage, userId])
        return { message: 'La imagen se subio correctamente', linkImage }
    }

    async changeUser(userId, dataUser) {
        await this.getUser(userId)
        let contador = 1
        const keys = Object.keys(dataUser)
        const values = Object.values(dataUser)
        let query = 'UPDATE Users SET '
        for (let i = 0; i < keys.length; i++) {
            if (keys.length - 1 === i) {
                query = query + `${keys[i]} = $${contador} `
            } else {
                query = query + `${keys[i]} = $${contador}, `
            }
            contador++
        }
        query = query + `WHERE id = $${contador}`
        const queryParams = values
        queryParams.push(userId)
        await pool.query(query, queryParams)
        return { message: 'El perfil se actualizo correctamente' }
    }

    getLocalDate(date, offsetMinutes) {
        const localTime = new Date(date.getTime() + offsetMinutes * 60000)
        return localTime.toISOString().slice(0, 10)
    }

    async increaseStreakUser(userId) {
        const user = await this.getUser(userId)
        const dateStreak = new Date(user.date_increased_streak)
        const dateNow = new Date()
        const streakDay = this.getLocalDate(dateStreak, colombiaOffset)
        const today = this.getLocalDate(dateNow, colombiaOffset)
        if (streakDay === today) {
            return { message: 'Ya se actualizo la racha hoy' }
        }
        const newStreak = user.streak + 1
        const now = new Date().toISOString()
        const userUpdated = await pool.query('UPDATE Users SET streak = $1, date_increased_streak = $2 WHERE id = $3 RETURNING *', [newStreak, now, userId])
        return userUpdated.streak
    }
}

module.exports = UserService