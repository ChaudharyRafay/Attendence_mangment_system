require("dotenv").config();
const express = require("express");
const { listen } = require("express/lib/application");
const { status } = require("express/lib/response");
const app = express();
const hbs = require("hbs");
const { json } = require("express");
const async = require("hbs/lib/async");
var session = require('express-session');
const routers = require("./routes/router");
const mongoose=require("mongoose");
const cookieparser = require("cookie-parser");
const bodyParser = require("body-parser");
const port = process.env.PORT || 8000;
const path = require("path");

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const template_path1 = path.join(__dirname, "../templates/views/");
const partial_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "some secret key",
      saveUninitialized: true,
      resave: true,
      rolling: true,
      cookie: {
         maxAge: 240000000000000
      },
}));
app.use(express.static(static_path));
app.use(cookieparser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use("/", routers);


require("./db/conn");
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partial_path);

app.listen(port, () => {
    console.log(`listening to port no ${port}`);
});