const async = require("hbs/lib/async");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { type } = require("express/lib/response");
const userschema = new mongoose.Schema({
    admin_name: {
        type: String

    },
    faculty_no: {
        type: String
    },
    email: {
        type: String
    },
    phoneno:{
        type:Number,
        required:true,   
    },
    password:{
        type:String,
        unique:true
    },
    cpassword:{
        type:String,
        unique:true
    },
    signup_token:{
        type:String
    },
    verified:{
        type:Boolean,
        default:false
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]

});
userschema.methods.generateusertoken=async function(){
    try {
        
        const token=jwt.sign({_id:this._id.toString()},`${process.env.secret_key}`);
        this.tokens=this.tokens.concat({token:token});
        await this.save();
        return token;
    } catch (error) {
        console.log(error);
    }
}
userschema.pre("save",async function(next) {
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
        this.cpassword=await bcrypt.hash(this.password,10);
    }
    next();
    
});

const Store1=new mongoose.model("admin_register",userschema);
module.exports=Store1;










