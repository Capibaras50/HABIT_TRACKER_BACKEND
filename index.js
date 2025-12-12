const config = require('./config/config');
const createApp = require('./app');
const { connectDb, createTables } = require('./config/db');

(async () => {
    try {
        const res = await connectDb()
        await createTables()
        console.log(res)
    } catch (err) {
        console.error('Error al conectar con la base de datos', err)
    }
})();

const app = createApp();

app.listen(config.port, () => {
    console.log(`Aplicacion corriendo en el puerto ${config.port}`)
})