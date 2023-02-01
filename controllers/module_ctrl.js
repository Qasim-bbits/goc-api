const { Modules } = require('../models/modules_model');

module.exports.getModules = async function (req, res){
    const modules = await Modules.find().select('-__v');
    res.send(modules);
}

module.exports.addModule = function(req,res){
    const modules = new Modules(req.body);
    modules.save();
    res.send(modules);
}

module.exports.editModule = function(req,res){
    Modules.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
            msg: "Error updating Data with id " + req.body.id
        });
    });
}

module.exports.delModule = async function(req,res){
    const module = await Modules.deleteOne({_id : req.body.id}).select('-__v');
    res.send(module);
}

