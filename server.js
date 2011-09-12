//version number
var version = 0.1;

//require express
var express = require("express");

//require nowjs
var nowjs = require('now');

//require crypto
var crypto = require('crypto');

//require formidable
var formidable = require("formidable");

//require fs
var fs = require('fs');

//require path
var path = require('path');

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

server.get("/picture/:id", function (req, res) {
	filePath = path.join(__dirname, "/static/recipepics", req.param('id'));
	stat = fs.statSync(filePath);
	res.sendfile(filePath);
});

server.post('/upload/:id', function (req, res) {
	console.log("so cool");
	var form = new formidable.IncomingForm();
	form.uploadDir = __dirname + '/static/recipepics';
	form.encoding = 'binary';
	
	form.addListener('file', function (name, file) {
		fs.rename(file.path, __dirname + "/static/recipepics/" + req.params.id + ".jpg", function () {
			console.log("Renamed the file yeah!");
		});
	});
	
	form.addListener('end', function () {
		res.end();
	});
	
	form.parse (req, function (err, fields, files) {
		if (err) {
			console.log(err);
		}
	});
});

//Set server listening port (need root for port 80)
server.listen(80);

//Allow the logging level of nowjs to be changed (run node server.js 1 for nothing and 3 for everything)
var everyone = nowjs.initialize(server, {socketio:{"log level": process.argv[2]}});

//Client calls this after clearing the recipe list div to get all the recipes pertaining to search entry.
everyone.now.getRecipeList = function(searchQuery, page) {
	searchQuery = ("" + searchQuery).toLowerCase();
	var self = this;
	if (searchQuery === "") {
		var cursor = collrecipes.find({}).skip((page-1)*10).limit(10);
	 	cursor.toArray(function(err, array) {
			array.map(self.now.appendRecipe);
		});
	} else {
		var cursor = collrecipes.find({tags: searchQuery}).skip((page-1)*10).limit(10);
		cursor.toArray(function(err, array) {
			array.map(self.now.appendRecipe);
		});
	}
};

everyone.now.tryMoveBack = function(searchQuery, page) {
	var page = parseInt(page);
	var self = this;
	searchQuery = ("" + searchQuery).toLowerCase();
	var num = -1;
	if (searchQuery === "") {
		console.log("SEARCH QUERY IS EMPTY");
		collrecipes.find({}).count(function(err, total) {
			num = total;
			console.log("TOTAL ES: ", total);
			if ((page-1) > 0) {
				self.now.refreshRecipeList(searchQuery, page-1)
			} else {
				console.log("YOU DONE GOOFED GOING UP");
			}
		});
		console.log("huehuehuehue: ", num);
	} else {
		console.log("SEARCH QUERY IS NOT EMPTY");
		collrecipes.find({tags: searchQuery}).count(function(err, total) {
			num = total;
			console.log("TOTAL ES: ", total);
			if ((page-1) > 0) {
				self.now.refreshRecipeList(searchQuery, page-1)
			} else {
				console.log("YOU DONE GOOFED GOING UP");
			}
		});
	}
}

everyone.now.tryMoveForward = function(searchQuery, page) {
	var page = parseInt(page);
	var self = this;
	console.log("PAGE: ", page);
	searchQuery = ("" + searchQuery).toLowerCase();
	console.log("SEARCH QUERY: ", searchQuery);
	var num = -1;
	if (searchQuery === "") {
		console.log("SEARCH QUERY IS EMPTY");
		collrecipes.find({}).count(function(err, total) {
			num = total;
			console.log("TOTAL ES: ", total);
			if ((page+1) <= Math.ceil(num/10) && page > 0) {
				self.now.refreshRecipeList(searchQuery, page+1)
			} else {
				console.log("YOU DONE GOOFED GOING UP");
			}
		});
		console.log("huehuehuehue: ", num);
	} else {
		console.log("SEARCH QUERY IS NOT EMPTY");
		collrecipes.find({tags: searchQuery}).count(function(err, total) {
			num = total;
			console.log("TOTAL ES: ", total);
			if ((page+1) <= Math.ceil(num/10) && page > 0) {
				self.now.refreshRecipeList(searchQuery, page+1)
			} else {
				console.log("YOU DONE GOOFED GOING UP");
			}
		});
	}
}


/*
---------------------------------------------
Recipe Database
---------------------------------------------
title = string (Title of Recipe)
cost = float (Cost of Recipe in Dollars)
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

//Client calls this when adding a recipe

everyone.now.tryAddRecipe = function (recipe, currentSearch) {
	//attempt to validate..eventually
	this.now.addRecipe(recipe, currentSearch);
}

everyone.now.addRecipe = function (recipe, currentSearch) {
	collrecipes.insert(
		{	
			title: recipe.title,
			cost: recipe.cost,
			averageCost: recipe.cost,
			averageCostArray: [recipe.cost],
			ingredients: recipe.ingredients,
			instructions: recipe.instructions,
			pictures: [recipe.pictures],
			submitter: recipe.submitter,
			rating: 0,
			ratingArray: [],
			reviewArray: [],
			time: recipe.time,
			tags: recipe.tags,
			recipeId: recipe.rId
		}
	);
	//collrecipes.ensureIndex( { tags: 1 } );
	everyone.now.refreshRecipeList(currentSearch, 1);
}

/*
everyone.now.addRecipe = function(title, cost, ingredients, instructions, pictures, submitter, time, tags, rId, currentSearch) {
	collrecipes.insert(
		{	
			title: title,
			cost: cost,
			averageCost: cost,
			averageCostArray: [cost],
			ingredients: ingredients,
			instructions: instructions,
			pictures: [picture],
			submitter: submitter,
			rating: 0,
			ratingArray: [],
			reviewArray: [],
			time: time,
			tags: tags,
			recipeId: rId
		}
	);
	//collrecipes.ensureIndex( { tags: 1 } );
	everyone.now.refreshRecipeList(currentSearch, 1);
};

*/

/*
----------------------------------------------
Users Database
----------------------------------------------
username = string. the username of the user
password = string. the password of the user. NEED TO SALT + HASH EVENTUALLY.
loggedIn = boolean. tells you if a user is logged in.

*/

//Attempts to register a user. Adds you to the database if your name is not there.

/* TODO:
-Hash passwords
-Username check (no blank names...)
*/

everyone.now.tryRegister = function(uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function (err, doc) {
		if (doc) { //i.e. if there is an entry found for you.
			self.now.reRegister();
		} else {
			var hash = crypto.createHash('sha1');
			hash.update(pwd);
			collusers.insert({username: uname, password: hash.digest('hex'),loggedIn: false});
			self.now.finishRegister(uname, pwd);
		}
	});
};

//Function called if your username is taken.
everyone.now.reRegister = function() {
	this.now.reRegisterAlert();
};

//Clears out the register div and also logs you in automatically.
everyone.now.finishRegister = function (uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function (err, doc) {
		doc.loggedIn = true;
		collusers.update({username: uname}, doc, function (err, doc) {
			self.now.cleanRegister(uname, pwd);
		});
	});
};

//Function called when user attempts to log-in. It's called "tryLogin" because you might fail.

/* TODO:
should have separate error cases for: already logged in vs. username/pwd doesn't match.
*/
everyone.now.tryLogin = function(uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function (err, doc) {
		if (doc) {
			var hash = crypto.createHash('sha1');
			hash.update(pwd);
			if (doc.password == hash.digest('hex')) {
				self.now.finishLogin(uname, pwd);
			} else {
				self.now.reLogin();
			}
		} else {
			self.now.reLogin(uname, pwd);
		}
	});
};

//If you're already logged in, do this. In this case we have it display an alert on the client side.
everyone.now.reLogin = function() {
	this.now.reLoginAlert();
};

//Sets your entry in the database to LOGGED-IN. Afterwards, goes to cleanLogin() on the server side to clear the div and push it up.
everyone.now.finishLogin = function(uname, pwd) {
	var self = this;
	collusers.findOne({username: uname}, function(err, doc) { //no error checking needed because you only call this if you are in the db
		doc.loggedIn = true;
		collusers.update({username: uname}, doc, function (err, doc) {
			self.now.cleanLogin(uname, pwd);
		});
	});
};

everyone.now.tryLogout = function () {
	var cookie = this.user.cookie, self = this;
	collusers.findOne({username: cookie.username}, function (err, doc) {
		var hash = crypto.createHash('sha1');
		hash.update(cookie.pwd);
		if (doc.password == hash.digest('hex')) {
			doc.loggedIn = false;
			collusers.update({username: cookie.username}, doc, function (err, doc) {
				self.now.finishLogout();
			});
		}
	});
};


//this is our onjoin function. 

/* 
***************
COOKIE SPECS
***************
username
pwd - singly hashed

*/

everyone.now.setCookie = function (uname, pwd) {
	if (!this.user.cookie) {
		this.user.cookie = {};
	}
	this.user.cookie.username = uname;
	this.user.cookie.pwd = pwd;
}

nowjs.on('connect', function () {
	if (this.user.cookie && Object.keys(this.user.cookie).length && this.user.cookie.username !== undefined && this.user.cookie.pwd) { //if there is a cookie
		this.now.tryLogin(this.user.cookie.username, this.user.cookie.pwd);
	} else { //if there isn't a cookie
	
	}
});

nowjs.on('disconnect', function () {
	var cookie = this.user.cookie;
	if (!cookie) {
		return;
	}
	collusers.findOne({username: cookie.username}, function (err, doc) {
		if (doc) {
			doc.loggedIn = false;
			collusers.update({username: cookie.username}, doc, function (err, doc) {
				//nothing happens now, you're gone. leave. go away.
			});
		} else {
			//nothing
		}
	});
});


