const express=require("express");
const path = require("path");
const bodyParser= require("body-parser");
const { check, validationResult } = require('express-validator')
// const ejs = require("ejs");
const MongoClient= require("mongodb").MongoClient;
const app = express();
app.set('view engine', 'ejs');
// app.set("Views",path.join(__dirname + "/views"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname + "/public")));

const url= "mongodb://localhost:27017/Hall_booking_application";

var data;
MongoClient.connect(url,function(err,db){
    if(err) throw err;
    data = db.db("Hall_booking_application");
    console.log("Database connected");
})

app.get("/",(req,res)=>{
    res.render("index");
    
})

app.get("/Users_api",(req,res)=>{
    res.render("User_interface");

})

app.post("/login",(req,res)=>{
    
    data.collection("Users_data").findOne(req.body,function(err,result){
        if(err) throw err;
        if(result==undefined){
            res.render("index",{message2:"User or password is incorrect!!"})
        }
        else{
            res.redirect("/Users_api");
        }
    })   
})     




app.post("/signup",(req,res)=>{
    if(req.body.password!=req.body.c_password){
        res.render("index",{message:"Password doesn't match!!"});
    }
    else{
    data.collection("Users_data").findOne({username:req.body.username},function(err,result){
        if(err) throw err;
        if(result==undefined){
            console.log(req.body);
            data.collection("Users_data").findOne({email:req.body.email},function(err,result){
                if(err) throw err;
                if(result==undefined){
                    data.collection("Users_data").findOne({phone:req.body.phone},function(err,result){
                        if(err) throw err;
                        if(result==undefined){
                            data.collection("Users_data").insertOne(req.body,function(err,result){
                                if(err) throw err;
                                console.log(result);
                                res.render("index",{message1:"You can now login!! Do enjoy our service"});
                            })
                        }
                        else{
                            res.render("index",{message:"Phone number already exist!!"});
                        }
                    })
                }
                else{
                    res.render("index",{message:"Email already exist!!"});
                }
            })
            
        }
        else{
            res.render("index",{message:"Username already exist!!"});
        }
    })
  }
})



const port = process.env.PORT || 5000;
app.listen(port,()=>{
    console.log("Server started at port "+port)
})