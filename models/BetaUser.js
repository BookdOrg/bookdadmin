/**
 * Created by khalilbrown on 9/7/16.
 */
/**  * Created by khalilbrown on 9/3/16.  */
var mongoose = require('mongoose');
var BetaUserSchema = new mongoose.Schema({
    email: {type: String,
    unique: true},
    type: String});

module.exports = BetaUserSchema;