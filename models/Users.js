const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    month: String,
    year: Number,
    email: String,
    password: String,
    profile: String,
});

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;