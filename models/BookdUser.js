/**
 * Created by khalilbrown on 1/18/16.
 */
var mongoose = require('mongoose');

var BookdSchema = new mongoose.Schema({
    name: String,
    email: {type: String, unique: true},
    avatarVersion: String,
    provider: String,
    providerId: String,
    rating: Number,
    businessOwner: Boolean,
    hash: String,
    salt: String,
    isAssociate: Boolean,
    isAdmin: Boolean,
    settings: Object,
    notifications: [],
    availabilityArray: [],
    associatePhotos: [],
    businesses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Business'}],
    personalAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
    businessAppointments: [{type: mongoose.Schema.Types.ObjectId, ref: 'Appointment'}],
    dateCreated:String,
    stripeKeys:Object,
    stripeId:String
});

module.exports = BookdSchema;