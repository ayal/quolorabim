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
	console.log(fbparams);
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
		 '//connect.facebook.net/' + fbparams.fb_sig_locale + '/all.js';
	     document.getElementById('fb-root').appendChild(e);
	 }());
	



    });

function evt(name, data){
    console.log(name);
    $.post('/evt/' + name, data || {}, function(){});
}

function createSession(after) {
    $.get('/sess', function(res){
	      if (res != 'NO') {
		  ME.id = res;
		  console.log('session already exists');
		  after(false);
		  return;
	      }
	      
	      console.log('getting info');
	      FB.api('/me?fields=friends', function(response) {
			 
			 console.log('creating server session');
			 
			 fbuid = ME.uid;
			 $.post('/auth?dummy=' + new Date(),
				{fbuid: fbuid, data: JSON.stringify(response)},
				function (data) {
				    after(true);
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
    bperms = {perms: 'publish_stream'};

    var ask = typeof perms != 'undefined';
    if (!perms)
	perms = bperms;    

    console.log('is there a session?');
    
    ME = response.session;
    if (!response.session || ask) {
	console.log('no session');
	console.log(response);
	notconnected();
	if (force) {
	    evt('login/ask');
	    FB.login(function (x) {
			 console.log(x);
			 if (x.session){
			     ME = x.session;
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
    
    console.log(ME);
    createSession(after);
}

function pop(){
    verifyLogin(function(){
		    $.post('/deebee/fbusers/update', {i: ME.id, p: 'data.post', v: 'true'});
		}, true, {perms: 'email,publish_stream'});
}