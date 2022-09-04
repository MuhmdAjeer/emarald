const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const hbs = require("express-handlebars");
const db = require("./config/connection");
const session = require('express-session')
const TEN_MINUTES = 600000
const userRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const vendorRouter = require('./routes/vendor')
const app = express();


// view engine setup
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout",
    partialsDir: __dirname + "/views/partials",
  })
);
const hsbHelpers = hbs.create({})
hsbHelpers.handlebars.registerHelper('json', (context) =>{
  return JSON.stringify(context);
});
hsbHelpers.handlebars.registerHelper('sub', (value1,value2)=>{
  return value2 - value1
});
hsbHelpers.handlebars.registerHelper('dayTime', (date)=>{
  return new Date(date).toLocaleDateString('en-us', { weekday:"long", month:"long", day:"numeric"});
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({secret : "xweri3f" , saveUninitialized : true , resave :true , cookie : {maxAge : TEN_MINUTES }}))
app.use((req,res,next)=>{
  res.set('Cache-Control','no-store')
  next()
})


db.connect((err) => {
  if (err) {
    console.log(err, "Database Error");
  } else {
    console.log("Database connected");
  }
});

app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use('/vendor',vendorRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
console.log(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  if(req.session.adminLogin){
    res.render('error/404' , {layout : 'error' , admin : true , err});
  }else if(req.session.vendorLogin){
    res.render('error/404' , {layout : 'error' , vendor : true ,err});
  }else{
    res.render('error/404' , {layout : 'error' , user : true , err});
  }
});

module.exports = app;
