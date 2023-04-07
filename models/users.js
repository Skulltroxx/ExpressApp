const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    fav_videos: {
        type: [String],
        default: []
    },
    fav_music_playlist: {
        type: [String],
        default: []
    },
    fav_podcasts: {
        type: [String],
        default: []
    }
}, { timestamps: true});

const User = mongoose.model('User', userSchema);

module.exports = User;