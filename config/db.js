const { Pool } = require('pg')
const config = require('./config')
const ApiError = require('../utils/ApiError')

process.on('uncaughtException', (err) => {
    console.error('Hubo un error desconocido!', err)
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('Error en la aplicacion reason: ', reason)
    process.exit(1)
})

const pool = new Pool({
    host: config.dbHost,
    database: config.dbName,
    password: config.dbPassword,
    user: config.dbUser,
    port: config.dbPort,
})

const connectDb = async () => {
    try {
        await pool.connect()
        const res = await pool.query('SELECT $1::text as message', ['Base de datos conectada correctamente'])
        return res.rows[0].message
    } catch (err) {
        throw new ApiError('Error al conectar con la base de datos', 500)
    }
}

const createTables = async () => {
    try {
        const res = await pool.query(`
            CREATE TABLE IF NOT EXISTS Users(
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                streak INT NOT NULL DEFAULT 0,
                image_profile TEXT DEFAULT null
            );

            CREATE TABLE IF NOT EXISTS Auth(
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                recovery_token TEXT,
                user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                recovery_token_created TIMESTAMP,
                refresh_token TEXT
            );
        `)

        console.log('TABLAS CREADAS EXITOSAMENTE')
    } catch (err) {
        throw new ApiError('Error al crear las tablas de la db', 500)
    }
}

module.exports = { pool, connectDb, createTables }