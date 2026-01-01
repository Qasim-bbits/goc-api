const encrypt_helper = require("./encrypt_helper");


module.exports.authorization = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({status: 401, msg: 'Unauthorized, Please login again'});
    }
    try {
        const data = encrypt_helper.jwt_decode(token);
        if(data.expiredAt == undefined){
            req.userId = data.id;
            req.userRole = data.role;
            return next();
        }else{
            return res.status(401).send({status: 401, msg: 'Unauthorized, Please login again'});
        }
    } catch {
        return res.status(401).send({status: 401, msg: 'Unauthorized, Please login again'});
    }
  };