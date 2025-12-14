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
        // CREATE TYPE habit_importance AS ENUM('Alta', 'Media', 'Baja');
        // CREATE TYPE days_week AS ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo');
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

            CREATE TABLE IF NOT EXISTS Habits(
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                importance habit_importance NOT NULL,
                days JSONB NOT NULL,
                time INT NOT NULL,
                is_in_week BOOL NOT NULL,
                user_id INT NOT NULL,
                habit_created TIMESTAMP DEFAULT NOW(),
                need_deep_work BOOL NOT NULL,
                deep_work_with_screen BOOL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Habits_Completed(
                id SERIAL PRIMARY KEY,
                habit_id INT NOT NULL REFERENCES Habits(id) ON DELETE CASCADE,
                date_completed TIMESTAMP NOT NULL DEFAULT NOW(),
                day_completed days_week NOT NULL,
                difficulty INT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Habits_Cancelled(
                id SERIAL PRIMARY KEY,
                habit_id INT NOT NULL REFERENCES Habits(id) ON DELETE CASCADE,
                date_cancelled TIMESTAMP NOT NULL DEFAULT NOW(),
                cancel_reason TEXT NOT NULL,
                focus_percent INT,
                mental_health_percent INT,
                difficulty INT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Deep_Work(
                id SERIAL PRIMARY KEY,
                habit_id INT REFERENCES Habits(id) ON DELETE CASCADE,
                user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                time INT NOT NULL,
                quality_percent INT NOT NULL,
                cancelled BOOL NOT NULL,
                reason_cancelled TEXT,
                difficulty INT NOT NULL
            );
        `)

        console.log('TABLAS CREADAS EXITOSAMENTE')
    } catch (err) {
        console.error(err)
        throw new ApiError('Error al crear las tablas de la db', 500)
    }
}

module.exports = { pool, connectDb, createTables }