require('dotenv').config()

const config = {
    port: process.env.PORT,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT,
    dbUser: process.env.DB_USER,
    secretAccessToken: process.env.SECRET_ACCESS_TOKEN,
    secretRefreshToken: process.env.SECRET_REFRESH_TOKEN,
}

module.exports = config