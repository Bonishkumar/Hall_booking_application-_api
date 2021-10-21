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
            var input={r_number:r_number,seats:seats,price:price,status:"Not_booked",c_name:"",c_phone:"",c_email:"",s_datetime:"",e_datetime:"",duration:"",total:""};
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
            if(result.status!="Booked"){
                var total = req.body.duration*result.price;
                var input = {$set:{c_name:req.body.c_name,c_phone:req.body.c_phone,c_email:req.body.c_email,s_datetime:req.body.s_datetime,
                            e_datetime:req.body.e_datetime,duration:req.body.duration,total:total,status:"Booked"}};       
    
            data.collection("room_data").updateOne({r_number:r_number},input,function(err,result){
                if (err) throw err;
                if(result!=undefined){
                    console.log("Success");
                    res.render("staff_interface",{message1:"Room sucessfully booked!!!"});
                }
            })       
            }
            else{
                res.render("staff_interface",{message2:"Room not available!!!  PLease check room status!!!"})
            }
                     
        }
        else{
            res.render("staff_interface",{message2:"Room not found!!! PLease check room status!!!"});
        }
    })
})

app.get("/logout",(req,res)=>{
    res.render("index",{_message:"Logout Successfull"});
})

const port = process.env.PORT || 5000;
app.listen(port,()=>{
    console.log("Server started at port "+port)
})