const { pool } = require('../config/db')
const UserService = require('./userService')
const HabitService = require('./habitService')
const ApiError = require('../utils/ApiError')
const { colombiaOffset } = require('../config/config')
const habitService = new HabitService()
const userService = new UserService()

class Service {
    async createDeepWork(userId, habitId, createDeepWorkData) {
        await userService.getUser(userId)
        const habit = await habitService.getHabit(userId, habitId)
        if (!habit.need_deep_work) {
            throw new ApiError('El Habito seleccionado no necesita sesion de deep work', 400)
        }
        const startTimeDate = new Date(new Date(new Date(createDeepWorkData.startTime).getTime() - colombiaOffset).toISOString())
        const endTimeDate = new Date(new Date(new Date(createDeepWorkData.endTime).getTime() - colombiaOffset).toISOString())
        const endTimeMinutes = (endTimeDate - startTimeDate) / 60000
        createDeepWorkData.focusScore = createDeepWorkData.productiveTime / endTimeMinutes * 100
        await pool.query(`
            INSERT INTO Deep_Work 
                (habit_id, user_id, start_time, end_time, estimated_time, focus_score, cancelled, reason_cancelled, difficulty, productive_time, distractions) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [habitId, userId, createDeepWorkData.startTime, createDeepWorkData.endTime, createDeepWorkData.estimatedTime, createDeepWorkData.focusScore, createDeepWorkData.cancelled, createDeepWorkData.reasonCancelled, createDeepWorkData.difficulty, createDeepWorkData.productiveTime, createDeepWorkData.distractions] // El null debe cambiar por un valor
        )

        return { message: 'Se creo la sesion de deep work correctamente' }
    }
}

module.exports = Service