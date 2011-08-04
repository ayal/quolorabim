 // application page!
// jslint
// friends activity
// css + js cache dummy cachebuster
// //http://developers.facebook.com/docs/reference/fbml/google-analytics/
// SEO stuff
// session expiry?
// TODO: read on scaling node.js and mongodb
// TODO: production stuff gzip..
// RODO: do oauth or authenticate otherwise
// http://www.hongkiat.com/blog/tips-tricks-for-your-business-facebook-fan-page/ (share, popup for voters, )



var express = require('express'),
url  = require('url');
app = 
express.createServer();
 http = require('http');
//require.paths.unshift('vendor/mongoose'),
//mongoose = require('mongoose'),
//mongoose.connect('mongodb://localhost/test');

//var Schema = mongoose.Schema
//  , ObjectId = Schema.ObjectId;

var API_KEY = 'f0b99f4293afe8d7e6823f7b0ee197d1';
var appId = '140153199345253';
var clientSecret = '0896251f48037f59fcbf54d49878dfb9';
var minute = 60000;
appUrl = 'http://apps.facebook.com/kolorabim/';
siteUrl = 'http://work.thewe.net/';

// TODO: separate to files
// TODO: add indexes

/*var FBUserS = new Schema({
			     FBUID: {type: String, index: true},
			     data: {} ,
			     yesno: {}
	       });

var FBUser = mongoose.model('FBUser', FBUserS);

var VoteS = new Schema({
			   'author': {type: String},
			   'date': {type: Date},
			   'yesno': {},
			   'data': {},
			   'vid': 0
		       });

var Vote = mongoose.model('Vote', VoteS);


var EventS = new Schema({
			    'who': {type: String, index: true},
			    'when': {},
			    'where': {type: String, index: false}, 
			    'ref': {type: String, index: false}, 
			    'what': {type: String, index: true},
			    'type': {type: String, index: false}, 
			    'ticks': {type: Number, index: true},
			    'data': {}
			});
		       
var Event = mongoose.model('Event', EventS);
*/

var mongodb = require('mongodb')
  , Db = mongodb.Db
  , Server = mongodb.Server
  , db = new Db('test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {})
  , ObjectID = db.bson_serializer.ObjectID,
mongolia = require('mongolia');

mongoit = function (colname, cb) {
    db.open(function () {

    		var colhandle = mongolia.model(db, colname);
		cb(colhandle);
	    });

};


mongofindone = function (colname, q, cb) {
    mongoit(colname, function(cndl){

		cndl.mongo('findOne', q, 
			   function (error, obj) {
			       if (error) console.log('************************ Error while findingOne', col, q, error);
			       if (cb) cb(obj);
			   });
	    });
};


mongofind = function (col, q, cb){
    mongoit(col, function(cndl){

		cndl.mongo('find', q, 
			   function (error, objs) {
			       if (error) console.log('************************ Error while finding', col, q, error);
			       objs.toArray(function(e, res){
						if (cb) cb(res);	
					    });
			   });
	    });
};

mongonew =  function (col, data, cb) {
    mongoit(col, function(cndl){
		cndl.mongo('insert' , data, function (error, extra) {
			       if (error){
				   console.log('************************ Error while newing', data, error);
			       }
			       else{

				   if (cb) cb(extra);
			       }
			       
		       });
	    });

};
mongoupdate = function (col, q, data, cb) {
    mongoit(col, function(cndl){
		cndl.mongo('update', q , {'$set': data}, {upsert: true, safe: true, multi: true}, function (error, extra) {
			       if (error){
				   console.log('************************ Error while updating', q, data, error);
			       }
			       else{

				   if (cb) cb(extra);
			       }
			       
		       });
	    });

};




Model = {
    create: function(colname){
	
	return {
	    find: function(q, cb) {
		mongofind(colname, q, cb);	
	    },
	    findOne: function (q, cb) {
		mongofindone(colname, q, cb);
	    },
	    upsert: function (q, dt, cb){
		mongoupdate(colname, q, dt, cb);
	    },
	    insert: function (dt, cb){
		mongonew(colname, dt, cb);
	    }
	};
    }
};

Vote = Model.create('votes');
FBUser = Model.create('fbusers');
Event = Model.create('events');

//Mail Config
// 

var nodemailer = require("nodemailer");

// Set up SMTP server settings
nodemailer.SMTP = {
    
    host: "smtp.gmail.com",
    port: 465,
    use_authentication: true,
    ssl: true,
    user: 'kolorabim@gmail.com',
    pass: 'blinqueekolokolo',
    debug: true
};

// Callback to be run after the sending is completed
var callback = function(error, success){
    if(error){
        console.log("Error occured while sending email");
        console.log(error.message);
        return;
    }
    if(success){
        console.log("Message sent successfully!");
    }else{
        console.log("Message failed, reschedule!");
    }
};



sendMail = function(message){
    // Send the e-mail
    var mail;
    try{

	mail = nodemailer.send_mail(message, callback);

	var oldemit = mail.emit;

	mail.emit = function(){
	    console.log("Mail.emit", arguments);
	    oldemit.apply(mail,arguments);
	};
	
    }catch(e) {
	console.log("Caught Exception",e);
    }


};


///

cache = {
    
};

cacheu = function (){
    console.log('initing cache...');
    FBUser.find({},
	function (userobjs){
	    userobjs.forEach(function(u){
				 console.log('putting %s in cache', u.FBUID);
				 cache[u.FBUID] = u;
			     });
	});  
};

cacheu();

actOnEvt = function(req, wt, data){
    if (wt.indexOf('comment') === 0) {
	req.session.cuser(function(u) {
			      postCommentUpdate(req, u, data);
			  });
	
    }
};


	
evt = function (req, wt, data){

    try{
	var tp = wt.split('.')[1] || 'none';
	wt = wt.split('.')[0];

	data = data || {};
	if (req.QUERY.ajx)
	    return;

	var who = req.sessionID;
	data.ip = req.socket && req.socket.remoteAddress;
	if (req.session.fbuid) {
	    who = req.session.fbuid;
	}

	if (!who){
	    console.log('E0001: session id: %s, event: %s', req.session.fbuid, wt);
	}
	
	console.log('EVTTT %s %s %s', req.url, who, wt, JSON.stringify(data));
	var d = new Date();
	Event.insert({who: who,
		      when: {day:d.getDate(),  month: d.getMonth() + 1, year: d.getYear(), hours: (d.getHours() + 2) % 24, minutes: d.getMinutes()},
		      where: req.URI.pathname,
		      ref: req.QUERY['ref'] || req.QUERY['fb_comment_id'] || '-',
		      what: wt,
		      type: tp,
		      ticks: d.getTime(),
		      data: data}, function (ev){});

    } catch (x) {
	
	console.log('Error creating event', x);
	throw x;
    }
   
};

var fakeStream = {
    write: function(str){
	console.log(str);
	console.log('--');
    }};

app.configure(function(){
		  app.use(express.methodOverride());
		  app.use(express.bodyParser());
		  app.use(express.cookieParser());
		  app.use(express.logger({ stream: fakeStream }));
		  app.use(express.session({secret: "sdf"}));
		  app.use(app.router);
		  
		  app.use(express.compiler({src: __dirname + '/public/sass', enable: ['sass']}));
		  app.use(express.static(__dirname + '/public'));
		  
		  app.set('view engine', 'jade');
		  app.set('views', __dirname + '/views')  ;
		  
	      });


getu = function (id, cb) {

    if (typeof id === 'undefined' || !id)
	cb(null);

    if (cache[id]){
	console.log('%s in cache.', id);
	cb(cache[id]);
    }
    else {
	console.log('%s NOT in cache. getting from db..', id);
	FBUser.findOne({FBUID: id},
	    function (user){
		if (!user) console.log('% NOT in db.', id);
		else cache[id] = user;
		cb(user);
	    });		
    }
};




fbcooks = function(req) {
    var cookz = {};
    Object.keys(req.cookies).forEach(
	function(key){
//	    console.log('cookey: %s', key);
	    var fbs = req.cookies[key];
//	    console.log('cookv: %s', fbs);
	    if (key.indexOf('fbs_') == 0) {
//		console.log('FBCOOKZ');
		fbs.split('&').forEach(
		    function(fubu){
			
			var name =  fubu.split('=')[0];	
			var val = fubu.split('=')[1];	
			cookz[name] = val;
		    });
	    }
	});

    return cookz;
};

cfg = {
    api_key: API_KEY,
    fbconnect: true,
    session: false,
    appUrl: appUrl,
    siteUrl: siteUrl
};



gateway = function(req, res, next){
    
    res.header('P3P', 'CP="NOI ADM DEV COM NAV OUR STP"'); 
	    // after ie bug with redirect in fb app - I CHANGED THE CONNECT STATIC PROVIDER
	    // maybe mmove this to the tops to avoid code change - check in fiddler
/*    if (!res.header('P3P'))
	res.setHeader('P3P', 'CP="NOI ADM DEV COM NAV OUR STP"'); */
	    req.URI = url.parse(req.url, true);
	    req.QUERY = req.URI.query; // user req.uri.params?

    
    if (req.body && req.body.fb_sig_added) {
	console.log('BODY: ' + req.body);
	req.session.fbparams = req.body;
    }
    else {
	if (req.session && !req.session.fbparams) {
	    req.session.fbparams = {};	   
	}
    }
    
    if (req.QUERY.request_ids){
	//console.log('NOTIFY!', req.QUERY.notif_t);
//	if (req.QUERY.notif_t === 'app_request'){
	{
	    
	
	    getSObj('graph.facebook.com',
		    '/oauth/access_token?client_id=' + appId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', 
		    function(at){
			var reqz = req.QUERY.request_ids.split(',');
			var dataz = [];
			reqz.forEach(function (rid) {
					 console.log('getting request for user: ', rid);
					 getSObj('graph.facebook.com', '/' + rid + '?' + at, function(dt){
						     console.log('found request for user', dt.data);
						     dataz.push(dt);
						     if (reqz.length === dataz.length){

							 dataz.sort(function(d1, d2){
									return (new Date(d2.created_time)) - (new Date(d1.created_time)); 
								    });

							 var breakz = false;
							 dataz.forEach(function(sdt){
									   
									   if (sdt.data && !breakz) {
									       console.log('---------------------------------->', appUrl + sdt.data);   
									       breakz = true;
									       res.redirect(sdt.data);
									   }
								       });
						     }
						 }, true);
				     });
		    });	    

	    
	}

	return;
    }

    console.log('*******************************************************************');

    if ( req.URI.pathname.indexOf('params/') > -1) {
	var splt = req.URI.pathname.split('params/');
	if (req.headers['user-agent'].indexOf('facebookexternalhit') != -1){
	    var rdrct = siteUrl.substr(0, siteUrl.length - 1) + splt[0].substr(0, splt[0].length - 1);

	    console.log('-------------------------------------------------------------- redirecting external: ' + rdrct, req.url);
	    res.redirect(rdrct);
	    return;
	}
	else {
	    
	    var rdrct = appUrl.substr(0, appUrl.length - 1) + splt[0] + '?ref=' + splt[1].split(',')[0];


	    console.log('-------------------------------------------------------------- redirecting: ' + rdrct, req.url);
	    res.redirect(rdrct);
	    return;
	}
    }


    //bouncer:
/*	    var bounceUrl = 'http://www.facebook.com/connect/uiserver.php?display=page&app_id=140153199345253&method=permissions.request&perms=email,publish_stream&next=';
	    
	    if (req.QUERY.fb_sig_added == '0'){
		bounceUrl += appUrl + req.QUERY;
		res.send('<script>top.location="' + bounceUrl + '"</script>');
		evt(req, 'bounced');
		return;
 }*/

	    var cooks = fbcooks(req);

	    if (req.body && req.body.fb_sig_in_iframe) {
		
		if (req.session.fbuid != req.body.fb_sig_user) {
		    if (req.session.fbuid ){

			req.session.regenerate(function(){
						   evt(req, 'xsess.' + req.session.fbuid + '>' + req.body.fb_sig_user);
						   req.session.fbuid = req.body.fb_sig_user;
					       });
		    }
			
		}		    

		if (cooks.uid && !req.body.fb_sig_user) {
		    
		    console.log('cooks tell me you are %s and not %s', cooks.uid, req.session.fbuid);
		    req.body.fb_sig_user = cooks.uid;
		}

		if (req.body.fb_sig_user)
		    useris(req, req.body.fb_sig_user);

	    }
    
    if (cooks.uid && (!req.session || typeof req.session.fbuid === 'undefined' || !req.session.fbuid)) {
	//		console.log('them cooks tell me you are %s', cooks.uid);
	useris(req, cooks.uid);
    }
    
    console.log('you are %s (SID: %s)', req.session.fbuid, req.session.id);

	    req.session.cuser = function(cb){
		getu(this.fbuid, cb);
	    };
	    

	next();
	    	    
	    
	};

app.all('*', function(x,y,n){gateway(x,y,n);});




app.get('/channel', function(req, res){
	    res.send('<script src="http://connect.facebook.net/en_US/all.js"></script>');
	});

app.all('/', function (req, res) {
	    evt(req, 'root');
	    res.redirect('/whatisit?stream=true');
	});

// TODO: find out about development stuff

app.configure('development', function (){
		  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	      });

app.configure('production', function (){
		  app.use(express.errorHandler());
	      });



app.get('/deebee', function (req, res) {
	    res.render("deebee", {layout: false, req: req, cols: Object.keys(db._collections)});
	});

app.get('/deebee/:cname', function (req, res) {
	    console.log(req.params.cname);
//	    var mod = db.model(req.params.cname.substr(0, req.params.cname.length - 1));
	    var mod = Model.create(req.params.cname);
	    mod.find({}, function(objs){
			 console.log("rendering ", objs.length);
			 res.render("_json", {req: req, layout: 'admin.jade', objs: objs}); 
		     });
	});

app.get('/deebee/:cname/agg', function (req, res) {
	    
});


renderStats = function (req, res) {
    try {
	
	    var query = {
		
	    };

	    var mod = Model.create(req.params.cname);
	    var grpKey = '';

	    if (req.QUERY.filter){
		console.log(req.QUERY.filter);
		eval('var query = ' + req.QUERY.filter);
	    }
	    var srt = [[]];
	    
	    if (req.QUERY.srt){
		console.log(req.QUERY.srt);
		eval('var srt = ' + req.QUERY.srt);
	    }


	    if (req.QUERY.grpKey === '*'){
		console.log('all');
		mod.find(query, 
		    function (objs){

			for (var i = 0; i < objs.length; i++) {
			    
			    var obj = objs[i];
			    var u = cache[obj.who];
			    if (u){
				obj.who = u.data.name;
			    }
			    var fpivot = obj.ref;
			    if (fpivot){
				fpivot = obj.ref.substr(3);
				var refu = cache[fpivot];
				if (refu){
				    obj.ref = refu.data.name;
				}
			    }
			    if (obj.data === []){
				obj.data = {
				    
				};
			    }
			    
			    obj['order'] = i;
			    obj['dayz'] = obj.when.day;
			    obj['hour'] = obj.when.hours || 0;
			    obj['ip'] = obj.data.ip;
			    obj['minute'] = obj.when.minutes || 0;

			    delete obj.data.ip;
			    obj['data'] = JSON.stringify(obj.data);
			    delete obj.when;
			    delete obj.month;
			    delete obj['ticks'];
			    delete obj['_id'];
			}
			console.log('rendering stats');
//			console.log(objs[100]);
			res.render('_analytix', {layout: 'analayout.jade',req: req, grid: true, objs: objs});
			return;
		    }, true);
	    } 
	    else {
		
		

		req.QUERY.grpKey.split(',').forEach(function(key){
						     grpKey += "this." + key + '+ "_" +';
						 });
		grpKey += '"done"';
		var map = "function(){return emit(" + grpKey + ", 1);}";

		var reduce = function(key, vals){
		    var sum=0;
		    for(var i in vals) sum += vals[i];
		    return sum;
		};

		mod._collection.mapReduce(map, reduce, query, function (e, mr){
					      console.log(e);
					      mr.find(function (er, crsr){
							  console.log(e);
							  crsr.toArray(function(e, arr){
									   console.log(e);
									   
									   res.send(arr);
								       });
						      });
					  });



	    }
    } catch (x) {
	console.log('EEEEE:', x);

    }
    
};

app.get('/deebee/:cname/stats', function(x,y){renderStats(x,y);});

invite = function (req, res) {
    evt(req, 'invite.yes', req.body);
    res.send('<script>top.location = "' + req.QUERY.next + '";</script>');
};

nvtfrds = function(x,res){
    x.session.cuser(function(u){
			if (!u)
			    res.send('?');
			res.render('_nvts', {layout: false, req: x, fbparams: {}, u: u});
		
		    });
 
};

app.get('/nvtfrds', function(x,y){nvtfrds(x,y);});

pop = function(x,res){
    res.render('_pop', {layout: false, req: x, fbparams: {}});
};



app.get('/pop', function(x,y){pop(x,y);});

what = function(x,res){
    res.render('_what', {layout: false, req: x, fbparams: {}, stream: false});
};

app.get('/info', function(x,y){what(x,y);});

app.post('/invite', function(x,y){invite(x,y);});

app.post('/deebee/:cname/update', function (req, res) {
	     console.log(req.body);
	     var modname = req.params.cname.substr(0, req.params.cname.length - 1);
	     console.log(modname);
	     var mod = db.model(modname);

	     var v = {};
	     v[req.body.p] = req.body.v;
	     var c = {};
	     c['_id'] = req.body.i;
	     function change(obj, path, val){
		 var upobj = obj;
		 var segs = path.split('.');
		 for (var i = 0; i < segs.length - 1; i++){
		     upobj = upobj[segs[i]];	     
		 }
		 upobj[segs[i]] = val;
		 console.log(upobj);
		 console.log(segs[i]);

	     }
	     mod.findById(req.body.i, 
			  function(err, obj){
			      if (err) console.log('ERROR: ' + err);
			      var orig = obj;
			      change(obj.__doc, req.body.p, req.body.v);

			      orig.save();
			      res.send('sd');
			  }, true);
	});

// dont log yourself
// who brought whom

app.post('/evt/:ename/:etype', function (req, res) {
	     var wt = req.params.ename + (req.params.etype ? '.' + req.params.etype : '');
	     actOnEvt(req, wt, req.body);
	     evt(req,  wt, req.body);
	     res.send('ok');
	});

evtsv = function (req, res) {
	     var wt = req.params.ename + (req.params.etype ? '.' + req.params.etype : '');
	     evt(req,  wt, req.body || {});
	     res.send('ok');
	};

app.get('/evt/:ename/?(:etype)?', function (x, y){
	    try{
		evtsv(x, y);	    	
	    } catch (e) {
		console.log(e);
		evt(x, 'ERR.evt', e);
	    }
	});


app.get('/indb', function (req, res) {
	    req.session.cuser(function(cuser) {
				  if (cuser)
				      res.send('' + cuser.FBUID);
				  else
				      res.send('NO');
			      });
	});

f = function (x, y) {
    try
{
    y.send(JSON.stringify(x.session) + x.sessionID + ' ' + x.session.id);

    } catch (x) {
	y.send('' + x);
    }
    
    
};

app.get('/one', function(x,y){f(x, y);});


useris = function (req, id) {
    if (typeof id == "undefined" || !id){
	console.log('not updating for empty id');
	return;
    }

    if (req.session)
	req.session.fbuid = id;
    else req.session = {fbuid: id};
    //this should be update
    Event.upsert({who: req.sessionID}, {who: req.session.fbuid},
		 function (extra){
		     
//		     console.log('updated %s events', extra);
			
			
	       });
};

auth = function (req, res){

	    var fbuid = req.body.fbuid;
	    var jdata = req.body.data;
	    var response = '';
	    console.log('auth ' + fbuid);
	    FBUser.findOne({FBUID: fbuid},
		function (user) {
		    if (!user) {
			response = 'firsttime';
			console.log('user not in db');
			var data = JSON.parse(jdata);
			try{
			    
			    var friendsArr = data.friends.data; // friends should be updated not just filled once
			    friendsArr.push(null); // because reduce sucks?
			    data["friends"] = friendsArr.reduce(
				function(f1, f2){
				    if (f1) f1[f1.id] = f1.name;
				    if (f2) f1[f2.id] = f2.name;
				    f1.id = null;
				    f1.name = null;
				    return f1;
				});

			} catch (x) {
			    evt(req, 'ERR.0004', x);
			}
			
			FBUser.insert({FBUID: req.body.fbuid,
				       yesno: {},
				       data: data},
				      function (extra){
					  console.log('----------------------- saved user', extra);
					  cache[extra.FBUID] = extra;
					  
				      });
			
		    }

		    evt(req, 'auth');
		    useris(req, req.body.fbuid);
		    res.send(response);
		});
	};

app.all('/auth', function(x,y){auth(x,y);});

app.get('/votes/all/?(:uid)?', function(req, res, next) {

	    console.log('getting votes ' + req.session.fbuid);
	    var friends = {}; 

	    if (req.session.fbuid){

	    }
	    else {
		console.log('no session!');
	    }

	    var voted = '';
	    var sortVotes = {
		
	    };

	    var uid = req.params.uid;
	    if (uid){
		evt(req, 'view.user');
		var innerSortNo = { }, innerSortYes = { };
		innerSortNo["yesno." + uid] = "no";
		innerSortYes["yesno." + uid] = "yes";
		sortVotes = {$or: [innerSortYes, innerSortNo ]};
	    }
	    else {
		evt(req, 'view.votes');
	    }

	    var user = null;
	    //TODO: template here
	    console.log(sortVotes);
	    // change sort and need size for this
	    Vote.find(sortVotes).sort([['data.size', 'descending']], function(votes){

					 console.log('got votes ');
					 var lastv = votes[votes.length - 1];
					 votes.forEach(function(v){
							   v.users = {
							       
							   };
							   if (req.session.fbuid) {
							       voted = voteStatus(v, req.session.fbuid);
							   }
							   v.voted = voted;
							   
							   var userz =  Object.keys(v.yesno);
							  
							   if (!v.yesno[req.session.fbuid]){
							       console.log('%s has not voted', req.session.fbuid);
							       userz.push(req.session.fbuid);
							   }
							   
							   FBUser.find({FBUID: {$in: userz}}, 
							       function (userobjs){

								   userobjs.forEach(function (u){
											if (uid && u.FBUID === uid) {
											    user = u; // how many times?
											}
											if (u.FBUID === req.session.fbuid){
											    console.log('setting friends for ' + u.FBUID);
											    friends = u.data.friends;
											}
											
											v.users[u.FBUID] = u;
										    });
								   
								   if (v === lastv){
								       console.log('rendering');
								       res.render('votes', {//layout: 'alayout.jade',
										      req: req,
										      user: user,
										      votes: votes,
										      friends: friends,
										      cuid: req.session.fbuid,
										      cfg: cfg,
										      fbparams: req.session.fbparams
										  });
								   }
								   
							       });
						       });
					 

				     });
	});




voteStatus = function(vote, fbuid) {

    var hebyes = '\u05d1\u05e2\u05d3';//decodeURIComponent('%D7%91%D7%A2%D7%93');
    var hebno = '\u05e0\u05d2\u05d3';//decodeURIComponent('%D7%A0%D7%92%D7%93');
    var hebvote  = vote.yesno[fbuid] == 'yes' ? hebyes : hebno;

    var lvoted ='\u05d4\u05e6\u05d1\u05e2\u05ea' + ' ' + hebvote;//decodeURIComponent('%D7%94%D7%A6%D7%91%D7%A2%D7%AA') + ' ' + hebvote;
    if (!vote.yesno[fbuid])
	lvoted = decodeURIComponent('%D7%98%D7%A8%D7%9D%20%D7%94%D7%A6%D7%91%D7%A2%D7%AA');;
    return lvoted;
};

app.get('/examplez', function(req, res, next) {
	    res.send('<html><head></head><body><div id="fb-root"></div>'
		     + '      <script src="http://connect.facebook.net/en_US/all.js#appId=140153199345253&xfbml=1"></script>'
/*		     + '      <script>'
		     + '         FB.init({ '
		     + '            appId:\'140153199345253\', cookie:true, '
		     + '            status:true, xfbml:true '
		     + '         });'
		     + '      </script>'*/
		     + ' <fb:comments href="www.example.com/examplez" num_posts="2" width="500"></fb:comments></body></html>');	    
});

app.all('/likeout/:id', function(req, res, next) {
	    res.render("mu", {layout: 'likeout.jade', req: req}); 
});

rndrEmbed = function (req, res, vote){
    var friends = {}; 
    var voted = '';
    if (!vote.yesno)
	vote.yesno = {
	    
	};
    var serverSession = false;
    if (req.session.fbuid) {
	
	cfg.session = true;
    }
    else {
	console.log('no server session');
    }

    var fpivot = req.session.fbuid;
    if (!fpivot){
	if (req.QUERY.ref) 
	    fpivot = req.QUERY.ref.substr(3);
    }
    
//    console.log('fpivot: ' + fpivot);
    if (fpivot){

	var refu = cache[fpivot];
	if (refu && refu.data.friends){
//	    console.log('fpivot: %s', refu.FBUID);
	    friends = refu.data.friends;
	}
    }

    		      voted = voteStatus(vote, req.session.fbuid);

		      vote.users = {};
		      
		      var userz =  Object.keys(vote.yesno);
		      
		      if (req.session.fbuid && !vote.yesno[req.session.fbuid]){

			  userz.push(req.session.fbuid);
		      }
		      
		      userz.forEach(function (uid) {
					var u = cache[uid];
					if (u){

					    vote.users[u.FBUID] = u;
					}
				    });
		      
		      try{
			  res.render('_votes/_voteEmbed', 
							 {layout: true,
							  req: req,
							  vote: vote,
							  friends: friends,
							  voted: voted,
							  cfg: cfg,
							  fbparams: req.session.fbparams,
							  cuid: req.session.fbuid});
			  
		      } catch (x) {
			  evt(req, 'ERR.0003', x);
			  res.send(JSON.stringify(x));
		      }

};

rndr = function (req, res, vote){
    var friends = {}; 
    var voted = '';
    if (!vote.yesno)
	vote.yesno = {
	    
	};
    var serverSession = false;
    if (req.session.fbuid) {
	
	cfg.session = true;
    }
    else {
	console.log('no server session');
    }

    var fpivot = req.session.fbuid;
    if (!fpivot){
	if (req.QUERY.ref) 
	    fpivot = req.QUERY.ref.substr(3);
    }
    
    if (fpivot){

	var refu = cache[fpivot];
	if (refu && refu.data.friends){
	    friends = refu.data.friends;
	}
    }

    		      voted = voteStatus(vote, req.session.fbuid);

		      vote.users = {};
		      
		      var userz =  Object.keys(vote.yesno);
		      
		      if (req.session.fbuid && !vote.yesno[req.session.fbuid]){
			  console.log('%s has not voted', req.session.fbuid);
			  userz.push(req.session.fbuid);
		      }
		      
		      userz.forEach(function (uid) {
					var u = cache[uid];
					if (u){

					    console.log('setting user who voted: ' + u.FBUID);
					    vote.users[u.FBUID] = u;
					}
				    });
		      
		      try{
			  res.render('_votes/_vote', 
							 {layout: true,
							  vote: vote,
							  req: req,
							  friends: friends,
							  voted: voted,
							  cfg: cfg,
							  fbparams: req.session.fbparams,
							  cuid: req.session.fbuid});
			  
		      } catch (x) {
			  evt(req, 'ERR.00035', x);
			  res.send(JSON.stringify(x));
		      }

};



getSObj = function(host, path, cb, opts){
    
    var https = require('https');
    opts = opts || {};

    if (opts.force || cache[path]){
	console.log ('-----------------------------------------------------------> getting from  cache', path);
	cb(cache[path]);
	return;
    }
    else {
	console.log('fetching object, not in cache', path);
    }


    var options = {
	host: host,
	port: 443,
	path: path,
	method: opts.meth || 'GET'
    };

    var req = https.request(options, function(res) {
				var acc = '';
				res.on('data', function(chunk) {
					   acc += chunk;
				       });
				res.on('end', function(){
					   if (opts.parse) {
					       var data = JSON.parse(acc);
					       cb(data);
					   }
					   else cb(acc);
				       });
				
			    });
    req.end();
    
    req.on('error', function(e) {
	       evt(req, 'ERR.0006', e);
	   });
};

getObj = function(host, path, cb) {

    
    if (cache[path]){
	console.log ('-----------------------------------------------------------> getting from  cache', path);
	cb(cache[path]);
	return;
    }
    else {
	console.log('fetching object, not in cache', path);
    }


    var options = {	    
	host: host,
	port: 80,
	path: path,
	method: 'GET'
    };

    var reqq = http.request(options, function(ress) {

				ress.setEncoding('utf8');
				var acc = '';
				ress.on('data', function (chunk) {
					    acc += chunk;
					    
					});
				ress.on('end', function () {

					    var data = JSON.parse(acc);
					    cache[path] = data;

					    cb(data);
					    return;
					});
			    });

    reqq.end();

};

var regit = function (re, str) {
    
    var arr = [];
    var match = null;
    while (match = re.exec(str)) {
	
        var obj = {
	    };
        for (var grp = 1; grp < match.length; grp++) {
	    
          obj[grp] = match[grp];
        }

        arr.push(obj);

    }
    return arr;
};

var jsdom = require('jsdom');

app.get('/scrape', function(req, res, next) {
	    var url = req.QUERY.url;
	    var path = req.QUERY.path;
	    var rgx = req.QUERY.rgx;
	    console.log('scraping: ', url, path);
	    jsdom.env(url,
		  ['http://code.jquery.com/jquery-1.6.1.min.js'],
		      function(errors, window) {
			 console.log(errors); 
			  if (typeof(window) === 'undefined'){
			      res.send('what');
			      return;
			  }
			      
			  var $ = window.$;
			  if (path)
			      res.send($(path).html());
			  else
//			      res.send($('body').html());
			      res.send(regit(new RegExp(rgx, 'g'), $('body').html()));
		      });
	    
});

renderEmbed =  function(req, res, next) {
    evt(req, 'view.vote', req.params);

    if (!req.params || req.params.id === 'undefined'){
	
	console.log('mother fucker', req.url, req.headers);
	throw new Error('LAMA?!?!?!?!');
    }
    
    Vote.findOne({vid: req.params.id}, function(vote){
 		     getObj('oknesset.org', '/api/bill/' + req.params.id + '/', function (data) {
				data.title = data.bill_title;
				data.commitees = data.committee_meetings;

				vote = {
				    _id : {toHexString: function(){return req.params.id;}},
				    vid: req.params.id,
				    yesno : !vote ?  {} : vote.yesno,
				    data: data};
				

				rndrEmbed(req, res, vote); 
				
			    });
		  });
};

renderVote =  function(req, res, next) {
    evt(req, 'view.vote');
    
    console.log('rendeting vote: ', req.params);

    if (!req.params || req.params.id === 'undefined'){
	
	console.log('mother fucker', req.url, req.headers);
	throw new Error('LAMA?!?!?!?!');
    }
    
    Vote.findOne({vid: req.params.id}, function(vote){
		     
		     if (true) {
			 
 			  getObj('oknesset.org', '/api/bill/' + req.params.id + '/', function (data) {
				     data.title = data.bill_title;
				     data.status = data.stage_text;
				     
				     data.commitees = data.committee_meetings;
				     data.laws = [];

				     data.proposals.private_proposals.forEach(function(prop){
									data.laws.push(prop);	
								    });
				     data.laws.push(data.proposals.gov_proposal);
				     data.laws.push(data.proposals.knesset_proposal);
				     console.log('initing dummy vote');
				     vote = {
					 _id : {toHexString: function(){return req.params.id;}},
					 vid: req.params.id,
					 yesno : !vote ?  {} : vote.yesno,
					 data: data };
				     
				     // res.send(data);
				     
				     data.votez = [];
				     var len = data.votes.all.length;
				     var i = 0;
				     console.log('all: ' + data.votes.all);
				     data.votes.all.forEach(function(vid) {
								if (vid != null) {

								    getObj('oknesset.org',
									   '/api/vote/' + vid + '/',
									   function (v) {
									       

									       if (v != null) data.votez.push( v);
									       if (i == len - 1) {
										   rndr(req, res, vote);
									       }
									       i++;
									       
									   });
								}
								else {

								    if (i == len - 1) {
									rndr(req, res, vote);
								    }
								    i++;
								}
							    });
				 });

		      

//			  res.send('what?');
//			  return;
		      }
		      else {
			  rndr(req, res, vote);
		      }
		      
		      
		      

		      
		      
		      
		  });
};

app.all('/votes/:id', function(x,y,z){renderVote(x,y,z);});
app.all('/bill/:id', function(x,y,z){renderEmbed(x,y,z);});
	

app.post('/deebee/:cname/die', function(req, res) {
	     console.log(req.body);
	     var modname = req.params.cname.substr(0, req.params.cname.length - 1);
	     console.log(modname);
	     var mod = db.model(modname);
	     
	     mod.findById( req.body.vid, 
			    function (vote){

				vote.remove(function () {res.send("OK");});	
			    }, true);
	 });

app.post('/fbml', function(req, res) {
	     res.render('_votes/fbml', {layout: false});
	 });

app.all('/whatisit', function(req, res) {
	    evt(req, 'view.whatisit');
	    var stream =  req.QUERY.stream === 'true' ? true : false;
	    res.render('faq', {
			   layout:true,
			   req: req,
			   fbparams: req.session.fbparams,
			   stream: stream});
	 });

app.get('/newvote', function(req, res) {
	    evt(req, 'view.newvote');
	    res.render('newvote', {
			   req: req,
			   layout: true,
			   fbparams: req.session.fbparams});
	});


app.post('/votes/new', function(req, res) {
	     //	     checkSession(res, res);
	     console.log('new vote ' + req.body);
	     var fbuid = req.session.fbuid ? req.session.fbuid : 'remote';
	     var vote = new Vote({author: fbuid,
				  date: new Date(req.body.date),
				  yesno: {},
				  size: 0,
				  data: req.body});
	     vote.save(function () {
			   console.log('saved vote');
			   res.send('OK');
		       });
	 });



postCommentUpdate = function (req, u, data) {
    var vid= regit(/bill\/(\d+)/g, data.href)[0]['1'];
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>> Posting comment update', req.session.fbuid, req.body.yesno, siteUrl + 'uimg/' + req.session.fbuid);
    getObj('oknesset.org', '/api/bill/' + vid + '/', function (data) {
	       getSObj('graph.facebook.com',
		       '/oauth/access_token?client_id=' + appId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', 
		       function(at){
			   

			   
			   getSObj('graph.facebook.com', '/feed?' + at +
				   '&message=' +  encodeURIComponent(u.data.name + " just commented on:") +
				   '&link=' + encodeURIComponent(appUrl + 'bill/' + vid + '?ref=CMR' + req.session.fbuid) +
				   '&picture=' + encodeURIComponent(siteUrl + 'uimg/' + req.session.fbuid) + 
				   '&id=' + appId + 
				   '&method=post',
				   function(dt){
				       console.log('Comment update response: ' + dt);

				       // post feed to vote page likers
				       getSObj('graph.facebook.com', '/?id=' + encodeURIComponent(siteUrl + 'bill/' + vid),
					       function (page) {
						   console.log('>>>>>>>>>>>>>>>>>>>>>> ADMIN PAGE ACCESS FOR COMMENT UPDATE', page);
						   getSObj('graph.facebook.com', '/feed?' + at +
							   '&message=' +  encodeURIComponent(u.data.name + " just commented!") +
							   '&link=' + encodeURIComponent(appUrl + 'bill/' + vid + '?ref=PST' + req.session.fbuid) +
							   '&picture=' + encodeURIComponent(siteUrl + 'uimg/' + req.session.fbuid) + 
							   '&id='  + page.id + 
							   '&method=post',
							   function(dt){
							       console.log('Comment update ON PAGE WALL response: ' + dt);
							   });
						   
					       },
					       {parse: true});

				   });


		       });
	   });
};


postVoteUpdate = function (req, u) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>> Posting vote update', req.session.fbuid, req.body.yesno, siteUrl + 'uimg/' + req.session.fbuid);
    getObj('oknesset.org', '/api/bill/' + req.body.vid + '/', function (data) {
	       getSObj('graph.facebook.com',
		       '/oauth/access_token?client_id=' + appId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', 
		       function(at){

			   // post feed to vote page likers
			   getSObj('graph.facebook.com', '/?id=' + encodeURIComponent(siteUrl + 'bill/' + req.body.vid),
				   function (page) {
				       console.log('>>>>>>>>>>>>>>>>>>>>>> ADMIN PAGE', page);
				       getSObj('graph.facebook.com', '/feed?' + at +
					       '&message=' +  encodeURIComponent(u.data.name + " just voted!") +
					       '&link=' + encodeURIComponent(appUrl + 'bill/' + req.body.vid + '?ref=PST' + req.session.fbuid) +
					       '&picture=' + encodeURIComponent(siteUrl + 'uimg/' + req.session.fbuid) + 
					       '&id='  + page.id + 
					       '&method=post',
					       function(dt){
						   console.log('Vote update ON PAGE WALL response: ' + dt);
					       });
				       
				   },
				   {parse: true});

			   // post feed to app likers
			   getSObj('graph.facebook.com', '/feed?' + at +
				   '&message=' +  encodeURIComponent(u.data.name + " just voted!") +
				   '&link=' + encodeURIComponent(appUrl + 'bill/' + req.body.vid + '?ref=PST' + req.session.fbuid) +
				   '&picture=' + encodeURIComponent(siteUrl + 'uimg/' + req.session.fbuid) + 
				   '&id='  + appId + 
				   '&method=post',
				   function(dt){
				       console.log('Vote update ON APP WALL response: ' + dt);
				       

				       // iterate over users and send mail:
				       var message = {
					   sender: 'Kolorabim <kolorabim@gmail.com>',
					   to: 'kol.orabim@gmail.com',
					   subject:  u.data.name + " voted on " + data.bill_title,
					   body: '<p>Hi!</p><p>Click here to vote for yourself: <p>',
					   html: "<a href='" + appUrl + "bill/" + req.body.vid + "?ref=EML'" + req.session.fbuid + ">" +
 					       data.bill_title + "</a>.<p>Please reply to this email if the notifications bother you. </p><p>If you have time please elaborate on the reason and maybe we can work something out.</p><p>Social-Web Democracy +1 ;)</p><p>Kolorabim.</p>",
					   debug: false
				       };
				       
				       FBUser.find({},
						   function (userobjs){
						       var emails = '';
						       userobjs.forEach(function(uz){
									    if (uz.data.email) {
										emails += uz.data.email + ', ';
										
									    }
									});

						       emails = emails.substr(0, emails.length - 1);
						       message.bcc = emails;
						       console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>> EMIALZ:', emails);
//						       message.bcc = 'ayalgelles@gmail.com';
						       //
//						       sendMail(message);  
						   });  
				       
				   });
		       });
	   });
};



app.all('/uimg/:fbuid', function(req, res) {
	    console.log(req.params);
	    FBUser.findOne({FBUID: req.params.fbuid},
			   function (user) {
			       res.send('<img src="'+user.data.picture+'"/>');
			   }); 
	});

app.post('/votez/vote', function(req, res) {
	     if (!req.session.fbuid){
		 evt(req, 'ERR.0007', req.session);
		 res.send('?');
		 return;
	     }
		
	     try {

		 var toupdate = {};
		 toupdate['yesno.' + req.session.fbuid] = req.body.yesno;

		 Vote.upsert({vid: req.body.vid}, toupdate,
				function (extra){

				    evt(req, 'vote.' + req.body.yesno);
				    req.session.cuser(function(u) {
							  if (!u)
							      throw new Error("did not find user: " + req.session.fbuid);
							  //u.yesno[req.body.vid] = req.body.yesno;
							  var utoupdate = {};
							  utoupdate['yesno.' + req.body.vid] = req.body.yesno;
							  
							  FBUser.upsert( {FBUID: u.FBUID}, utoupdate, function (extra) {
								     console.log('saved USER vote', extra);
								 });
							  postVoteUpdate(req, u);
							  res.send('OK');
							  
						      });
				    
				});
	     } catch (ex) {
		 evt(req, 'ERR.0008', ex);
		 res.send('?');

	     }

	     // TODO: create double index on user
	 });

process.on('uncaughtException', function (err) {
	       console.log('*   *   *   *   *   * Caught exception: ');
	       console.log(err.message);
});


try {

app.listen(80);
    
} catch (x) {
    console.log('wtf', x);;
}
//require.paths.unshift('../../../swank-js');
//var swank = require('swank');
