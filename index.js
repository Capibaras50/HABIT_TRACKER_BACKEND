const express = require('express');
const config = require('./config/config')
const app = express();

app.use(express.json());

app.get('/health-check', (req, res) => {
    res.json({ message: 'El servidor esta corriendo' })
})

app.listen(config.port, () => {
    console.log(`El servidor esta corriendo en el puerto ${config.port}`)
});