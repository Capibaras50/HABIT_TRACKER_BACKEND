const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const ApiError = require('../utils/ApiError')
const { pool } = require('../config/db')
const { secretAccessToken, secretRefreshToken, emailEnterprise, passwordEmailEnterprise, hostEmailEnterprise, environment } = require('../config/config')
const generateCode = require('../utils/generateCode')
const UserService = require('./userService')
const userService = new UserService()

class AuthService {
    async createUser(userData) {
        try {
            const result = await pool.query('SELECT * FROM Auth WHERE email = $1', [userData.email])
            const userEmail = result.rows[0]
            if (userEmail) {
                throw new ApiError('The user already exists', 400)
            }
            const hashPassword = await bcrypt.hash(userData.password, 10)
            const resultUser = await pool.query('INSERT INTO Users (name) VALUES ($1) RETURNING id', [userData.name])
            const user = {
                name: userData.name,
                email: userData.email,
                password: hashPassword,
                userId: resultUser.rows[0].id
            }
            const resultAuth = await pool.query('INSERT INTO Auth (email, password, user_id) VALUES ($1, $2, $3)', [user.email, user.password, user.userId])
            return { message: 'User created successfully' }
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }

    async login(email, password) {
        try {
            const result = await pool.query('SELECT * FROM Auth INNER JOIN Users ON Users.id = Auth.user_id WHERE Auth.email = $1', [email])
            const user = result.rows[0]
            if (!user) {
                throw new ApiError('The credentials are incorrect', 401)
            }
            const { password: userPassword, recovery_token, recovery_token_created, refresh_token, ...userShow } = user
            const isMatch = await bcrypt.compare(password, userPassword)
            if (!isMatch) {
                throw new ApiError('Error logging in', 401)
            }
            const payload = {
                userId: user.user_id,
                email: user.email,
                name: user.name
            }
            const accessToken = jwt.sign(payload, secretAccessToken, { expiresIn: '1h' })
            const refreshToken = jwt.sign(payload, secretRefreshToken, { expiresIn: '7d' })
            await pool.query('UPDATE Auth SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id])
            return { accessToken, refreshToken, user: userShow }
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }

    async refresh(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, secretRefreshToken)
        } catch (err) {
            throw new ApiError('Jwt ha expirado o no funciona', 401)
        }

        const user = await pool.query('SELECT * FROM Auth INNER JOIN Users ON Users.id = Auth.user_id WHERE Auth.refresh_token = $1', [refreshToken])
        const foundUser = user.rows[0]
        if (!foundUser) {
            throw new ApiError('El usuario no esta autenticado', 401)
        }
        const accessToken = jwt.sign({ id: foundUser.user_id, email: foundUser.email, name: user.name }, secretAccessToken, { expiresIn: '1h' })
        const newRefreshToken = jwt.sign({ id: foundUser.user_id, email: foundUser.email, name: user.name }, secretRefreshToken, { expiresIn: '7d' })
        await pool.query('UPDATE Auth SET refresh_token = $1 WHERE id = $2', [newRefreshToken, foundUser.user_id])
        return { accessToken, newRefreshToken }
    }

    async logout(userId) {
        const resultUser = await pool.query('SELECT * FROM Users WHERE id = $1', [userId])
        if (!resultUser.rows[0]) {
            throw new ApiError('El usuario no existe', 403)
        }
        const result = await pool.query('UPDATE Auth SET refresh_token = null WHERE user_id = $1', [userId])
        return { message: 'logout successfully' }
    }

    async recovery(email) {
        const now = new Date()
        const codeExpiration = new Date(now.getTime())
        const minutosActuales = now.getUTCMinutes()
        codeExpiration.setUTCMinutes(minutosActuales + 15)
        const resultUser = await pool.query('SELECT * FROM Auth WHERE email = $1', [email])
        if (resultUser.rowCount === 0) {
            throw new ApiError('El usuario no existe', 403)
        }
        const code = generateCode()
        await pool.query('UPDATE Auth SET recovery_token = $1, recovery_token_created = $2 WHERE email = $3', [code, codeExpiration, email])
        const link = environment === 'development' ? `http://localhost:3000/api/v1/change-password?token=${code}` : `http://localhost:3000/api/v1/change-password?token=${code}`
        const html = `<!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Recuperar contraseña</title>
                        <style>
                            body {
                                font-family: Arial, Helvetica, sans-serif;
                                background-color: #f5f5f5;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                background: #ffffff;
                                max-width: 500px;
                                margin: 40px auto;
                                border-radius: 8px;
                                padding: 30px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            }
                            h2 {
                                color: #333;
                                margin-bottom: 15px;
                            }
                            p {
                                color: #555;
                                font-size: 15px;
                                line-height: 1.5;
                            }
                            .btn {
                                display: inline-block;
                                padding: 12px 20px;
                                background-color: #4CAF50;
                                color: white !important;
                                text-decoration: none;
                                font-size: 16px;
                                border-radius: 6px;
                                margin-top: 20px;
                            }
                            .footer {
                                font-size: 13px;
                                color: #777;
                                margin-top: 25px;
                                text-align: center;
                            }
                            .code-box {
                                background: #f0f0f0;
                                padding: 12px;
                                border-radius: 6px;
                                font-size: 18px;
                                font-weight: bold;
                                letter-spacing: 2px;
                                text-align: center;
                                margin: 20px 0;
                            }
                        </style>
                    </head>
                    <body>

                        <div class="container">
                            <h2>Recuperación de contraseña</h2>

                            <p>Hola,</p>

                            <p>
                                Hemos recibido una solicitud para restablecer tu contraseña.  
                                Si no fuiste tú, puedes ignorar este mensaje.
                            </p>

                            <p>
                                Para continuar, haz clic en el siguiente botón:
                            </p>

                            <a href="${link}" class="btn">Restablecer contraseña</a>

                            <p>O copia y pega este enlace en tu navegador:</p>

                            <div class="code-box">
                                ${link}
                            </div>

                            <p class="footer">
                                Este enlace vencerá en <strong>15 minutos</strong>.
                            </p>
                        </div>

                    </body>
                    </html>
        `
        await this.sendMail(email, html, 'Recuperacion de contrasena: Habit Tracker', emailEnterprise, passwordEmailEnterprise, hostEmailEnterprise)
        return { message: 'El mensaje fue enviado con exito' }
    }

    async sendMail(toEmail, body, subject, fromEmail, passwordEmail, hostEmail) {
        const transporter = nodemailer.createTransport({
            host: hostEmail,
            port: 587,
            secure: false,
            auth: {
                user: fromEmail,
                pass: passwordEmail
            }
        })

        const info = await transporter.sendMail({ sender: fromEmail, to: toEmail, subject: subject, html: body })
        return { message: 'Mensaje enviado', messageId: info.messageId }
    }

    async changePasswordRecovery(code, newPassword) {
        const resultUser = await pool.query('SELECT * FROM Auth WHERE recovery_token = $1 AND recovery_token_created < NOW()', [code])
        if (resultUser.rowCount === 0) {
            throw new ApiError('No se pudo cambiar la contrasena', 400)
        }
        const hashPassword = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE Auth SET password = $1, recovery_token = null, recovery_token_created = null WHERE recovery_token = $2', [hashPassword, code])
        return { message: 'La contrasena fue modificada correctamente' }
    }

    async changePassword(userId, oldPassword, newPassword) {
        const resultUser = await pool.query('SELECT * FROM Auth WHERE user_id = $1', [userId])
        if (resultUser.rowCount === 0) {
            throw new ApiError('El usuario no existe', 403)
        }
        const user = resultUser.rows[0]
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) {
            throw new ApiError('Las credenciales no son validas', 400)
        }
        const hashPassword = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE Auth SET password = $1 WHERE user_id = $2', [hashPassword, userId])
        return { message: 'La contrasena fue modificada correctamente' }
    }

    async changeEmail(userId, email) {
        await userService.getUser(userId)
        await pool.query('UPDATE Auth SET email = $1 WHERE user_id = $2', [email, userId])
        await this.logout(userId)
        return { message: 'Se actualizo el correo exitosamente, por favor vuelva a logearse' }
    }
}

module.exports = AuthService