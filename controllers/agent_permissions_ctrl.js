const { Agent_Permissions } = require('../models/agent_permission_model');

// module.exports.editPermission = function(req,res){
//     User_Permissions.findByIdAndUpdate(req.body.id, req.body, {new: true})
//     .then(response => {
//         if(!response) {
//             return res.status(404).json({
//                 msg: "Data not found with id " + req.params.id
//             });
//         }
//         res.json(response);
//     }).catch(err => {
//         if(err.kind === 'ObjectId') {
//             return res.status(404).json({
//                 msg: "Data not found with id " + req.params.id
//             });                
//         }
//         return res.status(500).json({
//             msg: "Error updating Data with id " + req.params._id
//         });
//     });
// }

module.exports.getAgentPermissions=async function(req,res){
    try {
        let agent_permissions = await Agent_Permissions.
        find({ user: req.body.user_id }).
        populate('user').
        populate('cities')
        res.send(agent_permissions);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: err.message });
    }
}