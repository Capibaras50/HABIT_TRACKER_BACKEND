const joi = require('joi')

const changeUserSchema = joi.object({
    name: joi.string().min(2),
})

module.exports = {
    changeUserSchema,
}