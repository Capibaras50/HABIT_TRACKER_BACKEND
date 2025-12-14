const joi = require('joi')

const createHabitSchema = joi.object({
    name: joi.string().max(30).min(1).required(),
    importance: joi.string().valid('Alta', 'Media', 'Baja').required(),
    time: joi.number().max(480).required(),
    isInWeek: joi.bool().required(),
    days: joi.array().items(joi.string().valid('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')).required(),
    needDeepWork: joi.bool().required(),
    deepWorkWithScreen: joi.bool().required(),
})

const updateHabitSchema = joi.object({
    name: joi.string().max(30).min(1),
    importance: joi.string().valid('Alta', 'Media', 'Baja'),
    time: joi.number().max(480),
    isInWeek: joi.bool(),
    days: joi.array().items(joi.string().valid('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')),
    needDeepWork: joi.bool(),
    deepWorkWithScreen: joi.bool(),
})

const getHabitSchema = joi.object({
    id: joi.number().required(),
})

const deleteHabitSchema = joi.object({
    id: joi.number().required(),
})

module.exports = {
    createHabitSchema,
    updateHabitSchema,
    getHabitSchema,
    deleteHabitSchema,
}