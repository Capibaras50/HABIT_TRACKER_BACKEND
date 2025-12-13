const ApiError = require('../utils/ApiError')

const schemaHandler = (schema, property) => {
    return (req, res, next) => {
        const data = req[property]
        if (!data) {
            throw new ApiError('No se encontro informacion', 400)
        }
        const { error } = schema.validate(data)
        if (error) {
            throw new ApiError(error, 400)
        }
        next()
    }
}

module.exports = schemaHandler