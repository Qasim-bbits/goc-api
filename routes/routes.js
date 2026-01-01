var express = require('express');
var Routes = express.Router();
var permitType_ctrl = require('../controllers/permit_type_ctrl');
var auth_ctrl = require('../controllers/auth_ctrl');
var module_ctrl = require('../controllers/module_ctrl');
var ticket_ctrl = require('../controllers/ticket_ctrl');
var ticket_issue_ctrl = require('../controllers/ticket_issue_ctrl');
var user_permissions_ctrl = require('../controllers/user_permissions_ctrl');
var agent_permissions_ctrl = require('../controllers/agent_permissions_ctrl');
var city_ctrl = require('../controllers/city_ctrl');
var rate_ctrl = require('../controllers/rate_ctrl');
var plate_ctrl = require('../controllers/plate_ctrl');
var dashboard_ctrl = require('../controllers/dashboard_ctrl');
var business_plate_ctrl = require('../controllers/business_plate_ctrl');
var tenent_plate_ctrl = require('../controllers/tenent_plate_ctrl');
var residant_plate_ctrl = require('../controllers/residant_plate_ctrl');
var organizations_ctrl = require('../controllers/organizations_ctrl');
var parking_ctrl = require('../controllers/parking_ctrl');
var user_ctrl = require('../controllers/user_ctrl');
var moneris_ctrl = require('../controllers/moneris_ctrl');
var external_parking_config_ctrl = require('../controllers/external_parking_config_ctrl');
var reporting_ctrl = require('../controllers/reporting_ctrl');
var camren_cloud_ctrl = require('../controllers/camren_cloud_ctrl');
var plate_parking_limit_ctrl = require('../controllers/plate_parking_limit_ctrl');
var business_pass_plate_ctrl = require('../controllers/business_pass_plate_ctrl');
var kick_out_plate_ctrl = require('../controllers/kick_out_plate_ctrl');
var scan_plate_ctrl = require('../controllers/scan_plate_ctrl');
var email_template_ctrl = require('../controllers/email_template_ctrl');
var stripe_ctrl = require('../controllers/stripe_ctrl');
var virtual_meter_ad_ctrl = require('../controllers/virtual_meter_ad_ctrl');
var notes_ctrl = require('../controllers/notes_ctrl');

const { authorization } = require('../helpers/auth_helper');
const { upload, handleFormData, compaign_upload } = require('../helpers/common_helper');
const { testEmail } = require('../helpers/email_helper');

var organizationsFile = [
    { name: 'logo', maxCount: 1 }
]

Routes.route('/').get(function (req, res){
    const pdm = [];
    const street = []
    let arr = [];
    pdm.map(x=>{
        arr.push({...x, str_id: street.find(y=> y.name.toLowerCase() == x["Street name"].toLowerCase())?.id})
    })
    res.send(arr)
});

//routes for auth
Routes.route('/signup').post(auth_ctrl.signup);
Routes.route('/verify').post(auth_ctrl.verify);
Routes.route('/login').post(auth_ctrl.login);
Routes.route('/resend').post(auth_ctrl.resend);
Routes.route('/forgetPassword').post(auth_ctrl.forgetPassword);
Routes.route('/changePassword').post(auth_ctrl.changePassword);
Routes.route('/agent_login').post(auth_ctrl.agent_login);
Routes.route('/addRoot').post(auth_ctrl.addRoot);

Routes.route('/testGetUser').get(auth_ctrl.testGetUser);
Routes.route('/testAddUser').get(auth_ctrl.testAddUser);
// Routes.route('/resetPassword').post(auth_ctrl.resetPassword);


//routes for city_zones
Routes.route('/addCity').post(city_ctrl.addCity);
Routes.route('/editCity').post(city_ctrl.editCity);
Routes.route('/delCity').post(city_ctrl.delCity);
Routes.route('/addZone').post(city_ctrl.addZone);
Routes.route('/getCities').post(city_ctrl.getCities);
Routes.route('/getZones').post(city_ctrl.getZones);
Routes.route('/getZonesById').post(city_ctrl.getZonesById);
Routes.route('/getZonebyId').post(city_ctrl.getZonebyId);
Routes.route('/editZone').post(city_ctrl.editZone);
Routes.route('/delZone').post(city_ctrl.delZone);
Routes.route('/getVisitorZone').post(city_ctrl.getVisitorZone);
Routes.route('/tenantVisitorZones').post(city_ctrl.getTenantAndVisitorZones);
Routes.route('/getZoneUrl').post(city_ctrl.getZoneUrl);
Routes.route('/getZoneByCode').post(city_ctrl.getZoneByCode);

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
Routes.route('/bulkEditSteps').post(rate_ctrl.bulkEditSteps);
Routes.route('/addCompleteRate').post(rate_ctrl.addCompleteRate);
Routes.route('/addSpecialRate').post(rate_ctrl.addSpecialRate);
Routes.route('/getRateByZone').post(rate_ctrl.getRateByZone);
Routes.route('/visitorPassRate/:zone_id').get(rate_ctrl.getVisitorPassRate);
Routes.route('/getWhitelistRateByZone').post(rate_ctrl.getWhitelistRateByZone);

//routes for plate
Routes.route('/getPlatesByUser').post(plate_ctrl.getPlatesByUser);
Routes.route('/addPlate').post(plate_ctrl.addPlate);
Routes.route('/delPlate').post(plate_ctrl.delPlate);
Routes.route('/editPlate').post(plate_ctrl.editPlate);

//routes for busniess_plate
Routes.route('/getBusinessPlate').get(business_plate_ctrl.getBusinessPlate);
Routes.route('/addBusinessPlate').post(business_plate_ctrl.addBusinessPlate);
Routes.route('/delBusinessPlate').post(business_plate_ctrl.delBusinessPlate);
Routes.route('/editBusinessPlate').post(business_plate_ctrl.editBusinessPlate);

//routes for tenent_plate
Routes.route('/getTenantPlates').post(tenent_plate_ctrl.getTenantPlates);
Routes.route('/addTenentPlate').post(tenent_plate_ctrl.addTenentPlate);
Routes.route('/delTenentPlate').post(tenent_plate_ctrl.delTenentPlate);
Routes.route('/editTenentPlate').post(tenent_plate_ctrl.editTenentPlate);

//routes for residant_plate
Routes.route('/getResidantPlates').post(residant_plate_ctrl.getResidantPlates);
Routes.route('/addResidantPlate').post(residant_plate_ctrl.addResidantPlate);
Routes.route('/delResidantPlate').post(residant_plate_ctrl.delResidantPlate);
Routes.route('/editResidantPlate').post(residant_plate_ctrl.editResidantPlate);

//routes for dashboard
Routes.route('/getDashboard').post(dashboard_ctrl.getDashboard);

//routes for organizations
Routes.route('/getOrganizations').get(organizations_ctrl.getOrganizations);
Routes.route('/addOrganization').post(upload.fields(organizationsFile), organizations_ctrl.addOrganization);
Routes.route('/delOrganization').post(organizations_ctrl.delOrganization);
Routes.route('/editOrganization').post(upload.fields(organizationsFile), organizations_ctrl.editOrganization);
Routes.route('/partialEditOrganization').post(organizations_ctrl.partialEditOrganization);
Routes.route('/getOrgBySubDomain').post(organizations_ctrl.getOrgBySubDomain);
Routes.route('/getOrgImage').post(organizations_ctrl.getOrgImage);

// Routes.route('/addOrganizations').post([authorization,upload.fields(organizationsFile)], organizations_ctrl.addOrganizations);

//routes for parking
Routes.route('/buyParking').post(parking_ctrl.buyParking);
Routes.route('/getParkings').post(parking_ctrl.getParkings);
Routes.route('/emailReciept').post(parking_ctrl.emailReciept);
Routes.route('/getUserHistory').post(parking_ctrl.getUserHistory);
Routes.route('/mobileParking').post(parking_ctrl.mobileParking);
Routes.route('/getCurrentParking').post(parking_ctrl.getCurrentParking);
Routes.route('/getCurrentParkingsByPlate').post(parking_ctrl.getCurrentParkingsByPlate);
Routes.route('/editParking').post(parking_ctrl.editParking);
Routes.route('/delAllParkings').post(parking_ctrl.delAllParkings);
Routes.route('/getParkingStatus').post(parking_ctrl.getParkingStatus);
Routes.route('/renewTenantParking').post(parking_ctrl.renewTenantParking);
Routes.route('/buyVisitorPass').post(parking_ctrl.buyVisitorPass);
Routes.route('/getParkingsByCity').post(parking_ctrl.getParkingsByCity);
Routes.route('/parking_plates').post(parking_ctrl.parkingPlates);
Routes.route('/active_parking_plates').post(parking_ctrl.activeParkingPlates);
Routes.route('/kickOutPlate').post(parking_ctrl.kickOutPlate);
Routes.route('/residantParking').get(parking_ctrl.residantParking);
Routes.route('/exitParking').post(parking_ctrl.exitParking);
Routes.route('/editParkingPlate').post(parking_ctrl.editParkingPlate);
Routes.route('/parking_available').post(parking_ctrl.parking_available);
Routes.route('/park_vehicle').post(parking_ctrl.park_vehicle);

//routes for users
Routes.route('/getUsers').get(user_ctrl.getAlUsers);
Routes.route('/getUsers').post(user_ctrl.getUsers);
Routes.route('/delUser').post(user_ctrl.delUser);
Routes.route('/addUser').post(user_ctrl.addUser);
Routes.route('/editUser').post(user_ctrl.editUser);
Routes.route('/getUserProfile').post(user_ctrl.getUserProfile);
Routes.route('/editProfile').post(user_ctrl.editProfile);
Routes.route('/getAgents').get(user_ctrl.getAgents);
Routes.route('/getPassword').post(user_ctrl.getPassword);

//routes for modules
Routes.route('/getModules').get(module_ctrl.getModules);
Routes.route('/addModule').post(module_ctrl.addModule);
Routes.route('/delModule').post(module_ctrl.delModule);
Routes.route('/editModule').post(module_ctrl.editModule);
Routes.route('/insertBulkModule').post(module_ctrl.insertBulkModule);

//routes for user_permissions
Routes.route('/getPermissions').post(user_permissions_ctrl.getPermissions);
Routes.route('/addPermission').post(user_permissions_ctrl.addPermission);
Routes.route('/delPermission').post(user_permissions_ctrl.delPermission);
Routes.route('/editPermission').post(user_permissions_ctrl.editPermission);
Routes.route('/getUserPermissions').post(user_permissions_ctrl.getUserPermissions);
Routes.route('/getModulePermissions').post(user_permissions_ctrl.getModulePermissions);
Routes.route('/enableUserPermission').post(user_permissions_ctrl.EnableUserPermission);

//routes for agent_permissions
Routes.route('/getAgentPermissions').post(agent_permissions_ctrl.getAgentPermissions);

//routes for moneris
Routes.route('/generateToken').post(moneris_ctrl.generateToken);
Routes.route('/monerisReceipt').post(moneris_ctrl.monerisReceipt);

//routes for tickets
Routes.route('/getTickets').post(ticket_ctrl.getTickets);
Routes.route('/addTicket').post(ticket_ctrl.addTicket);
Routes.route('/delTicket').post(ticket_ctrl.delTicket);
Routes.route('/editTicket').post(ticket_ctrl.editTicket);
Routes.route('/getAgingByTicket').post(ticket_ctrl.getAgingByTicket);
Routes.route('/getTicketsByOrg').post(ticket_ctrl.getTicketsByOrg);


//routes for tickets_issued
Routes.route('/IssueTicket').post(ticket_issue_ctrl.IssueTicket);
Routes.route('/getTicketsIssued').post(ticket_issue_ctrl.getTicketsIssued);
Routes.route('/editIssueTicket').post(ticket_issue_ctrl.editIssueTicket);
Routes.route('/searchTicket').post(ticket_issue_ctrl.searchTicket);
Routes.route('/payTicket').post(ticket_issue_ctrl.payTicket);
Routes.route('/getTicketsIssuedByAgent').post(ticket_issue_ctrl.getTicketsIssuedByAgent);
Routes.route('/IssuedTicket/:id').get(ticket_issue_ctrl.getTicketIssuedDetail);
Routes.route('/delIssuedTicket/:id').delete(ticket_issue_ctrl.delTicketIssued);
Routes.route('/addPrintedTicket').post(ticket_issue_ctrl.addPrintedTicket);

//routes for ExternalParkingConfig
Routes.route('/getExternalParkingConfig').post(external_parking_config_ctrl.getExternalParkingConfig);
Routes.route('/getZoneByOrg').post(external_parking_config_ctrl.getZoneByOrg);
Routes.route('/addExternalParkingConfig').post(external_parking_config_ctrl.addExternalParkingConfig);
Routes.route('/editExternalParkingConfig').post(external_parking_config_ctrl.editExternalParkingConfig);
Routes.route('/delExternalParkingConfig').post(external_parking_config_ctrl.delExternalParkingConfig);

//routes for Reporting
Routes.route('/getAllKeys').post(reporting_ctrl.getAllKeys);
Routes.route('/generateReport').post(reporting_ctrl.generateReport);
Routes.route('/exportPDF').post(reporting_ctrl.exportPDF);
Routes.route('/generateTicketIssuedReport').post(reporting_ctrl.generateTicketIssuedReport);
Routes.route('/getParkingsScript').post(reporting_ctrl.getParkingsScript);
Routes.route('/reports_v2').post(reporting_ctrl.reports_v2);
Routes.route('/lookups').get(reporting_ctrl.lookups);

//routes for Camren
Routes.route('/scanImage').post(handleFormData.single('file'), camren_cloud_ctrl.scanImage);
Routes.route('/testEmail').get(testEmail);

//routes for Reset Parking Limit
Routes.route('/resetParkingLimit').post(plate_parking_limit_ctrl.addPlateParkingLimit);

//routes for business_pass_plate
Routes.route('/getBusinessPassPlates').post(business_pass_plate_ctrl.getBusinessPassPlates);
Routes.route('/addBusinessPassPlate').post(business_pass_plate_ctrl.addBusinessPassPlate);
Routes.route('/delBusinessPassPlate').post(business_pass_plate_ctrl.delBusinessPassPlate);
Routes.route('/editBusinessPassPlate').post(business_pass_plate_ctrl.editBusinessPassPlate);

Routes.route('/getKickOutPlates').post(kick_out_plate_ctrl.getKickOutPlates);

//routes for scan plate
Routes.route('/getScanPlates').get(scan_plate_ctrl.getScanPlates);
Routes.route('/getScanPlates/:token').get(scan_plate_ctrl.getScanPlatesByToken);
Routes.route('/addScanPlate').post(scan_plate_ctrl.addScanPlate);
Routes.route('/delScanPlate').post(scan_plate_ctrl.delScanPlate);

//routes for Email Templete
Routes.route('/getEmailTemplates').post(email_template_ctrl.getEmailTemplates);
Routes.route('/editEmailTemplate').post(email_template_ctrl.editEmailTemplate);
Routes.route('/addEmailTemplate').post(email_template_ctrl.addEmailTemplate);
Routes.route('/delEmailTemplate').post(email_template_ctrl.delEmailTemplate);
Routes.route('/testEmailTemplate').post(email_template_ctrl.testEmailTemplate);

//routes for Virtual Meter Ads
Routes.route('/getVirtualMeterAds').post(virtual_meter_ad_ctrl.getVirtualMeterAds);
Routes.route('/getVirtualMeterAdById').post(virtual_meter_ad_ctrl.getVirtualMeterAdById);
Routes.route('/editVirtualMeterAd').post(virtual_meter_ad_ctrl.editVirtualMeterAd);
Routes.route('/addVirtualMeterAd').post(virtual_meter_ad_ctrl.addVirtualMeterAd);
Routes.route('/delVirtualMeterAd').post(virtual_meter_ad_ctrl.delVirtualMeterAd);
Routes.route('/current_compaign').post(virtual_meter_ad_ctrl.current_compaign);
Routes.route('/upload_compaign').post(
    compaign_upload.fields([
        { name: 'compaign', maxCount: 1 }
    ]),
    virtual_meter_ad_ctrl.upload_compaign
);

Routes.route('/secret_token').get(stripe_ctrl.secret_token);
Routes.route('/payment_intent').post(stripe_ctrl.payment_intent);
Routes.route('/connection_token').post(stripe_ctrl.connection_token);
Routes.route('/create_payment_intent').post(stripe_ctrl.create_payment_intent);
Routes.route('/capture_payment_intent').post(stripe_ctrl.capture_payment_intent);
Routes.route('/create_location').post(stripe_ctrl.create_location);
Routes.route('/list_locations').post(stripe_ctrl.list_locations);

//routes for Notes
Routes.route('/addNote').post(notes_ctrl.addNote);
Routes.route('/editNote').post(notes_ctrl.editNote);
Routes.route('/delNote').post(notes_ctrl.delNote);
Routes.route('/getNotes').post(notes_ctrl.getNotes);
Routes.route('/getNotesByOrg').post(notes_ctrl.getNotesByOrg);
Routes.route('/getNotesByType').post(notes_ctrl.getNotesByType);

Routes.route('/test-external-parking').post(parking_ctrl.testExternalParking);

module.exports = Routes;