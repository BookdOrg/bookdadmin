/**
 * Created by Jonfor on 12/14/15.
 */
var mongoose = require('mongoose');

var BusinessSchema = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    category: String,
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    placesId: String,
    dateCreated: String,
    pending: Boolean,
    claimed: Boolean
});

mongoose.model('Business', BusinessSchema);