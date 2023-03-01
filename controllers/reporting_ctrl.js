const { Parkings } = require('../models/parking_model');
var pdf = require("pdf-creator-node");
var fs = require("fs");
const moment = require('moment-timezone');
const { Ticket_Issued } = require('../models/ticket_issued_model');
moment.tz.setDefault("America/New_York");

module.exports.getAllKeys = async function (req, res){
    const keys = await Parkings.aggregate([
        {"$group":{"_id":null, "keys":{"$mergeObjects":"$$ROOT"}}},
        {"$project":{"keys": { "$map": { "input": { "$objectToArray": "$keys" }, "in": "$$this.k" } } } }
    ])
    res.send(keys)
}

module.exports.generateReport = async function (req, res){
    let body = req.body;
    if(req.body.length > 1){
        body[body.length - 1].condition = body[body.length - 2].condition;
    }
    let query = [];
    let orQuery = [];
    for(let i = 0; i < body.length; i++){
            // { service_fee : { "$not": /0/i } },

        if(body[i].key.key == 'plate'){
            body[i].value = body[i].value.toUpperCase().replace(/\s+/g, '')
        }
        if(body[i].condition == 'AND'){
            if(body[i].operator.key == '$not'){
                query.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                query.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
        else{
            if(body[i].operator.key == '$not'){
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
    }
    if(orQuery.length > 0){
        query.push({$or: orQuery})
    }
    const report = await Parkings.find({
        $and : query,
    }).
    populate('city', 'city_name').
    populate('user', 'email').
    populate('zone', 'zone_name').
    populate('org', 'org_name');
    let total = {amount: 0, service_fee: 0};
    if(report.length > 0){
        total.total_parkings = report.length
        total.total_plates = [...new Set(report.map(item => item.plate))].length
        total.service_fee = report.map(i=>i.service_fee).reduce((a,b)=>parseInt(a)+parseInt(b));
        total.amount = report.map(i=>i.amount).reduce((a,b)=>a+b);
    }
    res.send({report: report, total: total})
}

module.exports.exportPDF = async function (req, res){
    var html = fs.readFileSync("./views/parking_pdf.html", "utf8");
    var options = {
        format: "A3",
        orientation: "landscape",
        border: "10mm",
        // header: {
        //     height: "45mm",
        //     contents: '<div style="text-align: center;"><img src="https://bbits.solutions/cwp_api/uploads/logo/logo-1666642836487.jpeg"/></div>'
        // },
        footer: {
            height: "28mm",
            contents: {
                first: '© 2022 BBits Solutions Inc',
                2: 'Second page', // Any page number is working. 1-based index
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                last: 'Last Page'
            }
        }
    };
    let body = req.body;
    if(req.body.length > 1){
        body[body.length - 1].condition = body[body.length - 2].condition;
    }
    let query = [];
    let orQuery = [];
    for(let i = 0; i < body.length; i++){

        if(body[i].key.key == 'plate'){
            body[i].value = body[i].value.toUpperCase().replace(/\s+/g, '')
        }
        if(body[i].condition == 'AND'){
            if(body[i].operator.key == '$not'){
                query.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                query.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
        else{
            if(body[i].operator.key == '$not'){
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
    }
    if(orQuery.length > 0){
        query.push({$or: orQuery})
    }
    var report = await Parkings.find({
        $and : query,
    }).
    populate('city', 'city_name').
    populate('user', 'email').
    populate('zone', 'zone_name').
    populate('org', 'org_name').lean();
    let total = {amount: '$ 0.00', service_fee: '$ 0.00'};
    if(report.length > 0){
        total.amount = '$ ' + (report.map(i=>i.amount).reduce((a,b)=>a+b)/100).toFixed(2);
        total.service_fee = '$ ' + (report.map(i=>i.service_fee).reduce((a,b)=>parseInt(a)+parseInt(b))/100).toFixed(2);
    }
    report = report.map(function(x){
        return {
            ...x,
            amount: '$' + (x.amount/100).toFixed(2),
            service_fee: '$' + (x.service_fee/100).toFixed(2),
            from: moment(x.from).format('lll'),
            to: moment(x.to).format('lll')
        };
      }); 
    if(report.length > 0){
        var document = {
            html: html,
            data: {
                report: report,
                total: total
            },
            path: "./pdf/parking-report-.pdf",
            type: "",
        };
        pdf.create(document, options)
        .then((response) => {
            res.send(response);
        })
        .catch((error) => {
            console.error(error);
        });
    }
      
}

module.exports.generateTicketIssuedReport = async function (req, res){
    let body = req.body;
    if(req.body.length > 1){
        body[body.length - 1].condition = body[body.length - 2].condition;
    }
    let query = [];
    let orQuery = [];
    for(let i = 0; i < body.length; i++){
        if(body[i].key.key == 'plate'){
            body[i].value = body[i].value.toUpperCase().replace(/\s+/g, '')
        }
        if(body[i].condition == 'AND'){
            if(body[i].operator.key == '$not'){
                query.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                query.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
        else{
            if(body[i].operator.key == '$not'){
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: new RegExp(body[i].value,"i")}})
            }else{
                orQuery.push({[body[i].key.key]: {[body[i].operator.key]: body[i].value._id || body[i].value}})
            }
        }
    }
    if(orQuery.length > 0){
        query.push({$or: orQuery})
    }
    const report = await Ticket_Issued.find({
        $and : query,
    }).
    populate('city', 'city_name').
    populate('issued_by', 'email').
    populate('ticket', 'ticket_name').
    populate('zone', 'zone_name').
    populate('org', 'org_name').lean();
    let total = {total_tickets_issued: 0, total_tickets_paid: 0, total_tickets_unpaid: 0, amount: 0};
    if(report.length > 0){
        let filtered = report.filter(x=>x.amount != undefined);
        total.total_tickets_issued = report.length
        total.total_tickets_paid = (report.filter(x=>x.ticket_status == 'paid')).length
        total.total_tickets_unpaid = (report.filter(x=>x.ticket_status == 'unpaid')).length
        total.amount = (filtered.length > 0) ? (filtered.map(i=>i.amount).reduce((a,b)=>a+b)/100).toFixed(2) : 0;
    }
    res.send({report: report, total: total})
}
