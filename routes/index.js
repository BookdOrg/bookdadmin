var express = require('express');
var app = require('express')();
var router = express.Router();
var jwt = require('express-jwt');
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async');
var GooglePlaces = require('googleplaces');
var googleplaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_OUTPUT_FORMAT);

var adminDatabase = require('./../connectionOne');
var bookdDatabase = require('./../connectionTwo');
var UserSchema = require('./../models/User');
var BusinessSchema = require('./../models/Business');
var BookdSchema = require('./../models/BookdUser');
var BetaUserSchema = require('./../models/BetaUser');
var NotificationSchema = require('./../models/Notification');

var User = adminDatabase.model('Administrators', UserSchema);
var BookdUser = bookdDatabase.model('User', BookdSchema);
var Business = bookdDatabase.model('Business', BusinessSchema);
var BetaUser = bookdDatabase.model('betausers', BetaUserSchema);
var Notification = bookdDatabase.model('Notifications',NotificationSchema);

var request = require('request');

var stripe = require('stripe')(process.env.stripeDevSecret);

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var server = require('http').createServer(app);
//var io = require('socket.io')(server);
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
// create reusable transporter object using SMTP transport
var wellknown = require('nodemailer-wellknown');
var config = wellknown('Zoho');
// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: 'contact@bookd.me',
        pass: process.env.emailPass
    }
});
router.get('/admin/users', function (req, res, next) {
    var bUsers = [];
    var nUsers = [];
    var responseObject = {};

    var getBetaUsers = function(callback) {
        BetaUser.find().exec(function (err, betaUsers) {
            if (err) {
                return next(err);
            }
            callback(betaUsers);
        })
    };

    var getUsers = function(betaUsers) {
        BookdUser.find().exec(function (err, users) {
            if (err) {
                return next(err);
            }
            responseObject.betaUsers = betaUsers;
            responseObject.users = users;
            res.json(responseObject);
        })
    };
     getBetaUsers(getUsers);
});

/**
 *   Logs in a valid user using passport.
 *   Req.body.username == the email of the user, passport requires this be called username
 **/

router.post('/admin/login', function (req, res, next) {
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
router.get('/admin/business/pending-requests', auth, function (req, res, next) {
    Business.find({pending: true}).populate({
        path: 'owner',
        select: 'id name'
    }).exec(function (err, businesses) {
        if (err) {
            return next(err);
        }
        res.send(businesses);
    });
});

/**
 * Changes the status of a business to approved or denied
 * id - The BOOKD id of a business.
 **/
router.post('/admin/business/update-request', auth, function (req, res, next) {
    var businesAcceptedDir = path.join(__dirname, '../templates', 'business-accepted');
    var businessRejectedDir = path.join(__dirname, '../templates', 'business-rejected');
    BookdUser.findOne({'_id': req.body.owner._id}).exec(function (err, user) {
        if (err) {
            return handleError(err);
        }
        var body,
            mailOptions = {},
            templateOptions = {};
        templateOptions = req.body;
        templateOptions.emailName = user.name.split(' ', 1);
        if (req.body.claimed === false) {
            // Rejected
            var rejectionTemplate = new EmailTemplate(businessRejectedDir);
            rejectionTemplate.render(templateOptions, function (err, results) {
                body = results.html;
                mailOptions = {
                    from: 'Bookd <contact@bookd.me>', // sender address
                    to: user.email, // list of receivers
                    subject: 'Bookd Request Status', // Subject line
                    html: body // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                });
            })
        } else {
            var acceptedTemplate = new EmailTemplate(businesAcceptedDir);
            acceptedTemplate.render(templateOptions, function (err, results) {
                body = results.html;
                mailOptions = {
                    from: 'Bookd <contact@bookd.me>', // sender address
                    to: user.email, // list of receivers
                    subject: 'Bookd Request Status', // Subject line
                    html: body // html body
                };
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                });
            });
        }
    });
    Business.findOne({'_id': req.body._id}).exec(function (err, business) {
        business.pending = req.body.pending;
        business.claimed = req.body.claimed;
        business.stripeKeys = {};
        business.payments = false;
        if (!business.pending && business.claimed) {
            updateUser(business,updateBusiness);
        } else {
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
                res.json({success: 'success'});
            });
        }
    });
    function updateUser(businessObj,callback) {
        BookdUser.findOne(businessObj.owner).exec(function (err, user) {
            if (err) {
                return handleError(err);
            }
            user.businesses.push(businessObj._id);
            user.businessPage = businessObj.placesId;
            user.businessOwner = true;
            if (businessObj.accountType == 'shopEmployee' || businessObj.accountType == 'individual' && typeof user.stripeId == "undefined") {
                createAccount(user);
            }
            user.save(function (err, user) {
                if (err) {
                    return next(err);
                }
                var id = user._id;
                request.post({url: 'http://' + process.env.devhost + ':3002/user/claimed-success?user=' + id}, function (err, response) {
                });
                callback(businessObj,done);
            });
        })
    }
    var updateBusiness = function(business,callback){
        if(business.accountType == 'owner' || business.accountType == 'shopEmployee'){
            createAccount(business);
        }
        business.save(function(err, updatedBusiness){
            if(err){return next(err)}
            console.log(updatedBusiness.owner);
            request.post({
                url: 'http://' + process.env.devhost + ':3002/user/notifications/create',
                form:{content:'Your request to claim' +updatedBusiness.name +' has been accepted! You can now navigate to the Manage section of BUZ to start operating your business.',
                    type:'false',
                    id:updatedBusiness.owner.toString()}
            }, function (err, response) {});
            callback();
        });
    };
    function setAccountInfo(stripeData,object){
        object.stripeId = stripeData.id;
        object.stripeKeys = stripeData.keys;
        object.save(function(err,object){
            if(err){return next(err)};
        })
    }
    function createAccount(businessObj){
        stripe.accounts.create({
            country: 'US',
            managed: true,
            business_name: businessObj.name+'_'+businessObj._id.toString()
        }, function (err, response) {
            setAccountInfo(response,businessObj);
        });
    }
    function done(){
        res.json('Done');
    }
});
module.exports = router;