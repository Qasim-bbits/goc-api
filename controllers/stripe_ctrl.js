const { crypto_decrypt } = require('../helpers/encrypt_helper');
const { Organizations } = require('../models/organizations_model');

module.exports.secret_token = async function (req, res) {
    const stripe = require('stripe')('sk_test_51JDF8yFMPgCzegFZzZpTNnD7X1ascJ7Qplw1WmBzcQd7WnBeAmGrprELPNGzHp2FHdtlFpOeozE2e4YkgVCMzEQR00mDBiaCGU');
    const token = await stripe.terminal.connectionTokens.create();
    res.json({ secret: token.secret });
}

module.exports.payment_intent = async function (req, res) {
    const stripe = require('stripe')('sk_test_51JDF8yFMPgCzegFZzZpTNnD7X1ascJ7Qplw1WmBzcQd7WnBeAmGrprELPNGzHp2FHdtlFpOeozE2e4YkgVCMzEQR00mDBiaCGU');
    const paymentIntent = await stripe.paymentIntents.create({
        amount: parseFloat(req.body.amount),
        currency: 'cad',
        payment_method_types: ['card_present'],
        capture_method: 'manual'
    });
    res.send(paymentIntent);
}

module.exports.connection_token = async function (req, res) {
    const org = await Organizations.findOne({ _id: req.body.org_id }).select('-__v');
    let secret_key = crypto_decrypt(org.stripe_secret_key);
    const stripe = require("stripe")(secret_key);
    let connectionToken = await stripe.terminal.connectionTokens.create();
    res.json({ secret: connectionToken.secret });
}

module.exports.create_payment_intent = async function (req, res) {
    const org = await Organizations.findOne({ _id: req.body.org_id }).select('-__v');
    let secret_key = crypto_decrypt(org.stripe_secret_key);
    const stripe = require("stripe")(secret_key);
    const intent = await stripe.paymentIntents.create({
        payment_method_types: req.body.payment_method_types || ['card_present'],
        capture_method: req.body.capture_method || 'manual',
        amount: req.body.amount,
        currency: req.body.currency || 'cad',
        description: req.body.description || 'Example PaymentIntent',
        payment_method_options: req.body.payment_method_options || [],
        receipt_email: req.body.receipt_email,
    });
    res.json(intent);
}

module.exports.capture_payment_intent = async function (req, res) {
    try {
        const org = await Organizations.findOne({ _id: req.body.org_id }).select('-__v');
        let secret_key = crypto_decrypt(org.stripe_secret_key);
        const stripe = require("stripe")(secret_key);
        const id = req.body.payment_intent_id;
        let payment_intent;

        if (req.body.amount_to_capture) {
            payment_intent = await stripe.paymentIntents.capture(id, {
                amount_to_capture: req.body.amount_to_capture
            });
        } else {
            payment_intent = await stripe.paymentIntents.capture(id);
        }

        console.log(`PaymentIntent successfully captured: ${id}`);
        // Optionally reconcile the PaymentIntent with your internal order system.

        res.status(200).json({
            intent: payment_intent.id,
            secret: payment_intent.client_secret
        });
    } catch (error) {
        console.error(`Error capturing PaymentIntent! ${error.message}`);
        res.status(402).json({
            error: `Error capturing PaymentIntent! ${error.message}`
        });
    }
}

module.exports.create_location = async function (req, res) {
    try {
        const org = await Organizations.findOne({ _id: req.body.org_id }).select('-__v');
        let secret_key = crypto_decrypt(org.stripe_secret_key);
        const stripe = require("stripe")(secret_key);
        const location = await stripe.terminal.locations.create({
            display_name: req.body.display_name,
            address: req.body.address
        });

        console.log(`Location successfully created: ${location.id}`);
        res.status(200).json(location);
    } catch (error) {
        console.error(`Error creating Location! ${error.message}`);
        res.status(402).json({
            error: `Error creating Location! ${error.message}`
        });
    }
}

module.exports.list_locations = async function (req, res) {
    try {
        const org = await Organizations.findOne({ _id: req.body.org_id }).select('-__v');
        let secret_key = crypto_decrypt(org.stripe_secret_key);
        const stripe = require("stripe")(secret_key);
        const locations = await stripe.terminal.locations.list({
            limit: 100
        });

        console.log(`${locations.data.length} Locations successfully fetched`);
        res.status(200).json(locations.data);
    } catch (error) {
        console.error(`Error fetching Locations! ${error.message}`);
        res.status(402).json({
            error: `Error fetching Locations! ${error.message}`
        });
    }
}