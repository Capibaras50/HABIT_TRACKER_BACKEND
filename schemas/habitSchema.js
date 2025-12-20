const joi = require('joi')

const createHabitSchema = joi.object({
    name: joi.string().max(30).min(1).required(),
    importance: joi.string().valid('Alta', 'Media', 'Baja').required(),
    time: joi.number().max(480).required(),
    isInWeek: joi.bool().required(),
    days: joi.when('isInWeek', {
        is: true,
        then: joi.array().items(joi.string().valid('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes')),
        otherwise: joi.array().items(joi.string().valid('Sabado', 'Domingo')),
    }).required(),
    needDeepWork: joi.bool().required(),
    deepWorkWithScreen: joi.bool().required(),
})

const updateHabitSchema = joi.object({
    name: joi.string().max(30).min(1),
    importance: joi.string().valid('Alta', 'Media', 'Baja'),
    time: joi.number().max(480),
    isInWeek: joi.bool().required(),
    days: joi.when('isInWeek', {
        is: true,
        then: joi.array().items(joi.string().valid('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes')),
        otherwise: joi.array().items(joi.string().valid('Sabado', 'Domingo'))
    }),
    needDeepWork: joi.bool(),
    deepWorkWithScreen: joi.bool(),
})

const getHabitSchema = joi.object({
    id: joi.number().required(),
})

const deleteHabitSchema = joi.object({
    id: joi.number().required(),
})

const completeHabitSchema = joi.object({
    dayCompleted: joi.string().valid('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo').required(),
    difficulty: joi.number().max(5).min(1).required(),
})

const cancelHabitSchema = joi.object({
    cancelReason: joi.string().max(300).min(1).required(),
    focusPercent: joi.number().max(100).min(0),
    mentalHealthPercent: joi.number().max(100).min(0),
    difficulty: joi.number().min(1).max(5).required(),
})

module.exports = {
    createHabitSchema,
    updateHabitSchema,
    getHabitSchema,
    deleteHabitSchema,
    completeHabitSchema,
    cancelHabitSchema,
}