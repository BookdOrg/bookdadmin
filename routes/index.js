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
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});
var server = require('http').createServer(app);
//var io = require('socket.io')(server);
var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'contact.bookd@gmail.com',
        pass: process.env.emailPass
    }
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
    User.findOne({'_id': req.body.owner._id}).exec(function (err, user) {
        if (err) {
            return handleError(err);
        }


        var subject,
            body;
        if (req.body.claimed === false) {
            // Rejected
            subject = 'Your Bookd business request status';
            body = 'Unfortunately your request to claim ' + req.body.name +
                'has been rejected. The reason for rejection was: ' + req.body.selectedReason
                + '. More information:<br/>' + req.body.denialReasonText +
                '<br/>Please get in contact with us at contact.bookd@gmail.com to resolve this.';
            //body = req.body.selectedReason + '<br/>' + '<b>' + req.body.denialReasonText + '</b>'
        } else {
            subject = 'Your Bookd business request status';
            body = 'Congratulations! your business, ' + req.body.name + ', is now a partner of Bookd!'
        }
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: 'Marshall Mathers', // sender address
            to: user.email, // list of receivers
            subject: subject, // Subject line
            html: body // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                return console.log(error);
            }
        });
    });
    Business.findOne({'_id': req.body._id}).exec(function (err, business) {
        business.pending = req.body.pending;
        business.claimed = req.body.claimed;
        User.findOne(business.owner).exec(function (err, user) {

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