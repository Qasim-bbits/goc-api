const { EmailTemplates } = require('../models/email_template_model');
const { Users } = require('../models/users_model');
const { stringFormat } = require('../helpers/common_helper');
const constant = require('../lib/constant');
const email_helper = require('../helpers/email_helper');
const mongoose = require('mongoose');

module.exports.getEmailTemplates = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const templates = await EmailTemplates.find(body).sort( { "template_name": 1 } ).select('-__v').populate('org');
    res.send(templates);
}

module.exports.editEmailTemplate = async function (req, res){
    const templateExist = await EmailTemplates.findOne({template_name: req.body.template_name, org: req.body.org}).lean();
    if(templateExist && templateExist._id.toString() !== req.body.id) {
        return res.json({
            msg: "Email template with this name already exists",
            status: 'error'
        });
    }
    EmailTemplates.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });
        }
        res.json(response);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.body._id
        });
    });
}

module.exports.addEmailTemplate = async function(req,res){
    const templateExist = await EmailTemplates.findOne({template_name: req.body.template_name, org: req.body.org}).lean();
    console.log(templateExist)
    if(templateExist) {
        return res.json({
            msg: "Email template with this name already exists",
            status: 'error'
        });
    }
    const templates = new EmailTemplates(req.body);
    templates.save();
    res.send(templates);
}

module.exports.delEmailTemplate = async function (req, res){
    const templates = await EmailTemplates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(templates);
}

module.exports.testEmailTemplate = async function (req, res){
    const template = await EmailTemplates.findOne(req.body).select('-__v').populate('org');
    if(template) {
        let emailBody = {};
        if(template.org.sub_domain == 'root'){
            emailBody.path = constant.client_url;
        }else{
            emailBody.path = constant.http + template.org.sub_domain + '.' +constant.domain;
        }
        emailBody.logo = template.org.logo;
        emailBody.color = template.org.color;
        emailBody.sendingEmail = constant.email;
        emailBody.orgName = template.org.org_name;
        emailBody.API_URL = constant.API_URL;
        emailBody.COMPANY_NAME = constant.COMPANY_NAME;
        emailBody.content = stringFormat(template.template, {orgName: "teste", verifyLink: "Test Zone"});
        email_helper.send_email('Confirmation Email','./views/email_template.ejs','qasim@bbits.solutions',emailBody);
        res.send(emailBody);
    }else {
        res.status(404).json({
            msg: "Email template not found"
        });
    }
}