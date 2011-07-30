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

//Configuration (Express)
server.set('view options', { layout: false});
server.set('view engine', 'ejs');
server.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
server.set('views', __dirname + '/views');

//Routes
server.get("/", function (req, res) {
  res.render("index");
});

//Set server listening port (need root for port 80)
server.listen(80);

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
