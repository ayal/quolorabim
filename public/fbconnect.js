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

var msgs = $($('<div><div id=\'msgs\' style=\'font-size:10px;overflow:auto\'></div></div>').children()[0]);

function msg(x){
    msgs.append($('<div>' + x + '</div>'));
    msgs.attr('scrollTop', msgs.attr('scrollHeight'));
}

if (typeof console == 'undefined'){
    console = {log: function (){}};
}

function lg(x){
    console.log(x);
    try{
	if (typeof x == 'object')
	    x = JSON.stringify(x);
    } catch (e) {
	
    }
    
    msg(x);
}

// idleTimer() takes an optional argument that defines the idle timeout
// timeout is in milliseconds; defaults to 30000
$.idleTimer(6000);


/*$(document).bind("idle.idleTimer", function(){
		     // function you want to fire when the user goes idle
		 });
*/
 
$(document).bind("active.idleTimer", function(){
		     evt('ping/client');
		     (function(){
		       lg('arrowing');
		       if (paper && $.browser.hasCanvas){
			   lg('arrowing...');
			   paper.arrow(200, 250, 150, 220, 8);
		       }
		   })();
		 });

var isCtrl = false;
var isAlt = false;

$(document).keyup(function (e) {
		      if(e.which == 17) isCtrl = false;
		      if(e.which == 18) isAlt = false;
		  }).keydown(function (e) {
				 if(e.which == 17) isCtrl = true;
				 if(e.which == 18) isAlt = true;
				 
				 if(e.which == 16 && isCtrl && isAlt) {
				     msgs.parent().dialog();
				     return false;
				 }
				 return true;
});

siteUrl = "http://work.thewe.net/";
appUrl = "http://apps.facebook.com/kolorabim/";

function navapp(relUrl) {
    if (relUrl[0] === '/') {
	relUrl = relUrl.substr(1, relUrl.length - 1);
    }
    nav(appUrl +  relUrl);
}

function nav(url) {
    lg('naving :' + url);
    top.location = url;
}

function navperms(){
    var url = 'http://www.facebook.com/connect/uiserver.php?app_id=' + appId + '&next=' + 
	encodeURIComponent(appUrl.substr(0, appUrl.length - 1) + window.location.pathname) +
	'&display=page&perms=email&method=permissions.request';
    nav(url);
}

var fbuid = null;
// initialize the library with the API key

// idleTimer() takes an optional argument that defines the idle timeout
// timeout is in milliseconds; defaults to 30000

window.onbeforeunload = function(e) {
    		     try{
			 evt('beforeunload/client');
		     } catch (x) {
			 
		     }
    
};


$(window).unload(function() {
		     try{
			 evt('unload/client');
		     } catch (x) {
			 
		     }
		     
		 });

window.fbAsyncInit = function() {
    lg('initing....');
    lg(fbparams);
//    FB.Canvas.setSize();	    
    if (typeof(fbparams) === 'undefined'){
	fbparams = {};
	}
    
    FB.init({ appId: appId, status: false, cookie: true, xfbml: true/*, channelUrl: siteUrl + 'channel' */});

    
    var agent = {};    
    var type = 'dunno';
    jQuery.each(jQuery.browser,
		function(i, val) {
		    agent[i] = val;
		});
    
    evt('agent/' + type, agent);
    
    lg('inited!');

    var timeout = function (i){
	
	if (i == 10){
	    lg('re-initing');
	    FB.init({ appId: appId, status: false, cookie: true, xfbml: true });
	    timeout(i++);
	}
	
	setTimeout(
	    function () {
		
		lg('loadstate: ' + FB.Auth._loadState);
		if ( FB.Auth._loadState == 'loaded'){
		    lg('LOADED!');
		    if (fbready) fbready();
//		    FB.Canvas.setSize({ width: 640, height: 1500 });
		    FB.Canvas.setAutoResize();
		    FB.Event.subscribe('comment.create', function(response) {
					   evt('comment/create', response);
				       });
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
	     lg('async');
	     var e = document.createElement('script'); e.async = true;
	     //	     e.src='/fbc.js';
	     var locale = 'en_US';
	     if (fbparams && fbparams.fb_sig_locale)
		 locale = fbparams.fb_sig_locale;

	     e.src = document.location.protocol +
		 '//connect.facebook.net/' + locale + '/all.js';
	     lg('src: ' + e.src);
	     document.getElementById('fb-root').appendChild(e);
	 }());
	

//FB.init(API_KEY, siteUrl + "xd_receiver.htm");
$(document).ready(
    function (){
	if (self === top) {
	    evt('rdrcthost/' +self.location.pathname);
	    navapp(self.location.pathname);
	}
	
    });


function wait(i){
    
}

function stopwait(i){
    
}

function twait(x){
    try{
	wait(x);
    } catch (x) {
	lg(x);
    }
}

function tstop(i){
    try{
	stopwait(i);
    } catch (x) {
	lg(x);
    }
}


function evt(name, data){
    try {
	lg(name + ' ' + JSON.stringify(data));	
	$.post('/evt/' + name + '?dummy=' + new Date(), data || {},
	       function(){});

    } catch (x) {
	lg('cannot send event ' + name + ' ' +  x);
    }
}


function data(after){
    lg('getting user data');
    twait(5);
    FB.api('/me?fields=friends,picture,name&type=small',
	   function(response) {
	       lg('sending user data ' + JSON.stringify(response));
	       fbuid = ME.uid;
	       if (response.error){
		   evt('ERR/DATA', response);
		   after(false);
		   return;
	       }
	       $.post('/auth?dummy=' + new Date(),
		      {fbuid: fbuid, data: JSON.stringify(response)},
		      function (data) {
			  lg('data was sent: ' + data);
			  if (after) after(true);
			  else  lg('no after');
		      });
	   });
}

function indb(yes, no){
    twait(6);
    $.get('/indb?' + new Date(), function(res){
	      var indb = false;
	      if (res != 'NO') {
		  lg('user in db: ' + res);
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
newu  = false;

function signedIn() {
    if  (fbparams.fb_sig_user) {
	ME['uid'] = fbparams.fb_sig_user;
	lg('signed in as ' + ME.uid);	
	return true;
    }
    
    lg('NOT signed inn', fbparams);
    return false || newu;
    
}

function gotPerms(){
    if (signedIn()) {// && fbparams.fb_sig_ext_perms) {
	lg('got perms');
	return true;
    }
    lg('NO perms');
    return false;
}


function softlogin(after){
    lg('soft login....');
    twait(7);
    FB.getLoginStatus(function (x) {
			  lg('very soft...');
			  
			  if (x.session){
			      lg('a session! ' + JSON.stringify(x));
			      ME = x.session;
			      after();
			  }
			  else {
			      lg('NO session!');
				  tstop(91);
			  }
			  
		      });
}

function nopop() {
    evt('navperms');
    navperms();
    tstop(9);
}

function login(perms, after) {
    twait(8);
    evt('login/ask');
    dialog('/pop', [7,7], 210, 180, function(){tstop(22);});
//    var hndl = setTimeout(nopop, 25000);
    FB.login(
	function (x) {
	    //		 clearTimeout(hndl);
	    if (x.session) {
		ME = x.session;
		evt('login/yes', x);
		newu = true;
		$('.pop').dialog("close");
		after();
	    }
	    else {
		evt('login/no', x);
		tstop(10);
	    }
	    
	}, {perms: 'email'});
}

function rawlogin(after){
    lg('raw login');
    login({perms: 'email'}, after);
}

function permlogin(after){
    lg('perm login');
    login({prems: 'email'}, after);
}

function enter(after){
    lg('welcome');

    if (signedIn()) {
	indb(function(){tstop(11);},
	     function(){ 
		 softlogin(function(){
			       data(function(){tstop(12);});});});
    }else{
	tstop();
	setTimeout(function(){
		       lg('arrowing');
		       if (paper && $.browser.hasCanvas){
			   lg('arrowing...');
			   paper.arrow(200, 250, 150, 220, 8);
		       }
		   },2500);
	
    }
   
}

function click(after){
    lg('click!');

    if (gotPerms()){
	notindb(function(){rawlogin(function(){data(after);});}, 
		function(){softlogin(after);});
    }
    else {
	permlogin(function(){notindb(
				 function(){data(after);},
				 function(){after();});});

/*	notindb(function(){permlogin(function(){data(after); tstop();});},
		function(){permlogin(after); tstop();});*/
    }
}

