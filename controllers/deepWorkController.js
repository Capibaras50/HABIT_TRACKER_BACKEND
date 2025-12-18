const DeepWorkService = require('../services/deepWorkService')
const Service = new DeepWorkService()

const createDeepWork = async (req, res, next) => {
    try {
        const { userId } = req.user
        const { id } = req.params
        const createDeepWorkData = req.body
        const response = await Service.createDeepWork(userId, id, createDeepWorkData)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

module.exports = {
    createDeepWork,
}