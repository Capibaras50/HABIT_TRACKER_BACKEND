const errorHandler = (err, req, res, next) => {
    if (!err.statusCode || !err.message) {
        return res.status(500).json({ message: 'Internal Server Error' })
    }

    return res.status(err.statusCode).json({ message: err.message })
}

module.exports = errorHandler