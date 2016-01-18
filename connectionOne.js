/**
 * Created by khalilbrown on 1/18/16.
 */
var mongoose = require('mongoose');

var adminDatabase = mongoose.createConnection('mongodb://localhost/admin');

module.exports = adminDatabase;