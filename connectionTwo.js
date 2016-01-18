/**
 * Created by khalilbrown on 1/18/16.
 */
var mongoose = require('mongoose');
var bookdDatabase = mongoose.createConnection('mongodb://localhost/clientconnect');

module.exports = bookdDatabase;