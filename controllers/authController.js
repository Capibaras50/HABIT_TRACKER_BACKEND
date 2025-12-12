const AuthService = require('../services/authService')
const Service = new AuthService()

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        const response = await Service.login(email, password)

        res.cookie('access_token', response.accessToken, {
            expire: 3600000,
            httpOnly: true,
            secure: false, //true si estamos en prod
            sameSite: 'strict',
        })

        res.cookie('refresh_token', response.refreshToken, {
            expire: 604800000,
            httpOnly: true,
            secure: false, //true si estamos en prod
            sameSite: 'strict',
        })

        return res.json({ user: response.user })
    } catch (err) {
        next(err)
    }
}

const register = async (req, res, next) => {
    try {
        const userData = req.body
        const response = await Service.createUser(userData)
        return res.status(201).json(response)
    } catch (err) {
        next(err)
    }
}

const refreshToken = async (req, res, next) => {
    try {
        const { refresh_token } = req.cookies
        const { accessToken, newRefreshToken } = await Service.refresh(refresh_token)
        res.cookie('access_token', accessToken, {
            expire: 3600000,
            httpOnly: true,
            secure: false, //true si estamos en prod
            sameSite: 'strict',
        })

        res.cookie('refresh_token', newRefreshToken, {
            expire: 604800000,
            httpOnly: true,
            secure: false, //true si estamos en prod
            sameSite: 'strict',
        })

        return res.json({ message: 'Operacion exitosa', accessToken })
    } catch (err) {
        next(err)
    }
}

const logout = async (req, res, next) => {
    try {
        const { userId } = req.user
        const response = await Service.logout(userId)
        return res.clearCookie('access_token').clearCookie('refresh_token').json(response)
    } catch (err) {
        next(err)
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout,
}