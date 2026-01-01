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

module.exports.compaign_upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callBack) => {
            callBack(null, 'uploads/compaigns/')
        },
        filename: (req, file, callBack) => {
            callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        }
    }) 
})

const storage = multer.memoryStorage();
module.exports.handleFormData = multer({ storage: storage });

module.exports.stringFormat = function(template, data) {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()]);
}