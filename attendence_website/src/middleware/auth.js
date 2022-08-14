const jwt = require("jsonwebtoken");
const async = require("hbs/lib/async");
const Store = require("../models/student_register"); //resgister shows database collection name
const auth = async(req, res, next) => {
    try {

        const token = req.cookies.jwt;
        // console.log("this is auth tokrn  "+token);
        const verify = jwt.verify(token, `${process.env.secret_key}`);
        const user = await Store.findOne({ _id: verify._id });
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        // console.log(error);
        res.render("index", { err: "Please login First !!" });
    }
}


module.exports = auth;