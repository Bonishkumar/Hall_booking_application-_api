const express=require("express");
const path = require("path");
const bodyParser= require("body-parser");
const MongoClient= require("mongodb").MongoClient;
const bcrypt= require("bcrypt");
const app = express();
app.set('view engine', 'ejs');
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
////////////////////////////////////////////////////////////////////////
app.post("/login",async (req,res)=>{
    data.collection("Users_data").findOne({username:req.body.username},async function(err,result){
        if(err) throw err;
        if(result==undefined){
            res.render("index",{message2:"Username not found!!"});
        }
        else{
            try{
                if(await bcrypt.compare(req.body.password,result.password)){
                    var name=result.firstname+" "+result.lastname;
                    res.render("User_interface",{name:name});
                }
                else{
                    res.render("index",{message2:"Password is incorrect!!"});
                }
            }
            catch{
                res.status(500).send();
            }
          
        }
    })    
})

app.post("/stafflogin",async (req,res)=>{
   
    data.collection("staff_data").findOne({staff_id:req.body.id},function(err,result){
        if(err) throw err;
        if(result==undefined){
            res.render("index",{message2:"Staff not found!!!"})
        }
        else{
            if(req.body.password==result.password){
                var name=result.firstname+" "+result.lastname;
                res.render("staff_interface",{name:name});
            }
            else{
                res.render("index",{message2:"Password is incorrect!!!"})
            }
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
                    data.collection("Users_data").findOne({phone:req.body.phone},async function(err,result){
                        if(err) throw err;
                        if(result==undefined){
                            var password = await bcrypt.hash(req.body.password,10);
                            var input={username:req.body.username,firstname:req.body.firstname ,lastname:req.body.lastname ,emai:req.body.email,phone:req.body.phone,password:password};
                            await data.collection("Users_data").insertOne(input,function(err,result){
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
//////////////////////////////////////////////////////////////////////
app.post("/createroom",(req,res)=>{   
    
    var r_number=req.body.r_number;
    data.collection("room_data").findOne({r_number:r_number},function(err,result){
        if (err) throw err;
        if(result!=undefined){
            res.render("staff_interface",{message2:"Room number already exits!! Try creating another room number"});
        }
        else{
            var seats = req.body.seats;
            var price = req.body.price;
            var input={r_number:r_number,seats:seats,price:price};
            data.collection("room_data").insertOne(input,function(err,result){
                if (err) throw err;
                console.log(result);
                
                    res.render("staff_interface",{message1:"You have created the room successfully!!! Your room number is "+r_number});
            })
        }
    }) 


})

app.post("/bookroom",(req,res)=>{
    var r_number = req.body.r_number;
    data.collection("room_data").findOne({r_number:r_number},function(err,result){
        if (err) throw err;
        if(result!=undefined){
                var total = 12*result.price;
                var seats = result.seats;
                var price = result.price;
                var input = {r_number:r_number,seats:seats,price:price,c_name:req.body.c_name,c_phone:req.body.c_phone,c_email:req.body.c_email,date:req.body.date,total:total,status:"Booked"}; 

                data.collection("room_status").findOne({r_number:r_number,date:req.body.date},function(err,result){
                    if (err) throw err;
                    if(result==undefined){
                        data.collection("room_status").insertOne(input,function(err,result){
                            if (err) throw err;
                            if(result!=undefined){
                                console.log("Success");
                                res.render("staff_interface",{message1:"Room sucessfully booked!!!"});
                            }
                        })      
                        }
                        else{
                            res.render("staff_interface",{message2:"Room already booked!!!  Please check room status!!!"})
                        }
            
                        })
                    
               
                     
        }
        else{
            res.render("staff_interface",{message2:"Room not found!!! PLease check room status!!!"});
        }
    })
})

app.post("/checkroom",(req,res)=>{
        data.collection("room_data").findOne({seats:req.body.seats},function(err,result){
            if (err) throw err;
            var number1 = result.r_number;
            var price1 = result.price;
            if(result!=undefined){
                data.collection("room_status").find({seats:req.body.seats},{ projection: { _id: 0, r_number: 1, date: 1, price: 1 } }).toArray(function(err,result){
                    if (err) throw err;
                    if(result.length>0){
                        var a=0;
                        console.log(result);
                       for(let i=0;i<result.length;i++){
                           
                           if(result[i].date!=req.body.date){
                               var number = result[i].r_number;
                               a=1;
                                res.render("staff_interface",{message1:"Room number "+number+" is available and is priced at "+result[i].price});
                           }
                           
                       }
                       if(a==0){
                           console.log("cannot find 1");
                        res.render("staff_interface",{message2:"Cannot find matching room number"});
                       }
                    }
                    else{
                        console.log("Undefined");
                        res.render("staff_interface",{message1:"Room number "+number1+" is available and is priced at "+price1});
                    }
                })
            }
            else{
                console.log("cannot find 2");
                        res.render("staff_interface",{message2:"Cannot find matching room number"});
            }
        })
})
//////////////////////////////////////////////////////////////////////
app.post("/userbookroom",(req,res)=>{
    var r_number = req.body.r_number;
    data.collection("room_data").findOne({r_number:r_number},function(err,result){
        if (err) throw err;
        if(result!=undefined){
                var total = 12*result.price;
                var seats = result.seats;
                var price = result.price;
                var input = {r_number:r_number,seats:seats,price:price,c_name:req.body.c_name,c_phone:req.body.c_phone,c_email:req.body.c_email,date:req.body.date,total:total,status:"Booked"}; 

                data.collection("room_status").findOne({r_number:r_number,date:req.body.date},function(err,result){
                    if (err) throw err;
                    if(result==undefined){
                        data.collection("room_status").insertOne(input,function(err,result){
                            if (err) throw err;
                            if(result!=undefined){
                                console.log("Success");
                                res.render("User_interface",{message1:"Room sucessfully booked!!!"});
                            }
                        })      
                        }
                        else{
                            res.render("User_interface",{message2:"Room already booked!!!  Please check room status!!!"})
                        }
            
                        })
                    
               
                     
        }
        else{
            res.render("User_interface",{message2:"Room not found!!! PLease check room status!!!"});
        }
    })
})

app.post("/usercheckroom",(req,res)=>{
        data.collection("room_data").findOne({seats:req.body.seats},function(err,result){
            if (err) throw err;
            var number1 = result.r_number;
            var price1 = result.price;
            if(result!=undefined){
                data.collection("room_status").find({seats:req.body.seats},{ projection: { _id: 0, r_number: 1, date: 1, price: 1 } }).toArray(function(err,result){
                    if (err) throw err;
                    if(result.length>0){
                        var a=0;
                        console.log(result);
                       for(let i=0;i<result.length;i++){
                           
                           if(result[i].date!=req.body.date){
                               var number = result[i].r_number;
                               a=1;
                                res.render("User_interface",{message1:"Room number "+number+" is available and is priced at "+result[i].price});
                           }
                           
                       }
                       if(a==0){
                           console.log("cannot find 1");
                        res.render("User_interface",{message2:"Cannot find matching room number"});
                       }
                    }
                    else{
                        console.log("Undefined");
                        res.render("User_interface",{message1:"Room number "+number1+" is available and is priced at "+price1});
                    }
                })
            }
            else{
                console.log("cannot find 2");
                        res.render("User_interface",{message2:"Cannot find matching room number"});
            }
        })
})
/////////////////////////////////////////////////////////////////////

app.post("/sendfeedback",(req,res)=>{
    data.collection("Feedback").insertOne({message:req.body.message},function(err,result){
        if (err) throw err;
        if(result!=undefined){
            res.send("Thank You for your feedback!!!");
        }
    })
})
////////////////////////////////////////////////////////////////////
app.get("/logout",(req,res)=>{
    res.render("index",{_message:"Logout Successfull"});
})
///////////////////////////////////////////////////////////

const port = 5000;
app.listen(port,()=>{
    console.log("Server started at port "+port)
})