const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
//creates reusable code to reduce duplicating code
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const {campgroundSchema, reviewSchema} = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');

//Fake put, patch, delete method
const methodOverride = require('method-override');

//require routers
const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews');

//this makes yelp-camp name of the database
mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected")
})

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//parse the body when sending the form of campground title, etc
app.use(express.urlencoded({extended: true}));

//_method string we will use in form action attribute to update
app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));

//configuring session
const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60* 24 * 7,
        maxAge: 1000 * 60 * 60* 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

//middleware to setup flash 
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//from router folder, use the specified routes
app.use('/campgrounds', campgrounds);
app.use('/campgrounds/:id/reviews', reviews);


app.get('/', (req, res) => {
    res.render('home');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
})

//error handler
app.use((err, req, res, next) => {
    const {statusCode =500} = err;
    if(!err.message) err.message = 'Oh no, Something went wrong!'
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log('Serving on port 3000');
})