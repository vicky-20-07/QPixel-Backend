const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    month: { type: String },
    year: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: String },
    profileMimeType: { type: String }
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
