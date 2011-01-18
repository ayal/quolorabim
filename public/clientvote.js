
    afterSession = function loaVote(user) {
	console.log('after session: ' + window.location);	
	$.get(window.location, function(data) {
		  $("#putty").html(data);
		  $.("#title").prepend("<h1>\u05E9\u05DC\u05D5\u05DD " + user.name + "! </h1>");
	      });	
	
	

    };
    

