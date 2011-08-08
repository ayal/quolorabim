function domReplace(dom, cls) {
    var newels = dom.find(cls);
    if ($(cls)[1]){
	$.each($(cls), function(i, v){
		   var newel = newels[i];
		   lg('replacing');
		   $(v).replaceWith(newel);
	       });
    }
    else {
	lg('replacing');
	$(cls).replaceWith(newels);
	stopwait(5);
    }
    
}

function pieit() {
    
    var pies = $('.pie');
    lg('pies: ' + pies.size());
    pies.each(function(i, pie){
		  $(pie).sparkline([$(pie).attr('yes'),
				    $(pie).attr('no')],
				   {type: 'pie', sliceColors: ['#ADDFAD', '#EF3540'], height: $(pie).attr('h')} ); 		      
	      });   
}


/*invite = function (){
    setTimeout(function(){
		   evt('init invites');
		   $('#nvt').dialog({autoOpen: false,modal: true, show: 'drop', position: [100,100], width: 740, height: 580, resizable: false });
		   
	       }, 2500);
  
};*/

showfeed = function (atc, lnkz){
    evt('feed/try');
    wait(100);
    FB.ui(
	atc,
	function(response) {
	    stopwait(100);
	    if (response && response.post_id) {
		lg('Post was published.', response);
		evt('feed/yes', response);
		showfriends();
	    } else {
		evt('feed/no', response);
	    }
	}
    );
};

fbready = function (){
    var td = addInfoLine('\u05e7\u05d9\u05e9\u05d5\u05e8\u05d9\u05dd\u0020\u05e9\u05dc\u0020\u05d4\u05e2\u05dd');
var cmtsUrl = appUrl +'bill/' +  $('.content').attr('id');
		      lg(cmtsUrl);

		      FB.api('/comments/?ids=' + cmtsUrl,
			     function (response){
				 if (!response || response.error) {
				     evt('comments/no', response.error);
				 } 
				 else {

				     response[cmtsUrl].data.forEach(function(rslt){

									var arr = regit(/(http.*?)(\s|$)/g,
											rslt.message);
									if (arr.length > 0 && arr[0])
									    if (arr[0]['1']) {
										addInfoLink(td, arr[0]['1'], '/link.png');	
									    }

						 
					     });

				}
				 

			    });

    };

showfriends = function (){
    //    dialog('/nvtfrds');
    wait(101);
    evt('friends/try');
    FB.ui({ method: 'apprequests', 
	    message: '\u05d7\u05e9\u05d5\u05d1\u0020\u05dc\u05d4\u05e6\u05d1\u05d9\u05e2',
	    title: '\u05d7\u05d1\u05e8\u05d9\u05dd\u0020\u05e9\u05dc\u05da\u0020\u05d9\u05e8\u05e6\u05d5\u0020\u05dc\u05d4\u05e6\u05d1\u05d9\u05e2\u003f',
	    data: window.location.pathname},
	  function (res){
	      stopwait(101);
	      evt('friends/res', res);
	      lg('response from requests: ' + JSON.stringify(res));
	  });
};


nvt = function(uid) {
    wait(19, '#img' + uid + ' a');
    var name = $('.x').text();
    var link = appUrl.substr(0, appUrl.length - 1 ) + window.location.pathname + "?ref=NVT" + ME.uid;
    var message = 'אני הצבעתי! מה אתם עשיתם היום?!';
    
    var msg = {
	name: name,
	link: link,
	picture: siteUrl + 'ivotelogo.png',
	caption:'קולורבים',
	description: 'חברים בוחרים',
	message: message
    };
    
    evt('nvt/try', response.error);
    FB.api('/' + uid + '/feed', 'post', msg, function(response) {
	       if (!response || response.error) {
		   evt('nvt/no', response.error);
		   stopwait(19, '#img' + uid + ' a');
	       } 
	       else {
		   evt('nvt/' + uid , response);
		   stopwait(19, '#img' + uid + ' a');
		   $('#img' + uid).fadeTo('slow', 0.5);
		   $('#img' + uid + ' a').attr('onclick','');

	       }
	   });
  
};

function onLoad()
{
/*    if (!$.browser.msie){
	lg('NVT');
	invite();
    }*/
    wait(0);
    

    $('.imgwrp img').fadeTo("fast", 0.6);
    
    $(".imgwrp img").hover(function(){

			       if (!$(this).data('ow'))
				   $(this).data('ow', $(this).width());

			       if (!$(this).data('oh'))
				   $(this).data('oh', $(this).height());

			       $(this).stop().animate({"opacity": "1", width: $(this).width() + 5, height: $(this).height() + 5}, "fast");
			   },function(){
			       $(this).stop().animate({"opacity": "0.6", width: $(this).data('ow'), height: $(this).data('oh')}, "slow");
			   });
    

    $("td a").click(function (){
			evt('click', {uri: this.href});
		    });

    pieit();

    paper = new Raphael(0, 0, 400,400);
    $($('svg desc').parent()).hide();

    paper.arrow = function (x1, y1, x2, y2, size) {
	$($('svg desc').parent()).show();
	var color = "#F2B50F";
	var angle = Math.atan2(x1-x2,y2-y1);
	angle = (angle / (2 * Math.PI)) * 360;
	
	
	var linePath = this.path('M' + x1 + ' ' + y1 +' L' + x2 + ' ' + (y2));
	
	linePath.hide();

        var pth = this.path('M' + (x2 - 24) + ' ' + y2 +' L' + 
			    (x2 - linePath.getTotalLength())+ ' ' + (y2)).attr('stroke-width','20px').rotate((angle+90),x2,y2);
	
	pth.attr('stroke',color);
	pth.attr('stroke-width','20px');
	
	
	size *= 3;
	
	var arrowPath = this.path("M" + x2 + " " + y2 +
				  " L" + (x2  - size) + " " + (y2 - size) + " L" + (x2 - size)  + " " + (y2 + size) + " L" + x2 + " " + y2).rotate(90 + angle, x2, y2);

	arrowPath .attr('stroke',color);
	arrowPath .attr('fill',color);
	arrowPath.attr("stroke-linecap", "round");
	arrowPath.attr("stroke-opacity", 0);
	
	
        var yy = function (cnt){
	    
            if (cnt == 8)
		return;
            pth.animate({"stroke-opacity": 1}, 200, function(){
			    pth.animate({"stroke-opacity": 0}, 200, function (){ yy(++cnt);});
			});
        };
        yy(1);
	
	var zz = function (cnt){
            
            if (cnt == 8)
		return;
            arrowPath.animate({"fill-opacity": 1}, 200, function(){
				  arrowPath.animate({"fill-opacity": 0},200, function (){ zz(++cnt);});
			      });
        };
        zz(1);
        
	setTimeout(function(){
		       	$($('svg desc').parent()).hide();
		   },1500);
	
    };     

    
}

var addInfoLine = function(txt){
    var tr = $('<tr></tr>');
    var td = $('<td>' + txt + '</td>');
    tr.append(td);
    var td2 = $('<td></td>');
    tr.append(td2);
    $('#tbl').append(tr);	
    return td2;
 };

var addInfoLink = function(td, href, src){
    var anc = $('<a href="' + href + '" target="_blank"></a>"');
    var imgl = $('<img src="' + src + '"></img>');
    anc.append(imgl);
    td.append(anc);
    
};

function regit(re, str) {
    
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
}

$(document).ready(function(){
 		      onLoad();     
		      lg('content');
		      lg($('.content').attr('id'));
/*		      dialog('/scrape?url=http://oknesset.org/bill/' + $('.content').attr('id') + '&path=.proposal_content_text',
			     [27,72], 710, 780, function(){});*/
/*		      dialog('/scrape?url=http://oknesset.org/bill/' + $('.content').attr('id') + '&path=div h2 a',
			     [27,72], 710, 780, function(){});*/

		      
		  });

function notconnected() {

}

loading  = new Image();
$(loading).attr('src', '/loading40.gif');


function ldg(){
    return $(loading).clone();
}

function wait(x, y){
    if (y && $(y)){
	lg('WTFF');
	$(y).hide();
	var ldg1 = ldg();
	ldg1.attr('class', $(y).attr('class'));
	ldg1.insertBefore($(y));
    }
    lg('waiting: ' + x);
    $('.loading').show();
    $('.btns').hide();
}

function stopwait(x, y){
    if (y && $(y)){
	$(y).prev().remove();
	$(y).show();
    }
    
    lg('ready!' + x);
    $('.loading').hide();
    $('.btns').show();

}

function dialog(href, p, w, h, cb) {
    p = p || [40,130];
    w = w || 700;
    h = h || 480;
    cb = cb || function(){};
    $.get(href, function(dom){
	      console.log('DIALOG ' + dom);
	      $(dom).dialog({modal: true, show: 'drop', position: p, width: w, height: h, resizable: false, close: cb});
	      pieit();
	  });
    
}

function err(msg){
    $('<h2 dir="rtl">' + msg + '</h2>').dialog({modal: true, show: 'drop',position: [40,80], width: 350, height: 200, resizable: false});
}



function postit(daat) {
    
    click(function () {
	      lg(daat);
	      wait(1);
	      $.post('../../votez/vote' + '?dummy=' + new Date(), daat, function (res) {
			 if (res != 'OK'){
			     stopwait(1);
			     err('התקשתי לזהות אותך - אנא נסה לרענן את הדף (F5)');
			 }

			 var query = daat.query ? daat.query + '&' : '?';
			 query += 'ajx=true' + '&dummy=' + new Date();
			 $.get('../../bill/' + daat.vid + query, function (html) {
				   var dom = $('<div>' + html + '</div>');
				   domReplace(dom, '#'+daat.vid+' .urvote');
				   domReplace(dom, '.results');
				   domReplace(dom, '.yesnokill');
				   domReplace(dom, '#pagelet_main_nav');
				   setTimeout(pieit, 1000);

				   var hebvote = daat.yesno == 'no' ? '\u05e0\u05d2\u05d3' : '\u05d1\u05e2\u05d3';
				   lg('whatz');
				   var name = $('.x').text();
				   var link = appUrl.substr(0, appUrl.length - 1 ) + window.location.pathname + "?ref=SHR" + ME.uid;
				   var message = 'אני הצבעתי! מה אתם עשיתם היום?!';
				   
				   var msg = {
				       name: name,
				       link: link,
				       picture: siteUrl + 'ivotelogo.png',
				       caption:'קולורבים',
				       description: 'חברים בוחרים',
				       message: message
				   };
				   

				   msg['method'] = 'feed';
				   showfeed(msg);

				   
			       }); // TODO: can save one call 
			 var cmts = $('.cmnts iframe');
			 if (cmts){
//			     cmts.attr('src', cmts.attr('src').replace('CMT&', 'CMT' + ME.uid + '&'));
			     lg('baby2');
			 }
			 
			 
			 
		     });
	      
/*
	      var share = function (){
		  evt('share/try', response.error);
		  FB.api('/' + ME.uid + '/feed', 'post', msg, function(response) {
			 if (!response || response.error) {
			     evt('shared/no', response.error);
			 } 
			 else {
			     evt('shared/yes', response);
			 }
		     });};

	      var hndl = setTimeout(share, 6000);
	      
	      var pn = window.location.pathname;
	      if (pn[pn.length - 1] === '/') pn = pn.substr(0, pn.length - 1);
	      var lnk = siteUrl.substr(0, siteUrl.length - 1) + pn + "/params/LNK" + ME.uid;
	      evt('feed/try', {lnk: lnk});
	      FB.api(
		  {
		      method: 'links.post',
		      url: lnk,
		      comment: message
		  },
		  function(res) {
		      if (parseInt(res) + '' === res){
			  clearTimeout(hndl);
			  evt('feed/yes', {res: res});
		      }
		      else {
			  evt('feed/no',{res: res});
			  clearTimeout(hndl);
			  share();
			  
		      }
		  }
	      );
	      
*/
//	      showfriends();
	      
	      /*	      if (!$.browser.msie){
	       lg('inviting...');
	       setTimeout(function(){
	       $("#nvt").dialog("open");
				 setTimeout(function(){
						$('#nvt').attr('scrollLeft', $('#nvt').attr('scrollWidth'));
						$('#nvt').css('padding', '0px');
						console.log('WDTH:' + $('#nvt iframe').css('width'));
						$('ui-dialog').css('left', '80px');
						$('#nvt iframe').css('width', '750px');
					}, 3000);
			     }, 500);
	      }
*/	      
	      /*	      FB.ui({ method: 'stream.share', u: link}, function(res){
			lg(res);
		    });*/
	      /*		    FB.ui(
	       {
	       method: 'feed',
	       name: name,
	       link: link,
	       picture: 'http://work.thewe.net/ivotelogo.png',
	       caption:'קולורבים',
	       description: 'חברים בוחרים',
	       message: message
	       },
	       function(response) {
	       
	       if (!$.browser.msie)
	       $($('.fb_dialog_advanced')[1]).css({display: 'none'});
	       else
	       $($('.fb_dialog_legacy')[1]).css({display: 'none'});
	       
	       if (response && response.post_id) {
	       evt('shared/yes');
	       } else {
	       evt('shared/no');
	       }
	       }
	       );*/

	      
	      /*		    if ($.browser.msie){
	       $($('.fb_dialog_legacy')[0]).css({display: 'none'});
	       $($('.fb_dialog_legacy')[1]).css({display: 'none'});			
	       }
	       else{
	       $($('.fb_dialog_advanced')[0]).css({display: 'none'});
	       $($('.fb_dialog_advanced')[1]).css({display: 'none'});    
	       }

	       setTimeout(function () {
	       if ($.browser.msie)
	       $($('.fb_dialog_legacy')[1]).css({display: 'block'});
	       else
	       $($('.fb_dialog_advanced')[1]).css({display: 'block'});
	       t				   
	       
	       }, 3500);*/
	      
	      return true;
	  }, true);
}




