var version = 0.1;

var express = require("express");

var server = express.createServer();

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSONNative;

var db = new Db('Soncoya', new Server("localhost", 27017, {}), {native_parser: false});

//Configuration
server.set('view options', { layout: false});
server.set('view engine', 'ejs');
server.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
server.set('views', __dirname + '/views');

//Routes
server.get("/", function (req, res) {
  res.render("index");
});

server.listen(80);

