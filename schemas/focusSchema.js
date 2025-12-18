const joi = require('joi')

const getFocusDaySchema = joi.object({
    date: joi.date().required(),
})

const createFocusDaySchema = joi.object({
    date: joi.date().required(),
    totalTime: joi.number().min(1).max(480).required(),
    productiveTime: joi.number().min(1).max(480).required(),
    distractionTime: joi.number().min(1).max(480).required(),
    totalSwitches: joi.number().min(0).required(),
    moodScore: joi.number().min(1).max(5).required(),
    notes: joi.string().max(300).optional(),
})

const getFocusRangeSchema = joi.object({
    startDate: joi.date().required(),
    endDate: joi.date().required(),
})

const getFocusSummarySchema = joi.object({
    today: joi.date().required(),
})

const getFocusAnalizeSchema = joi.object({
    startDate: joi.date().required(),
    endDate: joi.date().required()
})

module.exports = {
    getFocusDaySchema,
    createFocusDaySchema,
    getFocusRangeSchema,
    getFocusSummarySchema,
    getFocusAnalizeSchema,
}