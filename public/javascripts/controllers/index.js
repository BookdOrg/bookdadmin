/**
 * Created by Jonfor on 12/14/15.
 */
var app = require('angular').module('admin');

app.controller('AdminCtrl', require('./admin'));
app.controller('LandingCtrl', require('./landing'));
app.controller('denyRequestModalCtrl', require('./deny-request-modal'));