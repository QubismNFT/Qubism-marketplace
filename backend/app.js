const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const path = require("path");
const app = express();
const route = require("./index");
const Sync = require('./Sync')

mongoose.connect(`mongodb://localhost:27017/${process.env.DBNAME}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.urlencoded({extended: true}));

app.use('/',  route);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 5000, async function() {
  console.log("server started");

  // Blochchain Syncing Start  
  await Sync.init();
  await Sync.execute();

});
