var express = require('express');
var Routes = express.Router();
var permitType_ctrl = require('../controllers/permitType_ctrl');
var auth_ctrl = require('../controllers/auth_ctrl');
var city_ctrl = require('../controllers/city_ctrl');
var rate_ctrl = require('../controllers/rate_ctrl');
var plate_ctrl = require('../controllers/plate_ctrl');
var business_plate_ctrl = require('../controllers/business_plate_ctrl');
var taxRates_ctrl = require('../controllers/taxRates_ctrl');
var organizations_ctrl = require('../controllers/organizations_ctrl');
var parking_ctrl = require('../controllers/parking_ctrl');
var user_ctrl = require('../controllers/user_ctrl');
const { authorization } = require('../helpers/auth_helper');
const { upload } = require('../helpers/common_helper');

var organizationsFile = [
    { name: 'header_logo', maxCount: 1 },
    { name: 'footer_logo', maxCount: 1 },
    { name: 'receipt_logo', maxCount: 1 },
]

Routes.route('/').get(function (req, res){
    console.log('main');
    res.send('main');
});

//routes for auth
Routes.route('/signup').post(auth_ctrl.signup);
Routes.route('/verify').post(auth_ctrl.verify);
Routes.route('/login').post(auth_ctrl.login);
Routes.route('/forgetPassword').post(auth_ctrl.forgetPassword);
Routes.route('/changePassword').post(auth_ctrl.changePassword);

Routes.route('/testGetUser').get(auth_ctrl.testGetUser);
Routes.route('/testAddUser').get(auth_ctrl.testAddUser);
// Routes.route('/resetPassword').post(auth_ctrl.resetPassword);


//routes for city_zones
Routes.route('/addCity').post(city_ctrl.addCity);
Routes.route('/addZone').post(city_ctrl.addZone);
Routes.route('/getCities').get(city_ctrl.getCities);
Routes.route('/getZones').get(city_ctrl.getZones);
Routes.route('/getZonesById').post(city_ctrl.getZonesById);
Routes.route('/getZonebyId').post(city_ctrl.getZonebyId);
Routes.route('/editZone').post(city_ctrl.editZone);
Routes.route('/delZone').post(city_ctrl.delZone);


//routes for rate
Routes.route('/addRate').post(rate_ctrl.addRate);
Routes.route('/getRateById').post(rate_ctrl.getRateById);
Routes.route('/getRates').get(rate_ctrl.getRates);
Routes.route('/addRateType').post(rate_ctrl.addRateType);
Routes.route('/getRateTypes').get(rate_ctrl.getRateTypes);
Routes.route('/addRateStep').post(rate_ctrl.addRateStep);
Routes.route('/getRateSteps').post(rate_ctrl.getRateSteps);
Routes.route('/getRateDetail').post(rate_ctrl.getRateDetail);
Routes.route('/getQRRateById').post(rate_ctrl.getQRRateById);
Routes.route('/editRate').post(rate_ctrl.editRate);
Routes.route('/delRate').post(rate_ctrl.delRate);
Routes.route('/editRateType').post(rate_ctrl.editRateType);
Routes.route('/editRateStep').post(rate_ctrl.editRateStep);
Routes.route('/delRateType').post(rate_ctrl.delRateType);
Routes.route('/delRateStep').post(rate_ctrl.delRateStep);
Routes.route('/getAllSteps').get(rate_ctrl.getAllSteps);

//routes for plate
Routes.route('/getPlatesByUser').post(plate_ctrl.getPlatesByUser);
Routes.route('/addPlate').post(plate_ctrl.addPlate);
Routes.route('/delPlate').post(plate_ctrl.delPlate);
Routes.route('/editPlate').post(plate_ctrl.editPlate);

//routes for busniess_plate
Routes.route('/getPlatesByUser').post(plate_ctrl.getPlatesByUser);
Routes.route('/addBusinessPlate').post(business_plate_ctrl.addBusinessPlate);
Routes.route('/delPlate').post(plate_ctrl.delPlate);
Routes.route('/editPlate').post(plate_ctrl.editPlate);


//routes for tax_rates
Routes.route('/getTaxRates').get(authorization, taxRates_ctrl.getTaxRates);
Routes.route('/addTaxRates').post(authorization, taxRates_ctrl.addTaxRates);

//routes for organizations
Routes.route('/getOrganizations').get(authorization, organizations_ctrl.getOrganizations);
Routes.route('/addOrganizations').post([authorization,upload.fields(organizationsFile)], organizations_ctrl.addOrganizations);

//routes for parking
Routes.route('/buyParking').post(parking_ctrl.buyParking);
Routes.route('/getParkings').get(parking_ctrl.getParkings);
Routes.route('/emailReciept').post(parking_ctrl.emailReciept);
Routes.route('/getUserHistory').post(parking_ctrl.getUserHistory);
Routes.route('/mobileParking').post(parking_ctrl.mobileParking);

//routes for users
Routes.route('/getUsers').get(user_ctrl.getUsers);
Routes.route('/delItem').post(user_ctrl.delItem);

module.exports = Routes;