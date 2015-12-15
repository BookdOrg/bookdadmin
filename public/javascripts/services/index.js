/**
 * Created by Jonfor on 12/14/15.
 */
var app = require('angular').module('admin');

app.factory('auth', require('./auth-factory'));
app.factory('businessFactory', require('./business-factory'));