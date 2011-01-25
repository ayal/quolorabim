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


console.log(fbparams);
	// initialize the library with the API key
	
	window.fbAsyncInit = function() {
	   
	    FB.Canvas.setSize();	    
	    FB.init({ apiKey: API_KEY, status: true, cookie: true, xfbml: true });
	    FB.Canvas.setSize();	    
	    enter(function(){});
	};

	(function() {
	     var e = document.createElement('script'); e.async = true;
	     e.src = document.location.protocol +
		 '//connect.facebook.net/' + fbparams.fb_sig_locale + '/all.js';
	     document.getElementById('fb-root').appendChild(e);
	 }());
	

//FB.init(API_KEY, siteUrl + "xd_receiver.htm");
$(document).ready(
    function (){
	


    });


function evt(name, data){
    console.log(name + ' ' + data);
    $.post('/evt/' + name, data || {}, function(){});
}


function data(after){
    console.log('getting user data');
    FB.api('/me?fields=friends,picture&type=small',
	   function(response) {
	       stopwait();	 
	       console.log('sending user data ' + response);
	       
	       fbuid = ME.uid;
	       $.post('/auth?dummy=' + new Date(),
		      {fbuid: fbuid, data: JSON.stringify(response)},
		      function (data) {
			  if (after) after(true);
		      });
	   });
}

function indb(yes, no){
    wait();
    $.get('/indb', function(res){
	      stopwait();
	      var indb = false;
	      if (res != 'NO') {
		  console.log('user in db: ' + res);
		  yes();
	      }
	      else {
		  no();
	      }
	      
	  });
}

function notindb(yes, no){
    indb(no, yes);
}

function wait(){
    
}

function stopwait(){
    
}


var ME = {};

function signedIn(){
    if (fbparams.fb_sig_user) {
	ME['uid'] = fbparams.fb_sig_user;
	console.log('signed in as ' + ME.uid);	
	return true;
    }
    
    console.log('NOT signed in');
    return false;
    
}

function gotPerms(){
    if (signedIn() && fbparams.fb_sig_ext_perms && fbparams.fb_sig_ext_perms.indexOf('publish_stream') > -1) {
	console.log('got perms');
	return true;
    }
    console.log('NO perms');
    return false;
}


function softlogin(after){
    console.log('soft login');
    wait();
    FB.getLoginStatus(function (x) {
			  stopwait();
			  console.log(x);
			  if (x.session){
			      console.log('after soft login');
			      ME = x.session;
			      after();
			  }
			  
		      });
}

function login(perms, after) {
    wait();
    FB.login(function (x) {
		 stopwait();
		 console.log(x);
		 if (x.session){
		     ME = x.session;
		     evt('login/yes');
		     after();
		 }
		 else {
		     evt('login/no');
		 }
		 
	     }, perms);
}

function rawlogin(after){
    console.log('raw login');
    login({}, after);
}

function permlogin(after){
    console.log('perm login');
    login({perms: 'email,publish_stream'}, after);
}

function enter(after){
    console.log('welcome');
    if (signedIn()) {
	indb(function(){}, function(){ softlogin(data); });
    }
    
    after();
}

function click(after){
    console.log('click!');

    if (gotPerms()){
	notindb( rawlogin(function(){data(after);}), rawlogin(after) );
    }
    else {
	notindb( permlogin(function(){data(after);}), permlogin(after) );
    }
}

