var version = 0.1;

//require express
var express = require("express");

//require nowjs
var nowjs = require('now');

//require openid
var openid = require('openid');

var url = require('url');
var querystring = require('querystring');

//start express
var server = express.createServer();

//require and start mongodb
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

//Establish Recipes and Users Collections in the Soncoya Database.
var collrecipes;
var collusers;
var db = new Db('soncoya', new Server("localhost", 27017, {}), {native_parser:false});
db.open(function(err, conn) {
	db = conn;
	db.collection('recipes', function(err, coll) {
		collrecipes = coll;
	});
	db.collection('users', function(err, coll) {
		collusers = coll;
	});
});

var relyingParty = new openid.RelyingParty(
    'http://localhost:1337/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    [] // List of extensions to enable and include
);

//Configuration (Express)
server.set('view options', { layout: false});
server.set('view engine', 'ejs');
server.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
server.use(express.static(__dirname + '/static'));
server.set('views', __dirname + '/views');

//Routes
server.get("/", function (req, res) {
	res.render("index");
});

//Set server listening port (need root for port 80)
server.listen(1337);

//Allow the logging level of nowjs to be changed (run node server.js 1 for nothing and 3 for everything)
var everyone = nowjs.initialize(server, {socketio:{"log level": process.argv[2]}});

//Client calls this after clearing the recipe list div to get all the recipes pertaining to search entry.
everyone.now.getRecipeList = function(searchQuery) {
	var self = this;
	if (searchQuery == "") {
		collrecipes.find( { }, function(err, docs){
			if (docs) {
				for (var i in docs) {
					self.now.appendRecipe(docs[i]);
				}
			} else {
				self.now.appendRecipe(null);
			}
		});
	} else {
		collrecipes.find( { tags: searchQuery }, function(err, docs){
			if (docs) {
				for (var i in docs) {
					self.now.appendRecipe(docs[i]);
				}
			} else {
				self.now.appendRecipe(null);
			}
		});
	}
}



/*
---------------------------------------------
Client calls this when adding a recipe
---------------------------------------------
title = string (Title of Recipe)
cost = integer (Cost of Recipe in Dollars)
averageCost = integer (No input. Will eventually become the average cost of the people that review the recipe.)
averageCostArray = [object(user, cost)] (array containing the costs by users)
ingredients = [object(item, quantity-us, quantity-metric, measure-us, measure-metric)] (array containing the items in recipe with both us and metic values)
instructions = [html string] (first element is #1 instruction, etc.)
pictures = [picture location string] (array of pictures for recipe, first is the main one displayed on page)
submitter = string (user that submitted the recipe)
rating = integer (rating of recipe, default 0)
ratingArray = [object(user, rating)] (array of user ratings for recipe)
reviewArray = [object(user, string review)] (array of user reviews for recipe)
time = object(prepTime, cookTime, totalTime) (object of the time for the recipe)
tags = [string] (tags pertaining to the recipe for searching)
recipeId = random integer for each recipe
*/
everyone.now.addRecipe = function(title, cost, ingredients, instructions, picture, submitter, time, tags, rId) {
	collrecipes.insert(
		{	
			title: title,
			cost: cost,
			averageCost: cost,
			averageCostArray: [cost],
			ingredients: ingredients,
			instructions: instructions,
			pictures: [picture],
			rating: 0,
			ratingArray: [],
			reviewArray: [],
			time: time,
			tags: tags,
			recipeId: rId
		}
	);
	collrecipes.ensureIndex( { tags: 1 } );
	everyone.now.refreshRecipeList(tags);
}

/*
----------------------------------------------
Users Database
----------------------------------------------
username = the username of the user
password = the password of the user
loggedIn = boolean.
uId: userID. Used for NowJS

*/

//Attempts to register a user. Adds you to the database if your name is not there.
everyone.now.tryRegister = function(uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function (err, doc) {
		if (doc) { //i.e. if there is an entry found for you.
			self.now.reRegister();
		} else {
			collusers.insert({username: uname, password: pwd, uId: 0,loggedIn: false});
			self.now.finishRegister();
		}
	});
};

//Function called if your username is taken.
everyone.now.reRegister = function() {
	this.now.reRegisterAlert();
}

//Clears out the register div and also logs you in automatically.
everyone.now.finishRegister = function () {
	//eventually have it clear out the divs and auto-login
}

//Function called when user attempts to log-in. It's called "tryLogin" because you might fail.
everyone.now.tryLogin = function(uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function (err, doc) {
		if (doc.password == pwd) {
			self.now.finishLogin(uname);
		} else {
			self.now.reLogin();
		}
	});
}

//If you're already logged in, do this. In this case we have it display an alert on the client side.
everyone.now.reLogin = function() {
	this.now.reLoginAlert();
}

//Sets your entry in the database to LOGGED-IN. Also clears the divs.
everyone.now.finishLogin = function(uname) {
	//eventually have it clear the divs
	var self = this;
	collusers.findOne({username: uname}, function(err, doc) { //no error checking needed because you only call this if you are in the db
		doc.loggedIn = true; 
		doc.uId = self.user.clientId;
		collusers.update({username: uname}, doc, function (err, doc) {
			//do nothing, you've updated :D
		});
	});
}
