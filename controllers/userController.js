const UserService = require('../services/userService')
const Service = new UserService()

const getProfile = async (req, res, next) => {
    try {
        const { userId } = req.user
        const user = await Service.getUser(userId)
        return res.json(user)
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getProfile,
}