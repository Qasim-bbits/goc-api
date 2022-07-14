const { Organizations } = require('../models/organizations_model');

module.exports.getOrganizations = async function (req, res){
    const organizations = await Organizations.find().select('-__v');
    res.send(organizations);
}

module.exports.addOrganizations = function(req,res){
    req.body.header_logo = req.files.header_logo[0].path;
    req.body.footer_logo = req.files.footer_logo[0].path;
    req.body.receipt_logo = req.files.footer_logo[0].path;
    req.body.url = req.get('origin') + '/signup/organization/' + req.body.name.replace(/\s+/g, '-');
    const organizations = new Organizations(req.body);
    organizations.save();
    res.send(organizations);
}