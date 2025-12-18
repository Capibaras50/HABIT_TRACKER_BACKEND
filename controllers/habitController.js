const HabitService = require('../services/habitService')
const Service = new HabitService()

const createHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const habit = req.body
        const response = await Service.createHabit(userId, habit)
        return res.status(201).json(response)
    } catch (err) {
        console.error(err)
        next(err)
    }
}

const getHabits = async (req, res, next) => {
    try {
        const { userId } = req.user
        const queryParams = req.query
        const response = await Service.getHabits(userId, queryParams)
        return res.json(response)
    } catch (err) {
        console.log(err)
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

const updateHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const changesData = req.body
        const response = await Service.updateHabit(userId, id, changesData)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

const completeHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const completeData = req.body
        const response = await Service.completeHabit(userId, id, completeData)
        return res.json(response)
    } catch (err) {
        console.error(err)
        next(err)
    }
}

const cancelHabit = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const cancelData = req.body
        const response = await Service.cancelHabit(userId, id, cancelData)
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
    updateHabit,
    completeHabit,
    cancelHabit
}