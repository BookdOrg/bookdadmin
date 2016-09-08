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

var User = adminDatabase.model('Administrators', UserSchema);
var BookdUser = bookdDatabase.model('User', BookdSchema);
var Business = bookdDatabase.model('Business', BusinessSchema);
var BetaUser = bookdDatabase.model('betausers', BetaUserSchema);

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
            console.log(betaUsers);
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
            BookdUser.findOne(business.owner).exec(function (err, user) {
                if (err) {
                    return handleError(err);
                }
                user.businesses.push(business._id);
                user.businessPage = business.placesId;
                user.businessOwner = true;
                user.save(function (err, user) {
                    if (err) {
                        return next(err);
                    }
                    var id = user._id;
                    request.post({url: 'http://' + process.env.devhost + ':3002/user/claimed-success?user=' + id}, function (err, response) {
                    });
                });
            });
            stripe.accounts.create({
                country: 'US',
                managed: true,
                business_name: business.name
            }, function (err, response) {
                business.stripeId = response.id;
                business.stripeKeys = response.keys;
                business.save(function (err, resBus) {
                    if (err) {
                        return next(err);
                    }
                    res.json({success: 'success'});
                });
            });
        } else {
            business.save(function (err, business) {
                if (err) {
                    return next(err);
                }
                res.json({success: 'success'});
            });
        }
    });
});

module.exports = router;