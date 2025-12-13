const HabitService = require('../services/habitService')
const Service = new HabitService()

const createHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const habit = req.body
        const response = await Service.createHabit(userId, habit)
        return res.status(201).json(response)
    } catch (err) {
        next(err)
    }
}

const getHabits = async (req, res, next) => {
    try {
        const { userId } = req.user
        const response = await Service.getHabits(userId)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const getHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const response = await Service.getHabit(userId, id)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const deleteHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const response = await Service.deleteHabit(userId, id)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

module.exports = {
    createHabit,
    getHabits,
    getHabit,
    deleteHabit,
}