const { pool } = require('../config/db')
const ApiError = require('../utils/ApiError')
const UserService = require('./userService')
const userService = new UserService()

class Service {
    async createHabit(userId, habitData) {
        await userService.getUser(userId)
        const habit = {
            ...habitData,
            userId,
        }
        const habitCreated = await pool.query('INSERT INTO Habits (name, importance, days, time, is_in_week, user_id, need_deep_work, deep_work_with_screen) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [habit.name, habit.importance, JSON.stringify(habit.days), habit.time, habit.isInWeek, habit.userId, habit.needDeepWork, habit.deepWorkWithScreen])
        return { message: 'El habito se creo correctamente', habit: habitCreated.rows[0] }
    }

    async getHabits(userId) {
        await userService.getUser(userId)
        const resultHabits = await pool.query('SELECT * FROM Habits WHERE user_id = $1', [userId])
        if (resultHabits.rowCount === 0) {
            throw new ApiError('No se encontraron habitos', 403)
        }
        const habits = resultHabits.rows
        return habits
    }

    async getHabit(userId, habitId) {
        const resultHabit = await pool.query('SELECT * FROM Habits WHERE id = $1 AND user_id = $2', [habitId, userId])
        if (resultHabit.rowCount === 0) {
            throw new ApiError('No se encontro ningun habito con esos parametros', 403)
        }
        const habit = resultHabit.rows[0]
        return habit
    }

    async updateHabit(userId, id, changesData) {
        await userService.getUser(userId)
        const habit = await this.getHabit(userId, id)
        let contador = 1
        const keys = Object.keys(changesData)
        const values = Object.values(changesData)
        let query = 'UPDATE Habits SET '
        for (let i = 0; i < keys.length; i++) {
            const actualKey = keys[i].split(/(?=[A-Z])/)
            const joinKey = actualKey.join('_').toLowerCase()
            if (keys.length - 1 === i) {
                query = query + `${joinKey} = $${contador} `
            } else {
                query = query + `${joinKey} = $${contador}, `
            }
            contador++
        }
        query = query + `WHERE id = $${contador}`
        const queryParams = values
        queryParams.push(id)
        await pool.query(query, queryParams)
        return { message: "El habito se actualizo correctamente" }
    }

    async deleteHabit(userId, habitId) {
        await userService.getUser(userId)
        await this.getHabit(userId, habitId)
        await pool.query('DELETE FROM Habits WHERE id = $1 AND user_id = $2', [habitId, userId])
        return { message: 'El habito se borro con exito', id: habitId }
    }
}

module.exports = Service