const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routerApi = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler')

const createApp = () => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser())
    app.use(morgan('dev'))
    routerApi(app);
    app.use(errorHandler)

    app.get('/health-check', (req, res) => {
        res.json({ message: 'El servidor esta corriendo' })
    })

    return app
}

module.exports = createApp