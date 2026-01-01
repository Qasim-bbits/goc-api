const { Organizations } = require('../models/organizations_model');
const { Users } = require('../models/users_model');
const { User_Permissions } = require('../models/user_permission_model');

module.exports.addPermission = function(req,res){
    const user_permissions = new User_Permissions(req.body);
    user_permissions.save();
    res.send(user_permissions);
}

module.exports.editPermission = function(req,res){
    User_Permissions.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Data not found with id " + req.params.id
            });
        }
        res.json(response);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Data not found with id " + req.params.id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.params._id
        });
    });
}

module.exports.getUserPermissions=async function(req,res){
    try {
        let user_permissions = await User_Permissions.
        find({ user: req.body.user_id }).
        populate('user').
        populate('module')
        res.send(user_permissions);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports.getModulePermissions=async function(req,res){
    try {
        let module_permissions = await User_Permissions.
            findOne({ module: req.body.module_id }).
            populate('user').
            populate('module')
        res.send(module_permissions);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports.getPermissions=async function(req,res){
    if(req.body.role == 'root'){
        try {
            let root_user = await Users.
            find({role: 'root'})
            .populate({
                path: 'org'
            });
            let admin_user = await Users.
            find({role: 'admin'})
            .populate({
                path: 'org'
            });
            let response = [];
            let obj = {
                org_name : root_user[0].org.org_name,
                logo : root_user[0].org.logo,
                sub_domain : root_user[0].org.sub_domain,
                fname : root_user[0].fname,
                email : root_user[0].email,
                _id : root_user[0]._id,
            }
            let arr = [];
            const uniqueOrg = await [...new Set(admin_user.map(item => item.org._id))];
            await Promise.all(uniqueOrg.map( async x=>{
                let filter = await admin_user.filter(el=>el.org._id == x)
                let child = {
                    org_name : filter[0].org.org_name,
                    logo : filter[0].org.logo,
                    sub_domain : filter[0].org.sub_domain,
                    users : filter
                }
                arr.push(child);
            }))
            obj['child'] = arr;
            response.push(obj)
            res.send(response);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, msg: err.message });
        }
    }else{
        try {
            let users = await Users.
            find({org: req.body.org_id, role: {$ne: 'user'}})
            .populate({
                path: 'org'
            });
            let response = [];
            let obj = {
                org_name : users[0].org.org_name,
                logo : users[0].org.logo,
                sub_domain : users[0].org.sub_domain,
                _id : users[0]._id,
                child : users
            }
            response.push(obj)
            res.send(response);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports.delPermission = async function(req,res){
    const user_permissions = await User_Permissions.deleteOne({_id : req.body.id}).select('-__v');
    res.send(user_permissions);
}

module.exports.EnableUserPermission = async function(req,res){
    try {
        User_Permissions.findOneAndUpdate({user: req.body.user}, 
            { $set: req.body },
            { returnOriginal: false }
        )
        .then(async response => {
            if(!response) {
                return res.status(404).json({
                    msg: "Data not found with id " + req.body.id
                });
            }
            res.json(response);
        })
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
}