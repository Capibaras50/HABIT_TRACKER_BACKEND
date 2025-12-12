const { pool } = require("../config/db")
const ApiError = require("../utils/ApiError")

class UserService {
    async getUser(id) {
        try {
            const result = await pool.query('SELECT * FROM Users WHERE id = $1', [id])
            const user = result.rows[0]

            if (!user) {
                throw new ApiError('The user dont exist', 404)
            }

            return user
        } catch (err) {
            throw new ApiError(err.message, err.statusCode)
        }
    }
}

module.exports = UserService