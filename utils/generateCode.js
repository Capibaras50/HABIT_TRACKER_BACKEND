const crypto = require('node:crypto')

const generateCode = () => {
    return crypto.randomBytes(32).toString('hex')
}

module.exports = generateCode