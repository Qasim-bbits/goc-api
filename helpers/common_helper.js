const multer  = require('multer');
const path = require('path');

module.exports.upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callBack) => {
            callBack(null, 'uploads/logo/')
        },
        filename: (req, file, callBack) => {
            callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        }
    }) 
})