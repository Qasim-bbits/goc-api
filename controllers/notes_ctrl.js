const { Notes } = require('../models/notes_model');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
var email_helper = require('../helpers/email_helper');
const CronJob = require('cron').CronJob;

let running = false;
let failureCount = 0;

const job = new CronJob('*/30 * * * * *', async function(){
    if (running) return;
    running = true;

    // await isParkAppLive();

    running = false;
})
job.start();

const isParkAppLive = async() => {
    try {
        const axios = require('axios');
        const response = await axios.post('https://parkapp.ca/api/getOrgBySubDomain', { role: 'root' }, { timeout: 5000 });
        console.log(failureCount)
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Bad status: ${response.status}`);
        }
        failureCount = 0;

        return { status: response.status };
    } catch (error) {
        failureCount++;
        console.log(failureCount, error.message)
        let emails = [
            'qasim@bbits.solutions',
            // 'hassan@bbits.solutions',
            // 'dev@bbits.solutions'
        ]
        if (failureCount >= 3) {
            await email_helper.send_raw_email('Parkapp is Down', emails, `Parkapp is not working, ${failureCount} times, error: ${error?.message}`);
        }
        return ({ status: 'API is not working' });
    }
}

module.exports.getNotes = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const notes = await Notes.find(body).populate('org').sort({ "note": 1 }).select('-__v');
    res.send(notes);
}

module.exports.addNote = function(req,res){
    req.body.note_num_next = (+req.body.note_num_min+ +1);
    const notes = new Notes(req.body);
    notes.save();
    res.send(notes);
}

module.exports.editNote = function(req,res){
    Notes.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(result =>{
        if(!result) {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });
        }
        res.send(result);
    })
}

module.exports.delNote = async function(req,res){
    const note = await Notes.deleteOne({_id : req.body.id}).select('-__v');
    res.send(note);
}

module.exports.getNotesByOrg = async function (req, res){
    const notes = await Notes.find({org: req.body.org_id}).populate('org').sort({ "note": 1 }).select('-__v');
    res.send(notes);
}

module.exports.getNotesByType = async function (req, res){
    const notes = await Notes.find({type: req.body.type, org: req.body.org_id}).populate('org').sort({ "note": 1 }).select('-__v');
    res.send(notes);
}

module.exports.checkParkAPP = async function (req, res) {
   res.send(await isParkAppLive());
}