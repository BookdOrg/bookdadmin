var express = require('express');
var app = require('express')();
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async');

var GooglePlaces = require('googleplaces');
var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_OUTPUT_FORMAT);
var User = mongoose.model('User');
var Business = mongoose.model('Business');
//var Appointment = mongoose.model('Appointment');
//var Category = mongoose.model('Category');
//var Service = mongoose.model('Service');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(3004);
io.on('connection', function (socket) {
    //Live updating of pending claim requests
    var stream = Business.find({pending: true}).populate({
        path: 'owner',
        select: 'id name'
    }).stream();

    stream.on('data', function (business) {
        socket.emit('pending', business);
    }).on('error', function (err) {
        console.log(err);
    })
});

/**
 *   Logs in a valid user using passport.
 *   Req.body.username == the email of the user, passport requires this be called username
 **/

router.post('/login', function (req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message: 'Please fill out all fields.'});
    }
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (user) {
            return res.json({token: user.generateJWT()});
        } else {
            return res.status(401).json({message: info.message});
        }
    })(req, res, next);

});

/**
 *   Returns all businesses that have requested to be claimed.
 **/
//router.get('/business/pending-requests', auth, function (req, res, next) {
//    Business.find({pending: true}).populate({
//        path: 'owner',
//        select: 'id name'
//    }).exec(function (err, businesses) {
//        if (err) {
//            return next(err);
//        }
//        res.send(businesses);
//    });
//});

/**
 * Changes the status of a business to approved
 * id - The BOOKD id of a business.
 **/
router.post('/business/update-request', auth, function (req, res, next) {
    Business.findOne({'_id': req.body.info._id}).exec(function (err, business) {
        business.pending = req.body.pending;
        business.claimed = true;
        User.findOne(business.owner).exec(function (err, user) {

            if (err) {
                return handleError(err);
            }
            user.businesses.push(business._id);
            user.businessPage = business.placesId;
            user.businessOwner = true;
            user.save(function (err, user) {

            });
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
                res.json({success: 'success'});
            });
        });
    });
});

module.exports = router;