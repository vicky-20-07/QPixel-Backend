const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({
    origin: ["https://qpixel-3e00e.web.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express.json());

mongoose.connect("mongodb+srv://Vignesh:vicky4648@qpixel.87n2nn5.mongodb.net/?retryWrites=true&w=majority&appName=QPixel");

app.post('/createUser', (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let profile = 'no-image';
    bcrypt.hash(password, 10).then(hash => {
        UserModel.create({ firstName, lastName, email, password: hash, profile })
            .then(users => res.json({ status: "ok" }))
            .catch(err => res.json(err));
    }).catch(err => res.json(err));
})

app.post('/loginUser', (req, res) => {
    const { email, password } = req.body;
    UserModel.findOne({ email: email })
        .then(user => {
            if (user) {
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response) {
                        const token = jwt.sign({ email: user.email }, "jwt-secret-key", { expiresIn: '1d' });
                        return res.json({ status: "success", token: token });
                    }
                    else {
                        return res.json({ status: "error" });
                    }
                })
            }
            else {
                return res.json("User not found");
            }
        })
})

app.listen(5000, () => {
    console.log('Hello I\'m running!!!');
})