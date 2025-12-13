const joi = require('joi')

const registerSchema = joi.object({
    name: joi.string().max(50).min(2).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
})

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
})

const recoverySchema = joi.object({
    email: joi.string().email().required(),
})

const changePasswordRecoverySchema = joi.object({
    code: joi.string().required(),
    newPassword: joi.string().min(8).required(),
})

const changePasswordSchema = joi.object({
    oldPassword: joi.string().min(8).required(),
    newPassword: joi.string().min(8).required(),
})

const changeEmailSchema = joi.object({
    email: joi.string().email(),
})

module.exports = {
    registerSchema,
    loginSchema,
    recoverySchema,
    changePasswordRecoverySchema,
    changePasswordSchema,
    changeEmailSchema,
}