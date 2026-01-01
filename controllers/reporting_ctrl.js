const { Parkings } = require('../models/parking_model');
var pdf = require("pdf-creator-node");
var fs = require("fs");
const moment = require('moment-timezone');
const { Ticket_Issued } = require('../models/ticket_issued_model');
var mongoose = require('mongoose');
const { Organizations } = require('../models/organizations_model');
const { Cities } = require('../models/city_model');
const { Zones } = require('../models/zone_model');
const { Users } = require('../models/users_model');
const { Rates } = require('../models/rate_model');
// moment.tz.setDefault("America/New_York");

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
        if(body[i].operator.key != 'time'){
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
    }
    if(orQuery.length > 0){
        query.push({$or: orQuery})
    }
    let find = {};
    if(query.length) find['$and'] = query
    let report = await Parkings.find(find).
    populate('city', 'city_name').
    populate('user', 'email').
    populate('zone', 'zone_name').
    populate('org', 'org_name');
    // console.log(report)
    const startTimeFilter = body.filter(x=> x.operator.key == 'time');
    if(startTimeFilter.length){
        let reportByTime = [];
        startTimeFilter.map((y, index)=> {
            if(y.condition == 'OR'){
                reportByTime = reportByTime.concat(report.filter(x => 
                    moment(x[y.key.key]).format("HH:mm") >= y.value && moment(x[y.key.key]).format("HH:mm") <= y.value2
                ));
            }else{
                reportByTime = report.filter(x => 
                    moment(x[y.key.key]).format("HH:mm") >= y.value && moment(x[y.key.key]).format("HH:mm") <= y.value2
                );
            }
        });
        report = reportByTime
        .filter(function({_id}) {
            return !this[_id] && (this[_id] = _id)
          }, {})
    }

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

module.exports.getParkingsScript = async function(req,res){
  try {
    let body = {}
    const organization = await Organizations.findOne({sub_domain : req.body.org}).select('-__v');
    if(!organization){
        return res.status(404).json({ success: false, msg: 'Organization not found' });
    }
    if(organization.sub_domain !== 'root'){
        body.org = mongoose.Types.ObjectId(organization._id);
    }
    delete req.body.org;
    let parkings = [];
    let query = { ...req.body, ...body };
    if(req.query.page){
        if(req.query.dateLessThan){
            const date = new Date(req.query.dateLessThan+'T00:00:00Z');
            query.from = { $lt: date };
        }
        parkings = await Parkings.find(query)
        .skip(req.query.page * req.query.pageSize)
        .limit(req.query.pageSize)
        .populate('city', 'city_name').
        populate('user', 'email').
        populate('zone', 'zone_name').
        populate('org', 'org_name')
        .lean();
    }else if(req.query.date){
        const date = new Date(req.query.date+'T00:00:00Z');
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        query.from = { $gte: date, $lt: nextDate };
        parkings = await Parkings.find(query)
        .populate('city', 'city_name').
        populate('user', 'email').
        populate('zone', 'zone_name').
        populate('org', 'org_name')
        .lean();
        
    }

    return res.json(parkings);
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.lookups = async function(req,res){
    try {
        const [orgs, cities, zones] = await Promise.all([
        Organizations.find({}, "_id org_name").sort({ org_name: 1 }),
        Cities.find({}, "_id city_name time_zone").sort({ city_name: 1 }),
        Zones.find({}, "_id zone_name").sort({ zone_name: 1 }),
        ]);
        res.json({ success: true, data: { orgs, cities, zones } });
    } catch (e) {
        console.error("Lookup error:", e);
        res.status(500).json({ success: false });
    }
}

module.exports.reports_v2 = async function(req,res){
  try {
    const { logic = "AND", groupByZone = false, cityId = null, filters = [] } = req.body;

    // resolve timezone from city if provided; default fallback
    let tz = "America/New_York";
    if (cityId) {
      const cityDoc = await Cities.findById(cityId).lean();
      if (cityDoc && cityDoc.time_zone) tz = cityDoc.time_zone;
    }

    // Build clause arrays
    const clauses = []; // each clause is a mongo query object
    // We'll also capture time-only clauses separately (they use $expr)
    let timeClausesExprs = []; // array of $and expressions for time comparisons
    let timeFieldsPresent = false;

    for (const f of filters) {
      if (!f || !f.key) continue;
      const key = f.key;
      const type = f.type || "string";
      const op = (f.operator || "").toLowerCase();
      const val = f.value;

      // Skip empty values
      if (val === undefined || val === null || val === "") continue;

      // Handle dropdown / objectId fields (org, city, zone)
      if (type === "dropdown") {
        if (op === "eq") clauses.push({ [key]: mongoose.Types.ObjectId(val) });
        else if (op === "ne") clauses.push({ [key]: { $ne: mongoose.Types.ObjectId(val) } });
        continue;
      }

      // Handle string
      if (type === "string") {
        if (op === "contains") clauses.push({ [key]: { $regex: val, $options: "i" } });
        else if (op === "notcontains") clauses.push({ [key]: { $not: { $regex: val, $options: "i" } } });
        else if (op === "eq") clauses.push({ [key]: val });
        else if (op === "ne") clauses.push({ [key]: { $ne: val } });
        continue;
      }

      // Handle number
      if (type === "number") {
        const num = Number(val);
        if (Number.isNaN(num)) continue;
        if (op === "gte" || op === "greater_or_equal") clauses.push({ [key]: { $gte: num } });
        else if (op === "lte" || op === "less_or_equal") clauses.push({ [key]: { $lte: num } });
        else if (op === "eq") clauses.push({ [key]: num });
        else if (op === "ne") clauses.push({ [key]: { $ne: num } });
        continue;
      }

      // Handle date filters (fromDate / toDate) — they compare date portion of parking 'from' or 'to'
      if (type === "date") {
        // key expected: 'fromDate' or 'toDate' (frontend uses these)
        // operator: eq (single day), gte, lte
        if (!val) continue;
        const dateMoment = moment.tz(val, tz);
        if (op === "eq") {
          const start = dateMoment.startOf("day").toDate();
          const end = dateMoment.endOf("day").toDate();
          if (key === "fromDate") clauses.push({ from: { $gte: start, $lte: end } });
          else if (key === "toDate") clauses.push({ to: { $gte: start, $lte: end } });
          else if (key === "transactionDate") clauses.push({ transaction_date: { $gte: start, $lte: end } });
        } else if (op === "gte") {
          const start = dateMoment.startOf("day").toDate();
          if (key === "fromDate") clauses.push({ from: { $gte: start } });
          else if (key === "toDate") clauses.push({ to: { $gte: start } });
          else if (key === "transactionDate") clauses.push({ transaction_date: { $gte: start } });
        } else if (op === "lte") {
          const end = dateMoment.endOf("day").toDate();
          if (key === "fromDate") clauses.push({ from: { $lte: end } });
          else if (key === "toDate") clauses.push({ to: { $lte: end } });
          else if (key === "transactionDate") clauses.push({ transaction_date: { $lte: end } });
        }
        continue;
      }

      // Handle time filters (fromTime / toTime) — compare HH:mm part of from/to.
      if (type === "time") {
        // val expected like "08:30"
        timeFieldsPresent = true;
        const [hStr, mStr] = (val || "").split(":");
        const hh = Number(hStr || "0");
        const mm = Number(mStr || "0");
        // Build time comparison expression using $expr and $dateToString or $hour/$minute
        // We'll push a sub-expression and combine later
        // For 'fromTime' we compare the time of "$from", for 'toTime' compare "$to"
        const targetField = key === "fromTime" ? "$from" : key === "transactionTime" ? "$transaction_date" : "$to";

        if (op === "eq") {
          // equality of hour and minute
          timeClausesExprs.push({
            $and: [
              { $eq: [{ $hour: { date: targetField, timezone: tz } }, hh] },
              { $eq: [{ $minute: { date: targetField, timezone: tz } }, mm] },
            ],
          });
        } else if (op === "gte") {
          // (hour > hh) OR (hour == hh AND minute >= mm)
          timeClausesExprs.push({
            $or: [
              { $gt: [{ $hour: { date: targetField, timezone: tz } }, hh] },
              {
                $and: [
                  { $eq: [{ $hour: { date: targetField, timezone: tz } }, hh] },
                  { $gte: [{ $minute: { date: targetField, timezone: tz } }, mm] },
                ],
              },
            ],
          });
        } else if (op === "lte") {
          // (hour < hh) OR (hour == hh AND minute <= mm)
          timeClausesExprs.push({
            $or: [
              { $lt: [{ $hour: { date: targetField, timezone: tz } }, hh] },
              {
                $and: [
                  { $eq: [{ $hour: { date: targetField, timezone: tz } }, hh] },
                  { $lte: [{ $minute: { date: targetField, timezone: tz } }, mm] },
                ],
              },
            ],
          });
        }
        continue;
      }

      // fallback
      clauses.push({ [key]: val });
    } // end for filters

    // Build final match object using logic
    let match = {};
    const topClauses = clauses.slice(); // copy

    // If timeClausesExprs exist, create a top-level $expr with $and of those exprs
    let exprClause = null;
    if (timeFieldsPresent && timeClausesExprs.length) {
      exprClause = { $expr: { $and: timeClausesExprs } };
    }

    if (topClauses.length && exprClause) {
      // combine expr clause and topClauses
      if (logic === "OR") match = { $or: [...topClauses, exprClause] };
      else match = { $and: [...topClauses, exprClause] };
    } else if (topClauses.length) {
      match = logic === "OR" ? { $or: topClauses } : { $and: topClauses };
    } else if (exprClause) {
      match = exprClause;
    } else {
      match = {}; // no filters -> match all
    }

    // Build aggregation pipeline with lookups to use org_name / city_name / zone_name
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "organizations",
          localField: "org",
          foreignField: "_id",
          as: "org",
        },
      },
      { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "city",
        },
      },
      { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "zones",
          localField: "zone",
          foreignField: "_id",
          as: "zone",
        },
      },
      { $unwind: { path: "$zone", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          parking_id: 1,
          plate: 1,
          amount: 1,
          service_fee: 1,
          transaction_date: 1,
          from: 1,
          to: 1,
          org_name: "$org.org_name",
          city_name: "$city.city_name",
          zone_name: "$zone.zone_name",
          city_time_zone: "$city.time_zone",
        },
      },
    ];

    if (groupByZone) {
      pipeline.push({
        $group: {
          _id: "$zone_name",
          totalParkings: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalServiceFee: {
            $sum: { $convert: { input: "$service_fee", to: "double", onError: 0, onNull: 0 } },
          },
          uniquePlates: { $addToSet: "$plate" },
        },
      });
      pipeline.push({
        $project: {
          _id: 0,
          zone_name: "$_id",
          totalParkings: 1,
          totalAmount: 1,
          totalServiceFee: 1,
          uniquePlatesCount: { $size: "$uniquePlates" },
        },
      });
      pipeline.push({ $sort: { totalParkings: -1 } });
    } else {
      pipeline.push({ $sort: { from: -1 } });
      // safety limit to avoid huge payloads (adjust as needed)
      pipeline.push({ $limit: 50000 });
    }

    const data = await Parkings.aggregate(pipeline);

    // Convert from/to to local timezone string for display if not grouped
    if (!groupByZone) {
      data.forEach((d) => {
        const rowTz = d.city_time_zone || tz || "America/New_York";
        if (d.from) d.from = moment(d.from).tz(rowTz).format("ll hh:mm a");
        if (d.to) d.to = moment(d.to).tz(rowTz).format("ll hh:mm a");
        if (d.transaction_date) d.transaction_date = moment(d.transaction_date).tz(rowTz).format("ll hh:mm a");
      });
    }

    // Summary totals
    let totals = {};
    if (groupByZone) {
      totals.totalParkings = data.reduce((s, r) => s + (r.totalParkings || 0), 0);
      totals.totalAmount = data.reduce((s, r) => s + (r.totalAmount || 0), 0);
      totals.totalServiceFee = data.reduce((s, r) => s + (r.totalServiceFee || 0), 0);
      totals.uniquePlates = data.reduce((s, r) => s + (r.uniquePlatesCount || 0), 0);
    } else {
      totals.totalParkings = data.length;
      totals.totalAmount = data.reduce((s, r) => s + (r.amount || 0), 0);
      totals.totalServiceFee = data.reduce((s, r) => s + (parseFloat(r.service_fee) || 0), 0);
      totals.uniquePlates = new Set(data.map((d) => d.plate)).size;
    }

    return res.json({ success: true, data, totals });
  } catch (err) {
    console.error("report.generate error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
