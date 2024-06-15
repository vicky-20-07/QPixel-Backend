const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [String],
    link: { type: String },
    device: { type: String, required: true },
    privacy: { type: String, required: true },
    image: {
        data: { type: String, required: true },
        mimeType: { type: String, required: true }
    },
});

const ImageModel = mongoose.model('Image', ImageSchema);

module.exports = ImageModel;
