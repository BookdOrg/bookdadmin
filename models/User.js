/**
 * Created by khalilbrown on 1/18/16.
 */
var mongoose  = require('mongoose');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var UserSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    hash: String,
    salt: String,
    authorized:String
});

UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.hash);
};

UserSchema.methods.setPassword = function (password) {
    this.hash = bcrypt.hashSync(password, 10);
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
module.exports = UserSchema;