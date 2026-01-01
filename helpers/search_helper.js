const moment = require("moment-timezone");

module.exports.filterQuery = function (obj) {
    const { operator, ...rest } = obj;
    switch (obj.operator) {
        //string operators
        case 'contains':
            return { [Object.keys(rest)[0]]: new RegExp(Object.values(rest)[0], 'i') };
        case 'equals':
            return { [Object.keys(rest)[0]]: Object.values(rest)[0] };
        case 'startsWith':
            return { [Object.keys(rest)[0]]: new RegExp('^' + Object.values(rest)[0], 'i') };
        case 'endsWith':
            return { [Object.keys(rest)[0]]: new RegExp(Object.values(rest)[0] + '$') };
        //string operators

        //numeric operators
        case '=':
            return { [Object.keys(rest)[0]]: Object.values(rest)[0] };
        case '!=':
            return { [Object.keys(rest)[0]]: { $ne: Object.values(rest)[0] } };
        case '>':
            return { [Object.keys(rest)[0]]: { $gt: Object.values(rest)[0] } };
        case '>=':
            return { [Object.keys(rest)[0]]: { $gte: Object.values(rest)[0] } };
        case '<':
            return { [Object.keys(rest)[0]]: { $lt: Object.values(rest)[0] } };
        case '<=':
            return { [Object.keys(rest)[0]]: { $lte: Object.values(rest)[0] } };
        //numeric operators
        
        //date operators
        case 'is':
            return {
                [Object.keys(rest)[0]]: {
                    $gte: Object.values(rest)[0],
                    $lte: moment(Object.values(rest)[0]).add(1, 'day').toISOString()
                }
            };
        case 'not':
            return {
                [Object.keys(rest)[0]]: {
                    $lt: Object.values(rest)[0],
                    $gt: moment(Object.values(rest)[0]).add(1, 'day').toISOString()
                }
            };
        case 'after':
            return { [Object.keys(rest)[0]]: { $gt: Object.values(rest)[0] } };
        case 'onOrAfter':
            return { [Object.keys(rest)[0]]: { $gte: Object.values(rest)[0] } };
        case 'before':
            return { [Object.keys(rest)[0]]: { $lt: Object.values(rest)[0] } };
        case 'onOrBefore':
            return { [Object.keys(rest)[0]]: { $lte: Object.values(rest)[0] } };
        //date operators
        
        default:
            return {};
    }
}