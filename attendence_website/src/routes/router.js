const router = require("express").Router();
const bodyparser=require('body-parser');
const mongoose=require("mongoose");
const ObjectId = require("mongodb").ObjectID;
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Store = require("../models/student_register");
const Store1 = require("../models/admin_register");
const store_attendence=require("../models/attendence");
const leave_approval=require("../models/leave");
const auth = require("../middleware/auth"); //for controller insiode auth.js
const bcrypt1 = require("bcryptjs/dist/bcrypt");
const async = require("hbs/lib/async");
const { render } = require("express/lib/response");
const session = require("express-session");
var  session_data;
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
router.get("/home", async(req, res) => {
    session_data=req.session;
    const arid_no=session_data.arid_no;
    req.session.touch();
    const p=await store_attendence.find(
        {
            $and:[
                {arid_no:arid_no},
                {attendence_type:"Present"}
            ]
       
        });
    const a=await store_attendence.find(
            {
                $and:[
                    {arid_no:arid_no},
                    {attendence_type:"Absent"}
                ]
           
            });
    const l=await leave_approval.find({arid_no:arid_no});
    const t=await store_attendence.find({arid_no:arid_no});
        res.render("home",{p:p.length,a:a.length,l:l.length,t:t.length});
       
        });
router.get("/profile",async(req,res)=>{
    session_data=req.session;
    const arid_no=session_data.arid_no;
    const find=await Store.findOne({arid_no,arid_no});
    if(find){
        res.render("profile",{
            name:find.studentname,
            arid_no:find.arid_no,
            email:find.email,
            phone:find.phoneno
        });
    }
    
})
router.get("/adminpanel", async(req, res) => {
    const doc = await Store.estimatedDocumentCount();
    const leave = await leave_approval.estimatedDocumentCount();
    console.log(doc);
    res.render("adminpanel",{total:doc,leave:leave});
});
router.post("/search",async(req,res)=>{
    const search=req.body.search;
    const result=await store_attendence.find(
        {
            $or:[
                {student_name:{ $regex : new RegExp(search, "i") }},
                {arid_no:search},
                {date:{ $regex : new RegExp(search, "i") }},
                {attendence_type:{ $regex : new RegExp(search, "i") }}
            ]
        },(err,doc)=>{
           if(!err&&doc){
            res.render("view_record",{
                list:doc
            })
           }
           else{
           alert("No matching record found. Use another words!!");
           }
    }).clone().catch(function(err){ console.log(err)})
    if(result==null){
        alert("not found")
    }
});
router.get("/viewrecord",async(req,res)=>{
    const total_record=await store_attendence.find((err,doc)=>{
       if(!err){
        res.render("view_record",{
            list:doc
        });
        
       }
       else{
        console.log("404page");
       }
       console.log(total_record);
    }).clone().catch(function(err){ console.log(err)})

});
// router.get("/view/:id",async(req,res)=>{
//     console.log(req.params.id);
//     await store_attendence.findById(req.params.id,(err,doc)=>{
//         if(!err){
//             res.render("view",{
//               list:doc
//             });
//         }
//     }).clone().catch(function(err){ console.log(err)})

// });
router.get("/edit/:id",async(req,res)=>{
const find=await store_attendence.findById({_id:req.params.id});
    if(find){
        res.render("mark_edit",{
            title:"Update Student Attendence",
            id:find._id,
            name:find.student_name,
            arid_no:find.arid_no,
            date:find.date
        })
}
else{
res.render("404page");
}


})
// router.post("/edit/:id",async(req,res)=>{
//     console.log(req.params.id);
//     await store_attendence.findByIdAndUpdate({_id:req.params.id},{date:req.body.date,attendence_type:req.body.attendence},(err,doc)=>{
//         if(!err){
//             res.render("viewrecord");
//         }
//         else{
//             console.log("masla a gai oy");
//         }
//     }).clone().catch(function(err){ console.log(err)})

// });
router.post("/edit_attendence/:id", async(req, res) => {
    console.log("we reached"+req.params.id);
    const student_name=req.body.student_name;
    const arid_no=req.body.arid_no;
    var date=req.body.date;
    const attendence=req.body.attendence;
    const update = await store_attendence.update({ _id: req.params.id }, 
        {
             $set: 
             {
                 student_name: student_name,
                 arid_no:arid_no,
                 date:date,
                 attendence_type:attendence 
            } 
        },{ new: true, useFindAndModify: false }
        );
        if(update){
            const total_record=await store_attendence.find((err,doc)=>{
                if(!err){
                 res.render("view_record",{
                     list:doc,
                     success:"Update Record Successfully !!"
                 });
                 
                }
                else{
                 console.log("404page");
                }
                console.log(total_record);
             }).clone().catch(function(err){ console.log(err)})
        }
        // console.log(update);
    // const update=await store_attendence.updateOne({_id:req.params.id},{
    //     student_name:student_name,
    //     arid_no:arid_no,
    //     date:date,
    //     attendence_type:attendence
    // });
          
         
   });


router.get("/delete/:id",async(req,res)=>{
    const del=await store_attendence.findByIdAndDelete({_id:req.params.id});
        if(del){
            const total_record=await store_attendence.find((err,doc)=>{
                if(!err){
                 res.render("view_record",{
                     list:doc,
                     success:"Delete Record Successfully !!"
                 });
                 
                }
                else{
                 console.log("404page");
                }
             }).clone().catch(function(err){ console.log(err)})
    };
});

// router.get("/add/:id", async(req, res) => {
//     const find=await store_attendence.findOne({_id:req.params.id})
//     if(find){
//         const arid_no=find.arid_no;

//     }
//     // session_data=req.session;
//     // const arid_no=session_data.arid_no;
//     // console.log(req.params.arid_no);
//     // const find=await Store.findOne({arid_no:req.params.arid_no});
//     // var dateObj = new Date();
//     // var month = dateObj.getUTCMonth() + 1; //months from 1-12
//     // var day = dateObj.getUTCDate();
//     // var year = dateObj.getUTCFullYear();
//     // newdate = year + "/" + month + "/" + day;
//     // console.log(newdate);
//     // if(find){
//     //     console.log(find.studentname);
//         res.render("mark_attendence",{title:"Add Student Attendence"});
// // }else{
// //     console.log("masla");
// // }
// });


router.get("/pendingleaves",async(req,res)=>{
    const total_record=await leave_approval.find((err,doc)=>{
        if(!err){
         res.render("pending_leaves",{
             list:doc
         });
         
        }
        else{
         res.render("404page");
        }
     }).clone().catch(function(err){ console.log(err)})
   
})


router.get("/acceptleave/:id",async(req,res)=>{

    const data=await leave_approval.findOne({_id:req.params.id});
    // console.log(data);
    const {student_name,email,arid_no,date}=data;
    // console.log(student_name);
    const save_data= new store_attendence({
        student_name:student_name,
        arid_no:arid_no,
        date:date,
        attendence_type:"Present"
    });
    const result=await save_data.save();
    if(result){
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "rafaymuhammad245@gmail.com",
                pass: "gsdefzogyeviacaa",
            },
        });

        var mailOptions = {
            from: "rafaymuhammad245@gmail.com",
            to: email,
            subject: "Respond to Leave Request",
            // template: 'mail'
            text: "Your Leave are accepted and store in your attendence record as a present"
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {

                res.send("reset link send ");
                console.log("Email sent: " + info.response);
            }
        });
        console.log("successfuuly accept leave");
        const delete_record=await leave_approval.findByIdAndDelete({_id:req.params.id},(err)=>{
            if(!err){
                const total_record=leave_approval.find((err,doc)=>{
                    if(!err){
                     res.render("pending_leaves",{
                         list:doc,
                         success:"Leave accepted successfully!!"
                     });
                     
                    }
                    else{
                     res.render("404page");
                     return;
                    }
                    // console.log(total_record);
                 }).clone().catch(function(err){ console.log(err)});
            }
        }).clone().catch(function(err){ console.log(err)});
       
       
    }


});
router.get("/rejectleave/:id",async(req,res)=>{
    const data=await leave_approval.findOne({_id:req.params.id});
    // console.log(data);
    const {student_name,email,arid_no,date}=data;
    // console.log(student_name);
    const save_data= new store_attendence({
        student_name:student_name,
        arid_no:arid_no,
        date:date,
        attendence_type:"Absent"
    });
    const result=await save_data.save();
    if(result){
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "rafaymuhammad245@gmail.com",
                pass: "gsdefzogyeviacaa",
            },
        });

        var mailOptions = {
            from: "rafaymuhammad245@gmail.com",
            to: email,
            subject: "Respond to Leave Request",
            // template: 'mail'
            text: "Your Leave are rejected and store in your attendence record as a absent"
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
    }
        console.log("successfuuly accept leave");
    const delete_record=await leave_approval.findByIdAndDelete({_id:req.params.id},(err)=>{
        if(!err){
            const total_record=leave_approval.find((err,doc)=>{
                if(!err){
                 res.render("pending_leaves",{
                     list:doc,
                     success:"Leave rejected successfully!!"
                 });
                 
                }
                else{
                res.render("404page");
                 return;
                }
                // console.log(total_record);
             }).clone().catch(function(err){ console.log(err)});
        }
    }).clone().catch(function(err){ console.log(err)});
   
})
router.get("/mark_attendence", async(req, res) => {
    session_data=req.session;
    const arid_no=session_data.arid_no;
    req.session.touch();
    const find=await Store.findOne({arid_no:arid_no});
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "/" + month + "/" + day;
    console.log(newdate);
    if(find){
        console.log(find.studentname);
        res.render("mark_attendence",{title:"Mark Attendence",name:find.studentname,arid_no:find.arid_no,date:newdate});
}else{
    console.log("masla");
}
});
    
router.post("/mark_attendence", async(req, res) => {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    newdate = year + "/" + month + "/" + day;
     const student_name=req.body.student_name;
     const arid_no=req.body.arid_no;
     var date=req.body.date;
    //  console.log(date);
    //  console.log(newdate);
     const attendence=req.body.attendence;
     try {
        
         var arr=await store_attendence.find({arid_no:arid_no});
        //  console.log(arr+"empty array");
        if(arr.length!==0){
            // console.log("all finded arr"+arr);
            const last=await arr[arr.length-1];
            // console.log("only last documnt"+last);
            if(last.date==newdate){
                res.render("mark_attendence", 
                {
                    title:"Mark Attendence",name:last.student_name,arid_no:last.arid_no,date:newdate,success:"Already marked attendence"
                });
             }
             else{
                const success=await store_attendence.create(
                    {
                        student_name:student_name,
                        arid_no:arid_no,
                        date:date,
                        attendence_type:attendence
                      },(err,doc)=>{
                        if(!err){
                            res.render("mark_attendence",
                {
                    title:"Mark Attendence",name:last.student_name,arid_no:last.arid_no,date:newdate,success:"Attendence marked successfully!"
                });
                        }
                      
                      });
             } 
        }else{
            console.log("currently no document");
            const success=await store_attendence.create(
                {
                    student_name:student_name,
                    arid_no:arid_no,
                    date:date,
                    attendence_type:attendence
                  },(err,doc)=>{
                    if(!err){
                        res.render("mark_attendence",
            {
                title:"Mark Attendence",name:student_name,arid_no:arid_no,date:newdate,success:"Attendence marked successfully!"
            });
                    }
                  
                  });
        }
            
     } catch (error) {
       console.log(error);
     }
     
       
     }); 
router.get("/mark_leave", async(req, res) => {
   
    session_data=req.session;
    const arid_no=session_data.arid_no;
    req.session.touch();
    const find=await Store.findOne({arid_no:arid_no});
    if(find){
        console.log(find.studentname);
        res.render("mark_leave",{name:find.studentname,arid_no:find.arid_no,email:find.email});
}else{
    console.log("masla");
}
    
});

router.post("/mark_leave", async(req, res) => {
    const student_name=req.body.student_name;
    const arid_no=req.body.arid_no;
    const email=req.body.email;
    const date=req.body.date;
    const reason=req.body.reason;
    session_data=req.session;
    const id=session_data.arid_no;
    const talash = await leave_approval.estimatedDocumentCount({arid_no:id});
    if(talash>=3){
        const find=await Store.findOne({arid_no:arid_no});
        if(find){
            res.render("mark_leave",
            {
                name:find.studentname,
                arid_no:find.arid_no,
                email:find.email,
                success:"No more than 3 leaves are allowed"
            });
        }
       
    }
        else{
        const success=await leave_approval.create(
            {
                student_name:student_name,
                arid_no:arid_no,
                email:email,
                date:date,
                reason:reason
                // date:date,
                // reason:reason
              },(err,doc)=>{
                if(!err){
                    res.render("mark_leave",
            {
                name:student_name,
                arid_no:arid_no,
                email:email,
                success:"Leave request submitted successfully!!"
            });
                }
                session_data=req.session;
                session_data.arid_no=arid_no;
                // console.log(doc);
            })
        }
});
router.get("/view_attendence", (req, res) => {
    session_data=req.session;
    const arid_no=session_data.arid_no;
    req.session.touch();
    console.log(arid_no);
    store_attendence.find({arid_no:arid_no},(err, docs) => {
        console.log(docs);
        if (!err) {
           res.render("view_attendence", {
                list: docs
            });
        }
        else {
            console.log('Error in retrieving employee list :' + err);
        }
    });
    // res.render("view_attendence");
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
       
        if (!userpass) {
            return res.status(404).render("login", { stuff: "Password is Incorrect!!" });
        }
        if (!useremail.verified) {
            return res.render("login", { stuff: "Email Verification Incomplete" });
        }
         //token generate for secret pages
         const token = await useremail.generateusertoken();
         // console.log("this is token  "+token);
         res.cookie("jwt", token, {
             expires: new Date(Date.now() + 5000000),
             httpOnly: true
         });
         session_data=req.session;
         session_data.arid_no=useremail.arid_no;
         console.log(session_data.arid_no);
         res.redirect("/home");
        // res.status(200).render("home", { success: "Login Successfully!!",arid_no:useremail.arid_no });
    } catch (error) {
        res.status(400).render("login", { stuff: "Invalid Email!!" });
    }
});
router.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});

router.post("/adminlogin", async(req, res) => {
    try {
        const password = req.body.password;
        const email = req.body.email;

        const useremail = await Store1.findOne({ email: email });
        const userpass = await bcrypt.compare(password, useremail.password);
        //token generate for secret pages
        const token = await useremail.generateusertoken();
        // console.log("this is token  "+token);
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 5000000),
            httpOnly: true
        });
        if (!userpass) {
            return res.status(404).render("adminlogin", { stuff: "Password is Incorrect!!" });
        }
        if (!useremail.verified) {
            return res.render("adminlogin", { stuff: "Email Verification Incomplete" });
        }
        res.status(200).redirect("/adminpanel");
    } catch (error) {
        res.status(400).render("adminlogin", { stuff: "Invalid Email!!" });
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
                    studentname: req.body.fullname,
                    arid_no: req.body.username,
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
router.get("/adminregister", (req, res) => {
    res.render("admin_register");
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
        res.render("404page");
    }
});

router.post("/adminregister", async(req, res) => {
    Store1.findOne({ email: req.body.email }, async function(err, user) {
        if (user) {
            res.render("admin_register", { err: "email already exists! try another one!!!" });
            return;

        } else {
            const pass = req.body.password;
            const cpass = req.body.confirmpassword;
            const token = Math.floor(Math.random() * 22323824346374637543654872643284);
            if (pass === cpass) {
                const registeruser = new Store1({
                    admin_name: req.body.fullname,
                    faculty_no: req.body.username,
                    email: req.body.email,
                    phoneno: req.body.phoneno,
                    password: req.body.password,
                    cpassword: req.body.confirmpassword,
                    signup_token: token
                });
                //token generted


                const registered = await registeruser.save();
                const useremail = await Store1.findOne({ email: req.body.email });
                if (!useremail) {
                    // res.send("email not exists");
                    res.render("404page");
                    return;
                }

                const link = `http://localhost:8000/admin_verify/${useremail.id}/${token}`;
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
                        res.render("404page");
                        console.log(error);
                    } else {

                        res.send("reset link send ");
                        console.log("Email sent: " + info.response);
                    }
                });

                res.render("register_err", { err: "Verification email sent to you gamil" });
            } else {
                res.render("admin_register", { err: "Password and Confirm Password not matched" });
            }
        }
    });
});
router.get("/admin_verify/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    try {
        const userid = await Store1.findOne({ id: id });
        if (!userid) {
            res.render("404page");
            return; //res.send("email not verified");
        }
        const verifytoken = await Store1.findOne({signup_token: token });
        if (!verifytoken) {
            return res.render("errorpage", { err: "Link expire!!!" });
        }
        const result = await Store1.updateOne({ _id: id }, { $set: { signup_token: null,  verified: true } }, { new: true, useFindAndModify: false });
        if (result) {
            res.render("adminlogin", { err: "Email verification complete.. Please Login again!!" });
        }
    } catch (error) {
        res.render("404page");
        console.log(error);
    }
});
router.get("/forgetpassword", (req, res) => {
    res.render("forget");

});

router.get("/adminforgetpassword", (req, res) => {
    res.render("adminforget");
});
router.post("/adminforgetpassword", async(req, res) => {
    console.log("we reached adminforgetpassword route");
    const email = req.body.user_email;
    //check user exist or not
    const useremail = await Store1.findOne({ email: email });
    if (!useremail) {
        res.render("adminforget", { err: "Email Not Found" });
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
    const link = `http://localhost:8000/adminreset/${useremail.id}/${token}`;
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
            res.render("404page");
            console.log(error);
        } else {
            // res.send("reset link send ");
            res.render("forgoterr", { err: "Reset Password Link Send !!!" })
            console.log("Email sent: " + info.response);
        }
    });
});
router.get("/adminreset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const userid = await Store1.findOne({ _id: id });
    //check id is valid for specific user that store in db
    if (!userid) {
        res.render("errorpage", { err: "User id Not Found. Please try again!!" });
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
router.post("/adminreset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const pass = req.body.password;
    const cpass = req.body.confirmpassword;
    const check = await Store1.findOne({ _id: id });
    // console.log(check);
    if (!check) {
        res.render("errorpage", { err: "User id Not Found Please try again!!" });
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
            const result = await Store1.updateOne({ _id: id }, { $set: { password: this.pass } }, { new: true, useFindAndModify: false });
            const result1 = await Store1.updateOne({ _id: id }, { $set: { cpassword: this.cpass } }, { new: true, useFindAndModify: false });
            // res.send(
            //     `<h2>Password updated successfully New Password is </h2>   <h1 color="blue"> ${check.password}</h1>`
            // );

            res.render("errorpage", { update_pass: `Password updated successfully New Password is :   ${check.password}`,link:"/adminlogin" });
        } else {
            res.render("reset", { err: "Password and Confirm Password not matched !!" });
        }
    } catch (error) {
        res.render("errorpage", { err: "Link Expire!!!" });
    }
});
router.post("/forgetpassword", async(req, res) => {
    console.log("we reached user forget password route");
    const email = req.body.user_email;
    //check user exist or not
    const useremail = await Store.findOne({ email: email });
    if (!useremail) {
        res.render("forget", { err: "Email Not Found!!" });
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
            res.render("404page");
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
        res.render("errorpage", { err: "User id Not Found. Please try again!!" });
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
        res.render("errorpage", { err: "User id Not Found Please try again!!" });
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

            res.render("errorpage", { update_pass: `Password updated successfully New Password is :   ${check.password}`, link:"/login" });
        } else {
            res.render("reset", { err: "Password and Confirm Password not matched !!" });
        }
    } catch (error) {
        res.render("errorpage", { err: "Link Expire!!!" });
    }
});

router.get("/404page",(req,res)=>{
    res.render("404page");
});


//..............................admin forget password.................................................


router.post("/adminforgetpassword", async(req, res) => {
    const email = req.body.user_email;
    //check user exist or not
    const useremail = await Store1.findOne({ email: email });
    if (!useremail) {
        res.render("adminforget", { err: "Email Not Found!! Please try Another One" });
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
    const link = `http://localhost:8000/admin_reset/${useremail.id}/${token}`;
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

router.get("/admin_reset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const userid = await Store1.findOne({ _id: id });
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
router.post("/admin_reset/:id/:token", async(req, res) => {
    const { id, token } = req.params;
    const pass = req.body.password;
    const cpass = req.body.confirmpassword;
    const check = await Store1.findOne({ _id: id });
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
            const result = await Store1.updateOne({ _id: id }, { $set: { password: this.pass } }, { new: true, useFindAndModify: false });
            const result1 = await Store1.updateOne({ _id: id }, { $set: { cpassword: this.cpass } }, { new: true, useFindAndModify: false });
            // res.send(
            //     `<h2>Password updated successfully New Password is </h2>   <h1 color="blue"> ${check.password}</h1>`
            // );

            res.render("admin_error", { update_pass: `Password updated successfully New Password is :   ${check.password}` });
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

        res.render("login", { err: "Logout Successfully!!" }); //logout hotay hi login ka page samnay a jai

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
        session_data=req.session;
        session_data.destroy();
        res.render("login", { err: "Logout Successfully!!" });

    } catch (error) {
        res.status(500).send(error)
    }

});
router.get("/404page", (req, res) => {
    res.render('404page');
});

module.exports = router;