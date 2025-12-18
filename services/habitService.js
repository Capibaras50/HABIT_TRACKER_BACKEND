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

    async getHabits(userId, queryParams) {
        let limit = 10
        let offset = 0
        if (queryParams.page) {
            limit = 10 * Number(queryParams.page)
            offset = 10 * (Number(queryParams.page) - 1)
        }

        await userService.getUser(userId)
        const resultHabits = await pool.query('SELECT * FROM Habits WHERE user_id = $1 LIMIT $2 OFFSET $3', [userId, limit, offset])
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
        changesData.days = JSON.stringify(changesData.days)
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

    async hasUserCompletedAllImportantHabits(userId) {
        await userService.getUser(userId)
        const resultImportantHabits = await pool.query(`
            SELECT * 
            FROM Habits 
            WHERE importance = 'Alta' AND user_id = $1;`, [userId]
        )
        const resultImportantHabitsCompleted = await pool.query(`
            SELECT * 
            FROM Habits_Completed 
            INNER JOIN Habits 
                ON Habits_Completed.habit_id = Habits.id 
            WHERE CAST(Habits_Completed.date_completed as DATE) = CAST(NOW() as DATE) 
            AND Habits.importance = 'Alta' 
            AND Habits.user_id = $1;`, [userId]
        )
        if (resultImportantHabits.rowCount === 0) {
            return false
        }
        if (resultImportantHabits.rowCount !== resultImportantHabitsCompleted.rowCount) {
            return false
        }
        return true
    }

    async completeHabit(userId, id, completeData) {
        await userService.getUser(userId)
        const habit = await this.getHabit(userId, id)
        const daysHabit = habit.days
        if (!daysHabit.includes(completeData.dayCompleted)) {
            throw new ApiError('Hoy no tienes que hacer este habito', 400)
        }
        const resultHabitsCompleted = await pool.query(`
            SELECT *
            FROM Habits_Completed 
            INNER JOIN Habits 
                ON Habits_Completed.habit_id = Habits.id 
            WHERE Habits_Completed.habit_id = $1 
                AND Habits.user_id = $2 
                AND CAST(date_completed as DATE) = CAST(NOW() as DATE)`, [id, userId])

        if (resultHabitsCompleted.rowCount > 0) {
            throw new ApiError('Este habito ya se completo hoy', 400)
        }
        await pool.query('INSERT INTO Habits_Completed (habit_id, day_completed, difficulty) VALUES ($1, $2, $3)', [id, completeData.dayCompleted, completeData.difficulty])
        const shouldIncreaseStreak = await this.hasUserCompletedAllImportantHabits(userId)
        if (shouldIncreaseStreak) {
            await userService.increaseStreakUser(userId)
        }
        return { message: 'Habito completado exitosamente' }
    }

    async cancelHabit(userId, id, cancelData) {
        await userService.getUser(userId)
        await this.getHabit(userId, id)
        if (!cancelData.focusPercent) cancelData.focusPercent = null
        if (!cancelData.mentalHealthPercent) cancelData.mentalHealthPercent = null
        await pool.query('INSERT INTO Habits_Cancelled (habit_id, cancel_reason, focus_percent, mental_health_percent, difficulty) VALUES ($1, $2, $3, $4, $5)', [id, cancelData.cancelReason, cancelData.focusPercent, cancelData.mentalHealthPercent, cancelData.difficulty])
        return { message: "El habito se cancelo exitosamente" }
    }
}

module.exports = Service