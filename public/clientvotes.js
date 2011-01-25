function domReplace(dom, cls) {
    var newels = dom.find(cls);
    if ($(cls)[1]){
	$.each($(cls), function(i, v){
		   var newel = newels[i];
		   $(v).replaceWith(newel);
	       });
    }
    else {
	$(cls).replaceWith(newels);
    }
    
}

function afterLogin(newsession) {
    if (newsession){

	console.log('im going to call the server');
	wait();
	$.get(window.location.pathname + '?ajx=true', function (html) {
		  var dom = $(html);
		  domReplace(dom, '.urvote');
		  domReplace(dom, '.results');
		  domReplace(dom, '.yesnokill');

		  var cmts = $('.cmnts iframe');
		  if (cmts){
		      cmts.attr('src', cmts.attr('src').replace('CMT&', 'CMT' + ME.uid + '&'));
		      console.log('baby');
		  }

		  stopwait();
		  //domReplace(dom, '.noes');
		  //domReplace(dom, '.yess');
	      }); // TODO: can save one call 	
    }
}

function pieit() {
    console.log('pie');
    var pies = $('.pie');
    pies.each(function(i, pie){
		  $(pie).sparkline([$(pie).attr('yes'),
				    $(pie).attr('no')],
				   {type: 'pie', sliceColors: ['#ADDFAD', '#EF3540'], height: $(pie).attr('h')} ); 		      
	      });   
}


function onLoad(){
    
    
    $('img').attr('title',$('img').
		  attr('title').replace('\\n','\n'));

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
    stopwait();
}

$(document).ready(function(){
 		      onLoad();     
		  });

function notconnected() {

}


function wait(){
    
    $('.loading').show();
    $('.btns').hide();
}

wait();

function stopwait(){
    
    $('.loading').hide();
    $('.btns').show();

}

function dialog(href){
    $.get(href, function(dom){
	      $(dom).dialog({modal: true, show: 'slide', position: [40,182], width: 700, height: 470, resizable: false});
	      pieit();
	      FB.Canvas.setSize();	    
	  });
    
}

function postit(daat) {
    
    click(function () {
	      console.log(daat);
	      wait();
	      $.post('../../votes/vote', daat, function () {
			 
			 var query = daat.query ? daat.query + '&' : '?';
			 query += 'ajx=true';
			 $.get('../../votes/' + daat.vid + query, function (html) {
				   var dom = $('<div>' + html + '</div>');
				   domReplace(dom, '#'+daat.vid+' .urvote');
				   domReplace(dom, '.results');
				   domReplace(dom, '.yesnokill');
				   domReplace(dom, '#pagelet_main_nav');
				   setTimeout(pieit, 1000);
			       }); // TODO: can save one call 
			 var cmts = $('.cmnts iframe');
			 if (cmts){
			     cmts.attr('src', cmts.attr('src').replace('CMT&', 'CMT' + ME.uid + '&'));
			     console.log('baby2');
			 }
			 stopwait();			
			 
		     });
	      
	      var hebvote = daat.yesno == 'no' ? '\u05e0\u05d2\u05d3' : '\u05d1\u05e2\u05d3';
	      console.log('whatz');
	      var name = $('.x').text();
	      var link = appUrl.substr(0, appUrl.length - 1 ) + window.location.pathname + "?layout=true&ref=SHR" + ME.uid;
	      var message = 'אני הצבעתי! מה אתם עשיתם היום?!';
	      
	      var msg = {
		  name: name,
		  link: link,
		  picture: 'http://work.thewe.net/ivotelogo.png',
		  caption:'קולורבים',
		  description: 'חברים בוחרים',
		  message: message
	      };
	      wait();
	      FB.api('/' + ME.uid + '/feed', 'post', msg, function(response) {
			 if (!response || response.error) {
			     stopwait();
			     evt('shared/no', response.error);
			 } 
			 else {
			     stopwait();
			     evt('shared/yes');
			 }
		     });

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




