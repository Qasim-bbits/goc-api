const { TaxRate } = require('../models/taxRate_model');

module.exports.getTaxRates = async function (req, res){
    const taxRate = await TaxRate.find().select('-__v');
    res.send(taxRate);
}

module.exports.addTaxRates = function(req,res){
    const taxRate = new TaxRate(req.body);
    taxRate.save();
    res.send(taxRate);
}