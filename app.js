/**
 * Created by Jonfor on 12/14/15.
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/clientconnect');

require('./models/Users');
require('./models/Business');

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

console.log('Server started using settings: Port: ' + process.env.devlocalPort + "\nhost: "
    + process.env.devhost + "\nenvironment: " + process.env.NODE_ENV);
module.exports = app;
