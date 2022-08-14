const async = require("hbs/lib/async");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { type } = require("express/lib/response");
const userschema = new mongoose.Schema({
    student_name: {
        type: String

    },
    arid_no: {
        type: String
    },
    email: {
        type: String
    },
    // date: {
    //     type: String
    // },
    // attendence_type:{
    //     type:String
    // }
   
     date:{
            type:String,
            required:true,
            default: Date.now()
        },
    reason: {
            type:String
    }

    
   

});
// userschema.methods.generateusertoken=async function(){
//     try {
        
//         const token=jwt.sign({_id:this._id.toString()},`${process.env.secret_key}`);
//         this.tokens=this.tokens.concat({token:token});
//         await this.save();
//         return token;
//     } catch (error) {
//         console.log(error);
//     }
// }


const leave_approval=new mongoose.model("leave",userschema);
module.exports=leave_approval;










