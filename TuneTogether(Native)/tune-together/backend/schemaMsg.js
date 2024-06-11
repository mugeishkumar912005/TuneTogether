const mongoose = require('mongoose');
const { Schema } = mongoose;

const MsgSchema = new Schema({
    Msg: {
        type: String,
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = MsgSchema;
