var appidEncodedUrl = "140153199345253&next=http%3A%2F%2Fapps.facebook.com%2Fnotifymeplease%2Fnext";
var API_KEY = 'f0b99f4293afe8d7e6823f7b0ee197d1';
var appId = '140153199345253';

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
    FB.init({ appId: appId, status: false, cookie: true, xfbml: true });

    setInterval(function(){
		    FB.Canvas.setSize();	    
		}, 2000);

    console.log('inited!');

    var timeout = function (i){
	
	if (i == 10){
	    console.log('re-initing');
	    FB.init({ appId: appId, status: false, cookie: true, xfbml: true });
	    timeout(i++);
	}
	
	setTimeout(
	    function () {
		
		console.log('loadstate: ' + FB.Auth._loadState);
		if ( FB.Auth._loadState == 'loaded'){
		    console.log('LOADED!');
		    stopwait();
		    enter(function(){});
		    return;
		}
		else {
		    timeout(i++);
		}
	    } , 1000);
    };

    timeout(0);
};

	(function() {
	     var e = document.createElement('script'); e.async = true;
	     //	     e.src='/fbc.js';
	     e.src = document.location.protocol +
		 '//connect.facebook.net/' + fbparams.fb_sig_locale + '/all.js';
	     document.getElementById('fb-root').appendChild(e);
	 }());
	

//FB.init(API_KEY, siteUrl + "xd_receiver.htm");
$(document).ready(
    function (){
	


    });


function wait(){
    
}

function stopwait(){
    
}

function twait(){
    try{
	wait();
    } catch (x) {
	console.log(x);
    }
}

function tstop(){
    try{
	stopwait();
    } catch (x) {
	console.log(x);
    }
}


function evt(name, data){
    console.log(name + ' ' + data);
    $.post('/evt/' + name, data || {}, function(){});
}


function data(after){
    console.log('getting user data');
    twait();
    FB.api('/me?fields=friends,picture&type=small',
	   function(response) {
	       tstop();	 
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
    twait();
    $.get('/indb', function(res){
	      tstop();
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
    console.log('soft login....');
    twait();
    FB.getLoginStatus(function (x) {
			  console.log('very soft...');
			  
			  if (x.session){
			      console.log('a session!');
			      tstop();
			      ME = x.session;
			      after();
			  }
			  else {
			      console.log('NO session!');
			      tstop();
			  }
			  
		      });
}

function login(perms, after) {
    twait();
    FB.login(function (x) {
		 tstop();
		 console.log(x);
		 
		 if (x.session &&
		     x.perms &&
		     x.perms.indexOf('stream') > -1) {
		     
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
	notindb(function(){rawlogin(function(){data(after);});},  function(){softlogin(after);});
    }
    else {
	notindb(function(){permlogin(function(){data(after);});}, function(){permlogin(after);});
    }
}

