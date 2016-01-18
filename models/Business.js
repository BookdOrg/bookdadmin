/**
 * Created by khalilbrown on 1/18/16.
 */

var mongoose = require('mongoose');

var BusinessSchema = new mongoose.Schema({
    name: String,
    location: Object,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    services: [{type: mongoose.Schema.Types.ObjectId, ref: 'Service'}],
    category: String,
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    placesId: String,
    dateCreated: String,
    pending: Boolean,
    claimed: Boolean,
    tier: Number,
    stripeKeys:Object
});
module.exports = BusinessSchema;