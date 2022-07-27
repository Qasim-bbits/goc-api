var express = require('express');
var bodyparser = require('body-parser');
const cookieParser = require("cookie-parser");
var Routes = require('./routes/routes.js');
require('./config')();

var app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}) );
app.use('/uploads', express.static('uploads'))
// app.use('/uploads/logo', express.static(__dirname + '/uploads/logo'));
app.set("view engine", "ejs");
app.use(cookieParser());
console.log(__dirname)

app.all("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
app.use('/', Routes);
app.get('/test', function(req, res){
  res.render('contact_us',{email:'data.email',password:'data.password'});
});
var server = app.listen(3003, function () {
  var host = server.address().address
  var port = server.address().port
  console.log( "listen to http://localhost:" + port)
})