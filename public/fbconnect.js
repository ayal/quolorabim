var appidEncodedUrl = "140153199345253&next=http%3A%2F%2Fapps.facebook.com%2Fnotifymeplease%2Fnext";
var API_KEY = 'f0b99f4293afe8d7e6823f7b0ee197d1';

function QS( name )
{
    
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
	return "";
    else
	return decodeURIComponent(results[1].replace(/\+/g, " "));
}


try {
    console.log('verifying console');    

} catch (x) {
    console = {};
    console.log = function (x) {};
}


siteUrl = "http://work.thewe.net/";
appUrl = "http://apps.facebook.com/kolorabim/";

function navapp(relUrl) {
    if (relUrl[0] === '/') {
	relUrl = relUrl.substr(1, relUrl.length - 1);
    }
    nav(appUrl +  relUrl);
}

function nav(url) {
    console.log('naving :' + url);
    top.location = url;
}

var fbuid = null;


//FB.init(API_KEY, siteUrl + "xd_receiver.htm");
$(document).ready(
    function (){
	console.log('what');
	// initialize the library with the API key
	
	window.fbAsyncInit = function() {
	    
	    FB.init({ apiKey: API_KEY, status: true, cookie: true, xfbml: true });
	    FB.Canvas.setSize();	    

	    (function () {
		 console.log('beforez');
		 verifyLogin(afterLogin);
	     })();

	};

	(function() {
	     var e = document.createElement('script'); e.async = true;
	     e.src = document.location.protocol +
		 '//connect.facebook.net/en_US/all.js';
	     document.getElementById('fb-root').appendChild(e);
	 }());
	



    });

function evt(name, data){
    console.log(name);
    $.post('/evt/' + name, data || {}, function(){});
}

function createSession(after) {
    $.get('/sess', function(res){
	      if (res == 'YES') {
		  console.log('session already exists');
		  after(false);
		  return;
	      }
	      
	      console.log('getting info');
	      FB.api('/me', function(response) {
			 
			 console.log('creating server session');
			 
			 fbuid = FB.getSession().uid;
			 FB.api('/me/friends', function(frnds) {
				    response["friends"] = frnds;
				    //      nav("/auth?fbuid=" + fbuid + "data=" + encodeURI(JSON.stringify(response)));
				    $.post('/auth?dummy=' + new Date(), {fbuid: fbuid, data: JSON.stringify(response)},
					   function (data) {
					       after(true);
					   });
				});
		     });
	      
	  });
}

function verifyLogin(after, force, perms) {
    console.log('verifying login');
    FB.getLoginStatus( function (res) {
			   handleSessionResponse(res, after, force, perms);
		       });   
}

var ME = null;

// handle a session response from any of the auth related calls
function handleSessionResponse(response, after, force, perms) {
    bperms = {perms: 'email'};
    if (!perms)
	perms = bperms;
    
    var ask = response.perms != perms.perms;

    console.log('is there a session?');
    
    if (!response.session || ask) {
	console.log('no session');
	console.log(response);
	notconnected();
	if (force) {
	    evt('login/ask');
	    FB.login(function (x) {
			 console.log(x);
			 if (x.session){
			     evt('login/yes');
			     createSession(after);
			 }
			 else{
			     evt('login/no');
			 }
		     }, perms);
	}
        return;
    }
    ME = response.session;
    console.log(ME);
    createSession(after);

    
    // // SELECT uid FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = 
    // if we have a session, query for the user's profile picture and name\    
}

function pop(){
    verifyLogin(function(){}, true, {perms: 'email,publish_stream'});
}