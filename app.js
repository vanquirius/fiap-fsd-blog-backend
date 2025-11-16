// app.js
require('dotenv').config(); // load .env variables first
const mongoose = require("mongoose");

// ----- CONNECT TO MONGODB -----
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
        });
        console.log("📌 Connected to MongoDB");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}

connectDB();


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

var indexRouter = require('./routes/index');
var postsRouter = require('./routes/posts');
var authRouter = require('./routes/auth');   // NEW — auth must be mounted first

var app = express();

const cors = require("cors");

// CORS for frontend only
app.use(cors({
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: { title: "Blog API", version: "1.0.0" },
        servers: [
            { url: process.env.API_BASE_URL || "http://localhost:3000" }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT or SECRET",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// 1. Auth
app.use('/auth', authRouter);

// 2. Public index router
app.use('/', indexRouter);

// 3. Posts router (protected routes inside)
app.use('/posts', postsRouter);


// -----------------------------
// 404 handler
// -----------------------------
app.use(function(req, res, next) {
    next(createError(404));
});

// -----------------------------
// Error handler
// -----------------------------
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
