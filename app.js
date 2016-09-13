/**
 * Created by Jonfor on 12/14/15.
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var adminDatabase = require('./connectionOne');
var bookdDatabase = require('./connectionTwo');

var UserSchema = require('./models/User');
var BookdSchema = require('./models/BookdUser');
var BusinessSchema = require('./models/Business');
var BetaUserSchema = require('./models/BetaUser');
var NotificationSchema = require('./models/Notification');

adminDatabase.model('Administrators',UserSchema);
bookdDatabase.model('User',BookdSchema);
bookdDatabase.model('Business',BusinessSchema);
bookdDatabase.model('betausers',BetaUserSchema);
bookdDatabase.model('Notifications',NotificationSchema);

require('./config/passport');

var routes = require('./routes/index');

var app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));

app.use('/', routes);

app.all('/*', function (req, res, next) {
    //TODO Find out why this works
    //Returns a 404 if a js or css file can't be found
    if (req.path.indexOf('.js') > -1 || req.path.indexOf('.css') > -1) {
        res.status(404);
    }

    res.sendFile('public/index.html', {root: __dirname});
});

console.log('Server started using settings:\nPort: ' + 3003 + "\nhost: "
    + process.env.devhost + "\nenvironment: " + process.env.NODE_ENV);
module.exports = app;
