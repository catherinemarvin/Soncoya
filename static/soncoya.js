now.appendRecipe = function (recipe) {
	var div = $("#recipelistdiv");
	var recipeId = recipe.recipeId;
	div.append("<div id=\"recipe"+recipeId+"\" class=\"recipeBox\"></div>");
	var title = recipe.title;
	var author = recipe.submitter;
	var price = recipe.cost;
	var rating = recipe.rating;
	var newdiv = $("#recipe"+recipeId);
	var infodiv = $("<div>");
	var titlediv = $("<div>");
	var etcdiv = $("<div>");
	var imgdiv = $("<div>");
	infodiv.addClass("recipeInfo");
	titlediv.addClass("recipeTitle");
	etcdiv.addClass("recipeEtc");
	imgdiv.addClass("recipeImg");
	
	newdiv.append(infodiv);
	infodiv.append(titlediv);
	infodiv.append(etcdiv);
	newdiv.append(imgdiv);
	
	titlediv.append(title);
	etcdiv.append("By: " + author + " | Price: $" + price + " | Rating: " + rating + "/5");
	imgdiv.append("<img src='http://placekitten.com/100/100'></div>");
	div.animate({ scrollTop: div.attr("scrollHeight") }, 500);		
};

now.clearRecipeList = function () {
	$("#recipelistdiv").html("");
}

now.refreshRecipeList = function (search, page) {
	now.clearRecipeList();
	$('#currentpage').text(page);
	now.getRecipeList(search, page);
}

	now.reRegisterAlert = function() {
		alert("Username is already taken. Sadface.");
	};
	
	now.reLoginAlert = function() {
		alert("Username or password incorrect.");
	}
	
	now.cleanLogin = function(uname, pwd) {
		$('#logindiv').slideUp(200);
		$('#unamelogin').val("");
		$('#pwdlogin').val("");
		$('#headertext').html("<a href='#' onclick='now.tryLogout()'>Logout</a>");
		
		//set cookie here
		$.cookie('username', uname);
		$.cookie('pwd', pwd);
		now.setCookie(uname, pwd);
	}
	
	//Cleans register div and removes it. Also replaces REGISTER - SIGNIN with just LOGOUT.
	now.cleanRegister = function(uname, pwd) {
		$('#registerdiv').slideUp(200);
		$('#unamereg').val("");
		$('#pwdreg').val("");
		$('#headertext').html("<a href='#' onclick='now.tryLogout()'>Logout</a>");
		
		//set cookie here
		$.cookie('username', uname);
		$.cookie('pwd', pwd);
		now.setCookie(uname, pwd);
	}
	
	now.nullCookie = function () {
		$.cookie('username', "");
		$.cookie('pwd', "");
	}
	
	//puts back the Register | Signin stuff
	now.finishLogout = function() {
		$('#headertext').html('<a href="#" onclick="displaySignIn();">Sign In</a> - <a href="#" onclick="displayRegister();">Register</a>');
		$.cookie('username', null, {expires: -1});
		$.cookie('pwd', null, {expires: -1});
	}