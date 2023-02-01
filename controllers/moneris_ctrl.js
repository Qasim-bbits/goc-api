const axios = require('axios');
const { crypto_decrypt } = require('../helpers/encrypt_helper');
const { Organizations } = require('../models/organizations_model');

module.exports.generateToken = async function (req, res){
    const org = await Organizations.findOne({_id : req.body.org_id}).select('-__v');
    org.moneris_store_id = crypto_decrypt(org.moneris_store_id);
    org.moneris_api_token = crypto_decrypt(org.moneris_api_token);
    org.moneris_checkout_id = crypto_decrypt(org.moneris_checkout_id);
    try{
        let body = {
            store_id : org.moneris_store_id,
            api_token : org.moneris_api_token,
            checkout_id : org.moneris_checkout_id,
            environment : (org.payment_envoirnment === 'test') ? 'qa' : 'prod',
            txn_total : req.body.amount,
            action : "preload",
        }
        const moneris_url = org.payment_envoirnment === 'test' ? 
                "https://gatewayt.moneris.com/chkt/request/request.php" :
                "https://gateway.moneris.com/chkt/request/request.php";
                console.log(body,moneris_url)
        const ticket = await axios.post(moneris_url, body)
        res.send(ticket.data.response);
    }catch (e) {
        res.send(e)
    }
}

module.exports.monerisReceipt = async function (req, res){
    const org = await Organizations.findOne({_id : req.body.org_id}).select('-__v');
    org.moneris_store_id = crypto_decrypt(org.moneris_store_id);
    org.moneris_api_token = crypto_decrypt(org.moneris_api_token);
    org.moneris_checkout_id = crypto_decrypt(org.moneris_checkout_id);
    try{
        let body = {
            store_id : org.moneris_store_id,
            api_token : org.moneris_api_token,
            checkout_id : org.moneris_checkout_id,
            environment : (org.payment_envoirnment === 'test') ? 'qa' : 'prod',
            ticket: req.body.ticket,
            action : "receipt",
        }
        const moneris_url = org.payment_envoirnment === 'test' ? 
                "https://gatewayt.moneris.com/chkt/request/request.php" :       // Production
                "https://gateway.moneris.com/chkt/request/request.php";         // Testing
        const ticket = await axios.post(moneris_url, body);
        res.send(ticket.data.response);
    }catch (e) {
        res.send(e)
    }
}