const mongoose = require('mongoose');
const { Schema } = mongoose;
const MsgSchema = require('./schemaMsg.js'); 

const ConvoSchema = new Schema({
    code: {
      type: String,
      required: true
    },
    messages: [MsgSchema]
  }, { timestamps: true });

module.exports = ConvoSchema;
