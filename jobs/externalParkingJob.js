// jobs/externalParkingJob.js
const axios = require("axios");
const { parseString } = require("xml2js");
const moment = require("moment");
const { Parkings } = require('../models/parking_model');
const { Organizations } = require('../models/organizations_model');
const { Zones } = require('../models/zone_model');
const email_helper = require("../helpers/email_helper");
const constant = require('../lib/constant');
const { ExternalParkingConfig } = require("../models/external_parking_config_model");
const calculateHash = require('../helpers/calculate_hash');

module.exports = (agenda) => {
    agenda.define("retry-external-parking", async (job, done) => {
        const { parkingId, attempt } = job.attrs.data;

        try {
            const parking = await Parkings.findById(parkingId);
            if (!parking) return done(new Error("Parking not found"));

            await Parkings.findByIdAndUpdate(parkingId, {
                externalize_status: "processing"
            });
            const externalParkingConfig = await ExternalParkingConfig.findOne({ zone: parking.zone }).select("-__v");
            const from = moment(parking.from);
            const to = moment(parking.to);
            const minutes = moment.duration(to.diff(from)).asMinutes();

            let ipark_in = {
                ins_id: externalParkingConfig.blinkay_ins_id,
                grp_id: externalParkingConfig.blinkay_group_id,
                tar_id: externalParkingConfig.blinkay_tariff_id,
                lic_pla: parking.plate,
                pur_date: moment(from).format("HHmmssDDMMYYYY"),
                ini_date: moment(from).format("HHmmssDDMMYYYY"),
                end_date: moment(to).format("HHmmssDDMMYYYY"),
                amou_payed: parseFloat(parking.amount),
                time_payed: minutes,
                oper_id: "CWP_APP",
                ext_acc: "VPP",
                term_id: "",
                ver: "1.0",
                prov: "CWP_APP",
                ah: ""
            };

            ipark_in.ah = calculateHash.ah(ipark_in);

            const body = "jsonIn=" + JSON.stringify({ ipark_in });
            const header = {
                Authorization: "Basic " + Buffer.from("integraTariffs:vuf`spnZlX").toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            };
            const response = await axios.post(
                "https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/InsertExternalParkingOperationInstallationTimeJSON",
                body,
                { headers: header, timeout: 15000 }
            );

            let jsonResult;
            parseString(response.data, (err, parsed) => {
                if (err) throw err;
                jsonResult = JSON.parse(parsed.string._);
            });

            const externalReq = JSON.stringify({ payload: body, response: jsonResult.ipark_out });
            console.log("External Parking Response:", jsonResult.ipark_out);
            if (jsonResult.ipark_out.r == 1) {
                // ✅ Success
                await Parkings.findByIdAndUpdate(parkingId, {
                    is_externalized: true,
                    operation_id: jsonResult.ipark_out.oper_id,
                    external_request: externalReq,
                    retry_count: attempt,
                    externalize_status: "success",
                    externalize_success_at: new Date()
                });
            } else {
                // ❌ Retry or fail
                await handleRetryOrFail(parking, attempt, body, header, externalReq, agenda);
            }
        } catch (error) {
            const externalReq = JSON.stringify({ payload: body, response: String(error) });
            await handleRetryOrFail({ _id: parkingId }, attempt, body, header, externalReq, agenda);
        }

        done();
    });
};

async function handleRetryOrFail(parking, attempt, body, header, externalReq, agenda) {
    if (attempt < 3) {
        // schedule retry
        await Parkings.findByIdAndUpdate(parking._id, {
            retry_count: attempt,
            external_request: externalReq,
            externalize_status: "processing"
        });
        await agenda.schedule("in 1 minutes", "retry-external-parking", {
            parkingId: parking._id,
            attempt: attempt + 1
        });
    } else {
        // mark as failed and notify
        await Parkings.findByIdAndUpdate(parking._id, {
            external_request: externalReq,
            retry_count: attempt,
            externalize_status: "failed",
            externalize_failed_at: new Date()
        });
        await sendFailureEmail(parking._id);
    }
}

async function sendFailureEmail(parkingId) {
    try {
        const parking = await Parkings.findById(parkingId);
        const org = await Organizations.findById(parking.org).select("-ticket_format");
        const zone = await Zones.findById(parking.zone).select("zone_name");

        let emailBody = { org_name: org.org_name };
        emailBody.path = org.sub_domain === "root" ? constant.client_url : `${constant.http}${org.sub_domain}.${constant.domain}`;
        emailBody.exteranlzeUrl = `${emailBody.path}?returnURL=/suite/parkings/${parking._id}`;
        emailBody.logo = org.logo;
        emailBody.color = org.color;
        emailBody.content = `We encountered an error related to the Blinkay Insertion process for ${parking.plate} from ${moment(parking.from).format("MMMM Do YYYY, hh:mm a")} to ${moment(parking.to).format("MMMM Do YYYY, hh:mm a")} in zone ${zone.zone_name}.`;

        if (org.owner_email) {
            email_helper.send_email("Blinkay Insertion Failed", "./views/exteranlize_parking_failed.ejs", org.owner_email, emailBody);
        }
    } catch (err) {
        console.error("Email failure:", err);
    }
}
