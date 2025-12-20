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

const uploadImage = async (req, res, next) => {
    try {
        const linkImage = req.file.path
        const { userId } = req.user
        const response = await Service.uploadImage(userId, linkImage)
        return res.json(response)
    } catch (err) {
        console.error(err)
        next(err)
    }
}

const uploadProfile = async (req, res, next) => {
    try {
        const { userId } = req.user
        const data = req.body
        const response = await Service.changeUser(userId, data)
        return res.json(response)
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getProfile,
    uploadImage,
    uploadProfile,
}