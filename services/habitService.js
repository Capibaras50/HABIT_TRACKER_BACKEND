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
        const newHabit = habitCreated.rows[0]
        newHabit.days = typeof newHabit.days === 'string' ? JSON.parse(newHabit.days) : newHabit.days
        newHabit.completions = []
        return { message: 'El habito se creo correctamente', habit: newHabit }
    }

    async getHabits(userId, queryParams) {
        let limit = 10
        let offset = 0
        let isInWeek = true
        if (queryParams.page) {
            limit = 10 * Number(queryParams.page)
            offset = 10 * (Number(queryParams.page) - 1)
        }

        if (queryParams.isInWeek) {
            isInWeek = queryParams.isInWeek
        }

        await userService.getUser(userId)
        const resultHabits = await pool.query('SELECT * FROM Habits WHERE user_id = $1 AND is_in_week = $2 LIMIT $3 OFFSET $4', [userId, isInWeek, limit, offset])
        if (resultHabits.rowCount === 0) {
            return []
        }

        const habits = resultHabits.rows

        // Fetch completions for these habits
        // We can do this in a loop or a single query with IN clause. 
        // For simplicity and given limit=10, a loop or Promise.all is acceptable, but IN clause is better.
        // However, let's just do a simple iteration for now as optimization can come later if needed, 
        // or a single JOIN query would be best but requires restructuring the main query.
        // Let's iterate and fetch completions for each habit.

        const habitsWithCompletions = await Promise.all(habits.map(async (habit) => {
            const resultCompletions = await pool.query('SELECT date_completed FROM Habits_Completed WHERE habit_id = $1', [habit.id])
            const completions = resultCompletions.rows.map(row => {
                // Return ISO string date part YYYY-MM-DD
                const d = new Date(row.date_completed)
                return d.toISOString().split('T')[0]
            })

            return {
                ...habit,
                days: typeof habit.days === 'string' ? JSON.parse(habit.days) : habit.days,
                completions: completions
            }
        }))

        return habitsWithCompletions
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