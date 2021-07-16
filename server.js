const express=require("express");
const path = require("path");
const bodyParser= require("body-parser");

const app = express();

app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname + "/public")));



const port = process.env.PORT || 5000;
app.listen(port,()=>{
    console.log("Server started at port "+port)
})