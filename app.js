// application page!
// TODO: error handling inside and outside 4044
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
app = express.createServer();
require.paths.unshift('vendor/mongoose'),
mongoose = require('mongoose').Mongoose,
db = mongoose.connect('mongodb://localhost/test');

var API_KEY = 'f0b99f4293afe8d7e6823f7b0ee197d1';
// One minute
var minute = 60000;
var appUrl = 'http://apps.facebook.com/kolorabim/';


// TODO: separate to files
// TODO: add indexes

mongoose.model('FBUser', {
		   properties: ['FBUID', 'data', 'yesno'],
		   indexes: ['FBUID']
	       });

var FBUser = db.model('FBUser');

mongoose.model('Vote', {
		   properties: ['author', 'date', 'yesno', 'data'],
		   indexes: ['author']
	       });

var Vote = db.model('Vote');

mongoose.model('Event', {
		   properties: ['who', 'when', 'where', 'ref', 'what', 'type', 'ticks', 'data'],
		   indexes: ['who', 'what', 'ticks']
	       });

var Event = db.model('Event');



function evt(req, wt, data){

    var tp = wt.split('.')[1] || 'none';
    wt = wt.split('.')[0];

    data = data || {};
    if (req.QUERY.ajx)
	return;

    var who = data.ip = req.socket && req.socket.remoteAddress;
    if (req.session.fbuid) {
	who = req.session.fbuid;
    }
    else {
	data.agent = req.headers['user-agent'] || '';
    }

    console.log('%s %s', who, wt);
    var d = new Date();
    var e = new Event({who: who,
		       when: {day:d.getDate(),  month: d.getMonth() + 1, year: d.getYear(), hours: (d.getHours() + 2) % 24, minutes: d.getMinutes()},
		       where: req.URI.pathname,
		       ref: req.QUERY['ref'] || '-',
		       what: wt,
		       type: tp,
		       ticks: d.getTime(),
		       data: data});
    e.save();
}

var fakeStream = {
    write: function(str){
	console.log(str);
	console.log('--');
    }};

app.configure(function(){
		  app.use(express.methodOverride());
		  app.use(express.bodyDecoder());
		  app.use(express.cookieDecoder());
		  app.use(express.logger({ stream: fakeStream }));
		  app.use(express.session());
		  app.use(app.router);
		  
		  app.use(express.compiler({src: __dirname + '/public/sass', enable: ['sass']}));
		  app.use(express.staticProvider(__dirname + '/public'));
		  
		  app.set('view engine', 'jade');
		  app.set('views', __dirname + '/views')  ;
		  
	      });

var cache = {
    
};

function getu(id, cb) {

    if (cache[id]){
	console.log('%s in cache.', id);
	cb(cache[id]);
    }
    else {
	console.log('%s NOT in cache. getting from db...: %s', id);
	FBUser.find({FBUID: req.session.fbuid}).first(
	    function (user){
		if (!user) console.log('% NOT in db.', id);
		cache[id] = user;
		cb(user);
	    });		
    }
}



function fbcooks(req) {
    var fbs = req.cookies['fbs_' + API_KEY];
    var cookz = {};

    console.log('cook');
    console.log(req.cookies);

    if (fbs) {
	fbs.split('&').forEach(
	    function(fubu){
		
		var name =  fubu.split('=')[0];	
		var val = fubu.split('=')[1];	
		cookz[name] = val;
	    });
    }
    return cookz;
}

app.all('*', function(req, res, next){
	    res.header('P3P', 'CP="NOI ADM DEV COM NAV OUR STP"'); 
	    // after ie bug with redirect in fb app - I CHANGED THE CONNECT STATIC PROVIDER
	    // maybe mmove this to the tops to avoid code change - check in fiddler
	    req.URI = url.parse(req.url, true);
	    req.QUERY = req.URI.query; // user req.uri.params?

	    //bouncer:
/*	    var bounceUrl = 'http://www.facebook.com/connect/uiserver.php?display=page&app_id=140153199345253&method=permissions.request&perms=email,publish_stream&next=';
	    
	    if (req.QUERY.fb_sig_added == '0' && !req.QUERY.pass){
		bounceUrl += appUrl + req.QUERY;
		res.send('<script>top.location="' + bounceUrl + '"</script>');
		evt(req, 'bounced');
		return;
 }*/


	    var cooks = fbcooks(req);
	    if (cooks.uid && !req.QUERY.fb_sig_user) {
		console.log('cooks tells me you are ' + cooks.uid);
		req.QUERY.fb_sig_user = cooks.uid;
	    }
	    
	    req.session.fbuid = req.QUERY.fb_sig_user;

	    req.session.cuser = function(cb){
		getu(this.fbuid, cb);
	    };

	    console.log('you are ' + req.session.fbuid);
	    next();
	    /*	    var cooks = fbcooks(req);
	     if (cooks.uid && !req.QUERY.fb_sig_user) {
	     console.log('cooks tells me you are ' + cooks.uid);
		req.QUERY.fb_sig_user = cooks.uid;
	    }
	    
	    if (req.QUERY.fb_sig_user) {
		
		req.session.fbuid = req.QUERY.fb_sig_user;
		if (req.session && req.session.user){
		    if (req.session.user.FBUID != req.QUERY.fb_sig_user) {
			evt(req, 'Xsess.' + req.session.user.FBUID);
			req.session.user = null;
		    }

		    next();
		    
	    	}

		if (!req.session.user){
		    console.log('updating user in session for uid: %s', req.session.fbuid);
		    FBUser.find({FBUID: req.session.fbuid}).first(
			function (user){
			    if (user){
			    console.log('found user in db');
				req.session.user = user;
				req.QUERY["indb"] = true;
			    }
			    
			    else{
				req.QUERY["indb"] = false;
				console.log('could not find user in db');
			    }
			    
			    next();
			});
		}
		
		
		
		
	    }
	    else {

		evt(req, 'Xsess2');
		req.session.user = null;
		req.session.fbuid = null;
		next();
	    }
*/	    
	    
	    
	    
	});

var global = 1;
app.all('/cache', function (req, res){
	    res.send('' + (global++));
	});

app.all('/', function (req, res) {
	    evt(req, 'root');
	    res.redirect('/whatisit?layout=true');
	});

// TODO: find out about development stuff
app.configure('development', function (){
		  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	      });

app.configure('production', function (){
		  app.use(express.errorHandler());
	      });



app.get('/deebee', function (req, res) {
	    res.render("deebee", {layout: false, cols: Object.keys(db._collections)});
	});

app.get('/deebee/:cname', function (req, res) {
	    console.log(req.params.cname);
	    var mod = db.model(req.params.cname.substr(0, req.params.cname.length - 1));
	    mod.find().all(function(objs){
			       res.render("json", {layout: 'admin.jade', objs: objs}); 
			   });
	});

app.get('/deebee/:cname/agg', function (req, res) {
	    
});

app.get('/deebee/:cname/query', function (req, res) {

	    var query = {
		
	    };

	    var mod = db.model(req.params.cname.substr(0, req.params.cname.length - 1));
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
		mod.find(query).sort(srt).all(
		    function (objs){
			for (var i = 0; i < objs.length; i++) {
			   
			    var obj = objs[i].__doc;
			    
			    obj['order'] = i;

			    obj['day'] = obj.when.day;
			    obj['month'] = obj.when.month;
			    obj['hour'] = obj.when.hours || 0;
			    obj['minute'] = obj.when.minutes || 0;
			    
			    obj['ip'] = obj.data.ip;

			    delete obj.when;
			    delete obj.data;
			    delete obj['ticks'];
			    delete obj['_id'];
			}

			res.render('analytix', {layout: 'analayout.jade', grid: true, objs: objs});
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
					      mr.find(function (e, crsr){
							  console.log(e);
							  crsr.toArray(function(e, arr){
									   console.log(e);
									   
									   res.send(arr);
								       });
						      });
					  });



	    }
	});

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
			  function(obj){
			      var orig = obj;
			      change(obj.__doc, req.body.p, req.body.v);

			      orig.save();
			      res.send('sd');
			  }, true);
	});

// dont log yourself
// who brought whom
app.post('/evt/:ename/?(:etype)?', function (req, res) {
	     var wt = req.params.ename + (req.params.etype ? '.' + req.params.etype : '');
	     evt(req,  wt, req.body);
	     res.send('ok');
	});


app.get('/indb', function (req, res) {
	    req.session.cuser(function(cuser) {
				  if (cuser)
				      res.send(cuser.fbuid);
				  else
				      res.send('NO');
			      });
	});

function useris(req) {
    var who = req.socket && req.socket.remoteAddress;
    Event.find({who: who}).all(function (evts){
				   evts.forEach(function (ev) {
						    console.log('updating %s with %s', ev.who, req.session.fbuid);
						    ev.who = req.session.fbuid;
						    ev.save();
				   });
			       });
}

app.all('/auth', function (req, res){

	    var fbuid = req.body.fbuid;
	    var jdata = req.body.data;
	    var response = '';
	    console.log('auth ' + fbuid);
	    FBUser.find({FBUID: fbuid}).first(
		function (user) {
		    if (!user) {
			response = 'firsttime';
			console.log('user not in db');
			var data = JSON.parse(jdata);
			console.log(data);
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
			
			user = new FBUser({FBUID: req.body.fbuid,
					   yesno: {},
					   data: data});
			user.save(function (){console.log('saved user');});
			
		    }
		    cache[user.fbuid] = user;
		    req.session.fbuid = user.fbuid;
		    evt(req, 'auth');
		    useris(req);
		    res.send(response);
		});
	});

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
	    Vote.find(sortVotes).sort([['data.size', 'descending']]).all(function(votes){
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
							  
							   if (v.yesno[req.session.fbuid]){
							       console.log('% has not voted', req.session.fbuid);
							       userz.push(req.session.fbuid);
							   }
							   
							   FBUser.find({FBUID: {$in: userz}}).all(
							       function (userobjs){
								   
								   userobjs.forEach(function (u){
											if (uid && u.FBUID === uid) {
											    user = u; // how many times?
											}
											if (u.FBUID === req.session.fbuid){
											    console.log('setting friends for ' + u.FBUID);
											    friends = u.friends;
											}
											
											v.users[u.FBUID] = u;
										    });
								   
								   if (v === lastv){
								       console.log('rendering');
								       res.render('votes', {//layout: 'alayout.jade',
										      user: user,
										      votes: votes,
										      friends: friends,
										      cuid: req.session.fbuid,
										      cfg: cfg,
										      fbparams: req.QUERY
										  });
								   }
								   
							       });
						       });
					 

				     });
	});

var cfg = {
    api_key: API_KEY,
    fbconnect: true,
    session: false,
    appUrl: appUrl
};

function voteStatus(vote, fbuid) {

    var hebyes = '\u05d1\u05e2\u05d3';//decodeURIComponent('%D7%91%D7%A2%D7%93');
    var hebno = '\u05e0\u05d2\u05d3';//decodeURIComponent('%D7%A0%D7%92%D7%93');
    var hebvote  = vote.yesno[fbuid] == 'yes' ? hebyes : hebno;

    var lvoted ='\u05d4\u05e6\u05d1\u05e2\u05ea' + ' ' + hebvote;//decodeURIComponent('%D7%94%D7%A6%D7%91%D7%A2%D7%AA') + ' ' + hebvote;
    if (!vote.yesno[fbuid])
	lvoted = decodeURIComponent('%D7%98%D7%A8%D7%9D%20%D7%94%D7%A6%D7%91%D7%A2%D7%AA');;
    return lvoted;
}

app.get('/example', function(req, res, next) {
	    res.redirect('/votes/4d336b13b6adce0e6e000001?layout=true');	    
});




app.get('/votes/:id', function(req, res, next) {
	    evt(req, 'view.vote');
	    
	    
	    //TODO: template here
	    var friends = {}; 
	    var voted = '';
	    var serverSession = false;
	    if (req.session.fbuid) {
		
		cfg.session = true;
	    }
	    else {
		console.log('no server session');
	    }
	    
	    Vote.findById(req.params.id, function(vote){
			      if (!vote){
				  res.send('what?');
				  return;
			      }
			      voted = voteStatus(vote, req.session.fbuid);

			      vote.users = {};
			      
			      var userz =  Object.keys(vote.yesno);
			      
			      if (vote.yesno[req.session.fbuid]){
				  console.log('% has not voted', req.session.fbuid);
				  userz.push(req.session.fbuid);
			      }
			      
			      
			      FBUser.find({FBUID: {$in: Object.keys(userz)}}).all(
				  function (userobjs){
				      userobjs.forEach(function (u){				      
						
							   if (u.FBUID === req.session.fbuid){
							       console.log('setting friends for ' + u.FBUID);
							       friends = u.friends;
							   }
							   
							   vote.users[u.FBUID] = u;
							   
						       });
				      
				      
				      if (req.QUERY.flat) {
					  vote.voted = voted;
					  res.render('votes', {//layout: 'alayout.jade',
							 votes: [vote],
							 friends: friends,
							 user: null,
							 cuid: req.session.fbuid,							 
							 cfg: cfg,
							 fbparam: req.QUERY});
				      }
				      else{
					  res.render('_votes/_vote', 
						     {layout: req.QUERY.layout === "true",
						      vote: vote,
						      friends: friends,
						      voted: voted,
						      cfg: cfg,
						      fbparams: req.QUERY,
						      cuid: req.session.fbuid});
					  
				      }
				      
				  });

			  });
	});


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

app.get('/whatisit', function(req, res) {
	    evt(req, 'view.whatisit');
	    res.render('faq', {
			    layout: req.QUERY.layout === 'true' ? true : false,
			    fbparams: req.QUERY});
	 });

app.get('/newvote', function(req, res) {
	    evt(req, 'view.newvote');
	    res.render('newvote', {
			   layout: true,
			   fbparams: req.QUERY});
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

app.post('/votes/vote', function(req, res) {
	     Vote.findById( req.body.vid, 
			    function (vote){
				if (!vote.data['size'])
				    vote.data['size'] = 0;
				evt(req, 'vote.' + req.body.yesno);
				
				vote.yesno[req.session.fbuid] = req.body.yesno;
				vote.data.size = Object.keys(vote.yesno).length;
				
				vote.save(function () {
					      console.log('saved user VOTE');
					  });
				
				req.session.cuser(function(u){
						      u.yesno[req.body.vid] = req.body.yesno;
						      u.save(function () {
								 console.log('saved USER vote');
							     });
						      res.send('OK');
						      
						  });
				
			    });
	     // TODO: create double index on user
	 });


app.listen(80);