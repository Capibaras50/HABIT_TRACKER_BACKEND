const joi = require('joi')

const distractionAppSchema = joi.object({
    time: joi.number().integer().min(1).required(),
    switches: joi.number().integer().min(0).required(),
    urls: joi.array().items(joi.string().domain()).optional()
})

const deepWorkSchema = joi.object({
    startTime: joi.date().required(),
    endTime: joi.date().required(),
    estimatedTime: joi.number().min(1).max(480).required(),
    cancelled: joi.bool().required(),
    reasonCancelled: joi.string().allow(null).max(300).required(),
    difficulty: joi.number().min(1).max(5).required(),
    productiveTime: joi.number().min(1).max(480).required(),
    distractions: joi.object({
        apps: joi.object().pattern(joi.string().min(1), distractionAppSchema).min(1).required(),   // nombre dinámico de la app
        totalDistractionTime: joi.number().integer().min(1).required(),
        totalSwitches: joi.number().integer().min(0).required()
    }).required(),
})

module.exports = {
    deepWorkSchema,
}