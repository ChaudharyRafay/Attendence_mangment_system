const router = require("express").Router();
const easyinvoice = require("easyinvoice");
var fs = require("fs");
require("dotenv").config();
var pdf = require('html-pdf');
var options = { format: 'A4' };
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
var nodemailer_hbs = require("nodemailer-express-handlebars");
const jwt = require("jsonwebtoken");
const Store = require("../models/schema");
const appointment = require("../models/bookschema");
const auth = require("../middleware/auth"); //for controller insiode auth.js
const logoutauth = require("../middleware/auth");
const bcrypt1 = require("bcryptjs/dist/bcrypt");

const JWT_SECRET = "some secret key...";

//.................for hnadling app crash ..................................
process.on('uncaughtException', (error, origin) => {
    console.log('----- Uncaught exception -----')
    console.log(error)
    console.log('----- Exception origin -----')
    console.log(origin)
})

process.on('unhandledRejection', (reason, promise) => {
    console.log('----- Unhandled Rejection at -----')
    console.log(promise)
    console.log('----- Reason -----')
    console.log(reason)
})
router.get("/", (req, res) => {
    res.render("index");
});
router.get("/", (req, res) => {
    res.render("index");
});
router.get("/services", (req, res) => {
    res.render("services");
});
router.get("/about", (req, res) => {
    res.render("about");
});
router.get("/docters", (req, res) => {
    res.render("docters");
});
router.get("/book", auth, (req, res) => {
    res.render("book");
});
router.post("/book", async(req, res) => {

    const bookpatient = new appointment({
        name: req.body.name,
        number: req.body.number,
        email: req.body.email,
        disease: req.body.disease,
        date: req.body.date
    });
    const success = await bookpatient.save();
    // console.log(bookpatient.name);
    if (success) {
        var random = Math.floor(Math.random() * 4334543535354);
        res.render('slip', { name: bookpatient.name, number: bookpatient.number, email: bookpatient.email, disease: bookpatient.disease, date: bookpatient.date, slipno: bookpatient.name + random, stuff: "Download the Appointment Slip !!" }, function(err, html) {
            pdf.create(html, options).toFile(`uploads/${bookpatient.name}${random}.pdf`, function(err, result) {
                if (err) {
                    return console.log(err + "eerror a gai oy");
                } else {
                    // console.log(res);
                    var datafile = fs.readFileSync(`uploads/${bookpatient.name}${random}.pdf`);
                    res.header('content-type', 'application/pdf');
                    res.send(datafile);
                }
            });
        })
    }
});
router.get("/review", (req, res) => {
    res.render("review");
});
router.get("/blogs", (req, res) => {
    res.render("blogs");
});
router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", async(req, res) => {
    try {
        const password = req.body.password;
        const email = req.body.email;

        const useremail = await Store.findOne({ email: email });
        const userpass = await bcrypt.compare(password, useremail.password);
        //token generate for secret pages
        const token = await useremail.generateusertoken();
        // console.log("this is token  "+token);
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 5000000),
            httpOnly: true
        });
        if (!userpass) {
            return res.status(404).render("login", { stuff: "Password is Incorrect!!" });
        }
        if (!useremail.verified) {
            return res.render("login", { stuff: "Email Verification Incomplete" });
        }
        res.status(200).render("index");
    } catch (error) {
        res.status(400).render("login", { stuff: "Invalid Email!!" });
    }
});
router.get("/register", (req, res) => {
    res.render("register");
});
router.post("/register", async(req, res) => {
    Store.findOne({ email: req.body.email }, async function(err, user) {
        if (user) {
            res.render("register", { err: "email already exists! try another one!!!" });
            return;

        } else {
            const pass = req.body.password;
            const cpass = req.body.confirmpassword;
            const token = Math.floor(Math.random() * 22323823287367252743872643284);
            if (pass === cpass) {
                const registeruser = new Store({
                    fullname: req.body.fullname,
                    username: req.body.username,
                    email: req.body.email,
                    phoneno: req.body.phoneno,
                    password: req.body.password,
                    cpassword: req.body.confirmpassword,
                    signup_token: token
                });
                //token generted


                const registered = await registeruser.save();
                const useremail = await Store.findOne({ email: req.body.email });
                if (!useremail) {
                    // res.send("email not exists");
                    return;
                }

                const link = `http://localhost:8000/verify_signup/${useremail.id}/${token}`;
                console.log(link);
                var transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "rafaymuhammad245@gmail.com",
                        pass: "gsdefzogyeviacaa",
                    },
                });

                var mailOptions = {
                    from: "rafaymuhammad245@gmail.com",
                    to: useremail.email,
                    subject: "Verification Email",
                    // template: 'mail'
                    text: `Hi, ${useremail.fullname} Click the link to complete the verification:                                                             
                        ${link}`
                        //  html:<h3>Wellcome to Hospital Website !! Click the below link to complete the verification</h3>
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {

                        res.send("reset link send ");
                        console.log("Email sent: " + info.response);
                    }
                });

                res.render("register_err", { err: "Verification email sent to you gamil" });
            } else {
                res.render("register", { err: "Password and Confirm Password not matched" });
            }
        }
    });
});
router.get("/verify_signup/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    try {
        const userid = await Store.findOne({ id: id });
        if (!userid) {
            return; //res.send("email not verified");
        }
        const verifytoken = await Store.findOne({ signup_token: token });
        if (!verifytoken) {
            return res.render("errorpage", { err: "Link expire!!!" });
        }
        const result = await Store.updateOne({ _id: id }, { $set: { signup_token: null, verified: true } }, { new: true, useFindAndModify: false });
        if (result) {
            res.render("login", { err: "Email verification complete.. Please Login again!!" });
        }
    } catch (error) {
        console.log(error);
    }
});
router.get("/forgetpassword", (req, res) => {
    res.render("forget");

});

router.post("/forgetpassword", async(req, res) => {
    const email = req.body.user_email;
    //check user exist or not
    const useremail = await Store.findOne({ email: email });
    if (!useremail) {
        res.render("forget", { err: "Email Not Found!! Please try Another One" });
        return;
    }

    //generate one time link if user exits
    const secret = JWT_SECRET + useremail.password;
    const payload = {
        email: useremail,
        id: useremail.id,
    };
    // console.log(`this is payload ${payload}`);
    //generate token
    const token = jwt.sign(payload, secret, { expiresIn: "150m" });
    const link = `http://localhost:8000/reset/${useremail.id}/${token}`;
    console.log(link);

    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "rafaymuhammad245@gmail.com",
            pass: "gsdefzogyeviacaa",
        },
    });

    var mailOptions = {
        from: "rafaymuhammad245@gmail.com",
        to: useremail.email,
        subject: "Reset Password Link",
        text: `Hi, ${useremail.fullname} Click the link to reset your password:                                                                          
                                             ${link} `
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            // res.send("reset link send ");
            res.render("forgoterr", { err: "Reset Password Link Send !!!" })
            console.log("Email sent: " + info.response);
        }
    });
});

router.get("/reset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const userid = await Store.findOne({ _id: id });
    //check id is valid for specific user that store in db
    if (!userid) {
        res.render("errorpage", { err: "User id Not Found" });
        return;
    }
    //else valid id 
    const secret = JWT_SECRET + userid.password;
    try {
        const payload = jwt.verify(token, secret);

        if (!payload) {
            res.render("errorpage", { err: "Link Expire!!!" });
            return;
        }
        res.render("reset");
    } catch (error) {
        res.render("errorpage", { err: "Link Expire!!!" });
    }
});
router.post("/reset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const pass = req.body.password;
    const cpass = req.body.confirmpassword;
    const check = await Store.findOne({ _id: id });
    // console.log(check);
    if (!check) {
        res.render("errorpage", { err: "User id Not Found" });
        return;
    }
    //else valid id
    const secret = JWT_SECRET + check.password;
    try {
        const payload = jwt.verify(token, secret);
        const oldpass = check.password;
        console.log(`oldpassword is:${oldpass}`);
        if (pass == cpass) {
            console.log(`currentpassword is:${pass}`);
            const oldpasscheck = await bcrypt.compare(pass, oldpass);
            console.log(`oldpassword bcrypt compare ${oldpasscheck}`);
            if (oldpasscheck) {
                res.render("reset", { err: "You entered an older password!! Try another one " })
                return;
            }
            check.password = pass;
            check.cpassword = cpass;
            this.pass = await bcrypt.hash(pass, 10);
            this.cpass = await bcrypt.hash(cpass, 10);
            // const neww=this.pass;
            // check.cneww=this.cpass;
            // console.log(check.password);
            // console.log(check.cpassword);
            const result = await Store.updateOne({ _id: id }, { $set: { password: this.pass } }, { new: true, useFindAndModify: false });
            const result1 = await Store.updateOne({ _id: id }, { $set: { cpassword: this.cpass } }, { new: true, useFindAndModify: false });
            // res.send(
            //     `<h2>Password updated successfully New Password is </h2>   <h1 color="blue"> ${check.password}</h1>`
            // );

            res.render("errorpage", { update_pass: `Password updated successfully New Password is :   ${check.password}` });
        } else {
            res.render("reset", { err: "Password and Confirm Password not matched !!" });
        }
    } catch (error) {
        res.render("errorpage", { err: "Link Expire!!!" });
    }
});
router.get("/logout", auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((currobj) => { //curr obj means db may tokens kay andr objects bnay hoay ha ku kay token array of an obj ha tu us obj ko filter krnay k liay yeh likha ha filter mtlb delete krna db may say
                return currobj.token !== req.token; //currobj.token mtlb obj kay andr aik token parha hoyta ha wo token not equal to current token jo cookie may para ha 
            }) //this 2 line of code only for one device logout
            // console.log(req.user);
        res.clearCookie("jwt") //for deleting cookie
            // console.log("logout successfully");
        await req.user.save();

        res.render("index", { err: "Logout Successfully!!" }); //logout hotay hi login ka page samnay a jai

    } catch (error) {
        res.status(500).send(error)
    }

});
router.get("/logouts", auth, async(req, res) => {
    try {
        req.user.tokens = []; //it means jitnay bi token paray ha array may saray delete krdo jb saray token delete hojai ga har kisi bi device say logout hojai ga
        // console.log(req.user);
        res.clearCookie("jwt") //for deleting cookie
            // res.end();//to avoid web request hanging
        console.log("logout successfully");
        await req.user.save();
        res.render("index", { err: "Logout for all devices Successfully!!" });

    } catch (error) {
        res.status(500).send(error)
    }

});
router.get("/404page", (req, res) => {
    res.render('404page');
});

module.exports = router;