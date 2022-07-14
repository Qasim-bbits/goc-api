const encrypt_helper = require("./encrypt_helper");


module.exports.authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
      return res.send({status: 403, msg: 'Unauthorized, Please login again'});
    }
    try {
        const data = encrypt_helper.jwt_decode(token);
        if(data.expiredAt == undefined){
            req.userId = data.id;
            req.userRole = data.role;
            return next();
        }else{
            return res.send({status: 403, msg: 'Unauthorized, Please login again'});
        }
    } catch {
        return res.send({status: 403, msg: 'Unauthorized, Please login again'});
    }
  };