const { v2: cloudinary } = require('cloudinary')
const { cloudName, cloudApiKey, cloudApiSecret } = require('./config')

cloudinary.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
})

module.exports = cloudinary