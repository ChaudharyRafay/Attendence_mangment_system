const async = require("hbs/lib/async");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { type } = require("express/lib/response");
const bookschema = new mongoose.Schema({
    name: {
        type: String

    },
    number: {
        type: Number
    },
    email: {
        type: String
    },
    disease: {
        type: String,

    },
    date: {
        type: Date

    }
})
const appointment = new mongoose.model("appointmentdata", bookschema);
module.exports = appointment;