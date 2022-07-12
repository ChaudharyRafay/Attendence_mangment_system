const async = require("hbs/lib/async");
const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const { type } = require("express/lib/response");
const userschema= new mongoose.Schema({
    fullname:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
        
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phoneno:{
        type:Number,
        required:true,
        unique:true    
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

const Store=new mongoose.model("hospitaldata",userschema);
module.exports=Store;
