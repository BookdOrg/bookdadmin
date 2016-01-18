/**
 * Created by Jonfor on 12/14/15.
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var stripe = require('stripe')(process.env.stripeDevSecret);

var adminDatabase = mongoose.createConnection('mongodb://localhost/admin');
var bookdDatabase = mongoose.createConnection('mongodb://localhost/clientconnect');

var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    hash: String,
    salt: String,
    authorized:String
});

UserSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

    return this.hash === hash;
};

UserSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');

    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.generateJWT = function () {

    // set expiration to 1 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 1);

    //TODO change secret to something better
    return jwt.sign({
        _id: this._id,
        exp: parseInt(exp.getTime() / 1000),
        name: this.name,
        email: this.email
    }, 'SECRET');
};

var User = adminDatabase.model('User',UserSchema);

var BusinessSchema = new mongoose.Schema({
    name: String,
    location: Object,
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    services: [{type: mongoose.Schema.Types.ObjectId, ref: 'Service'}],
    category: String,
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    placesId: String,
    dateCreated: String,
    pending: Boolean,
    claimed: Boolean,
    tier: Number
});

var Business = bookdDatabase.model('Business',BusinessSchema);

var router = express.Router();
var exjwt = require('express-jwt');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;


passport.use(new localStrategy(
    function (username, password, done) {
        User.findOne({email: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'Incorrect username.'});
            }
            if (!user.validPassword(password)) {
                return done(null, false, {message: 'Incorrect password.'});
            }
            return done(null, user);
        });
    }
));




//var routes = require('./routes/index');

var app = express();

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));


var auth = exjwt({secret: 'SECRET', userProperty: 'payload'});
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

//app.use('/', routes);
app.post('/admin/login', function (req, res, next) {
    console.log("fired");
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
app.get('/admin/business/pending-requests', auth, function (req, res, next) {
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
app.post('/admin/business/update-request', auth, function (req, res, next) {
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
            from: 'Contact Bookd', // sender address
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
        if (!business.pending && business.claimed) {
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
            });
        }
        business.save(function (err, business) {
            if (err) {
                return next(err);
            }
            res.json({success: 'success'});
        });
    });
});
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
