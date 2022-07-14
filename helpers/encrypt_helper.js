var jwt = require('jsonwebtoken');
var CryptoJS = require("crypto-js");
var constants = require('../lib/constant');
var constants = require('../lib/constant');

module.exports.jwt_encode = function(excryptedValue,expiresIn){
  var token = jwt.sign(excryptedValue, constants.jwtKey, { expiresIn: expiresIn });
  return token;
}

module.exports.jwt_decode = function(token){
  var decodedValue = jwt.verify(token, constants.jwtKey, function(err,decoded){
    if(err){
      err = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        expiredAt: 1408621000
      }
      return err;
    }else{
      return decoded;
    }
  });
  return decodedValue;
}

module.exports.crypto_encrypt = function(originalText){
  var ciphertext = CryptoJS.AES.encrypt(originalText, constants.cryptoKey).toString();
  return ciphertext;
}

module.exports.crypto_decrypt = function(ciphertext){
  var bytes  = CryptoJS.AES.decrypt(ciphertext, constants.cryptoKey);
  var originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}