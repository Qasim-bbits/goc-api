require('dotenv').config();

module.exports = Object.freeze({
    email: `${process.env.email}`,
    password: `${process.env.password}`,
    jwtKey: `${process.env.jwtKey}`,
    cryptoKey: `${process.env.cryptoKey}`,
    SECRET_KEY: `${process.env.SECRET_KEY}`,
    client_url:  `${process.env.client_url}`,
    http:  `${process.env.http}`,
    domain:  `${process.env.domain}`,
    carmenAPIKey: `${process.env.carmenAPIKey}`,
    API_URL: `${process.env.API_URL}`,
    COMPANY_NAME: `${process.env.COMPANY_NAME}`,
    FILE_URL: `${process.env.FILE_URL}`,
});