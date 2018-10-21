//1. require
const express = require("express");
const { json } = require('body-parser');

//2. create app
const app = express();
app.use(json());
app.use(express.static(__dirname + '/helpers')); //for import image, js static


//---set enviroment for dev
app.locals.isDev = process.env.NODE_ENV !== "production";
if (process.env.NODE_ENV !== "production") {
    const reload = require("reload");
    reload(app);
}
app.set("view engine", "ejs");
app.set("views", "./src/views");



//3. route
app.get("/", (req, res) => {
    res.render('home');
});


//4. export
module.exports = { app };