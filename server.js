const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users');
const ImageModel = require('./models/Images');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(express.json());
app.use(express.static('public'));

mongoose.connect("mongodb+srv://Vignesh:vicky4648@qpixel.87n2nn5.mongodb.net/?retryWrites=true&w=majority&appName=QPixel", {})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/createUser', upload.single('profile'), async (req, res) => {
    try {
        const { firstName, lastName, month, year, email, password } = req.body;

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ status: "error", message: "User already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        let profile = null;
        let profileMimeType = null;
        if (req.file) {
            profile = req.file.buffer.toString('base64');
            profileMimeType = req.file.mimetype;
        }

        const newUser = new UserModel({ firstName, lastName, month, year, email, password: hash, profile, profileMimeType });
        await newUser.save();

        res.json({ status: "ok" });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.post('/loginUser', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ status: "error", message: "Incorrect password" });
        }

        const token = jwt.sign({ email: user.email }, "jwt-secret-key", { expiresIn: '1d' });
        res.json({ status: "success", token });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.post('/uploadProfileImage', upload.single('file'), async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "jwt-secret-key");
        const email = decoded.email;

        if (!req.file) {
            return res.status(400).json({ status: "error", message: "No file uploaded" });
        }

        const fileBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const base64Image = fileBuffer.toString('base64');

        const user = await UserModel.findOneAndUpdate(
            { email },
            { profile: base64Image, profileMimeType: mimeType },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error('Error uploading profile image:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.get('/getUserProfile', async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "jwt-secret-key");

        const user = await UserModel.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profile: user.profile || null,
            profileMimeType: user.profileMimeType || 'image/png'
        });
    } catch (err) {
        console.error('Error getting user profile:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.post('/updateUserProfile', upload.single('profile'), async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "jwt-secret-key");
        const { firstName, lastName, email } = req.body;

        let profile = req.file ? req.file.buffer.toString('base64') : req.body.profile;
        let profileMimeType = req.file ? req.file.mimetype : req.body.profileMimeType;

        const user = await UserModel.findOneAndUpdate(
            { email: decoded.email },
            { firstName, lastName, email, profile, profileMimeType },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.post('/checkEmail', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });
        if (user) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
});

app.get('/getUserImages', async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "jwt-secret-key");

        const user = await UserModel.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        const images = await ImageModel.find({ user: user._id });

        res.json({ images });
    } catch (err) {
        console.error('Error getting user images:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});


app.get('/getImages', async (req, res) => {
    try {
        const images = await ImageModel.find({});
        res.json(images);
    } catch (err) {
        console.error('Error getting images:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

app.post('/imageUpload', upload.single('file'), async (req, res) => {
    try {
        const { title, description, category, tags, link, device, privacy } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const image = {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype
        };

        const newImage = new ImageModel({
            title,
            description,
            category,
            tags,
            link,
            device,
            privacy,
            image
        });

        await newImage.save();
        res.json({ status: "ok" });
    } catch (err) {
        console.error('Error saving image:', err);
        res.status(500).json({ status: "error", message: "Internal server error", error: err.message });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('Server is running on port 5000');
});

// const port = process.env.PORT || 5000;

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
