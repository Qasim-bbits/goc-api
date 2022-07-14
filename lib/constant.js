require('dotenv').config();

module.exports = Object.freeze({
    email: `${process.env.email}`,
    password: `${process.env.password}`,
    jwtKey: `${process.env.jwtKey}`,
    cryptoKey: `${process.env.cryptoKey}`,
    SECRET_KEY: `${process.env.SECRET_KEY}`,
});