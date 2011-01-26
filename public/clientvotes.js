function domReplace(dom, cls) {
    var newels = dom.find(cls);
    if ($(cls)[1]){
	$.each($(cls), function(i, v){
		   var newel = newels[i];
		   console.log('replacing');
		   $(v).replaceWith(newel);
	       });
    }
    else {
	console.log('replacing');
	$(cls).replaceWith(newels);
	stopwait();
    }
    
}

function pieit() {
    
    var pies = $('.pie');
    console.log('pies: ' + pies.size());
    pies.each(function(i, pie){
		  $(pie).sparkline([$(pie).attr('yes'),
				    $(pie).attr('no')],
				   {type: 'pie', sliceColors: ['#ADDFAD', '#EF3540'], height: $(pie).attr('h')} ); 		      
	      });   
}


function onLoad(){
    
    wait(0);
    
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
}

$(document).ready(function(){
 		      onLoad();     
		  });

function notconnected() {

}


function wait(x){
    console.log('waiting: ' + x);
    $('.loading').show();
    $('.btns').hide();
}

function stopwait(){
    console.log('ready!');
    $('.loading').hide();
    $('.btns').show();

}

function dialog(href){
    $.get(href + '?dummy=' + new Date(), function(dom){
	      $(dom).dialog({modal: true, show: 'drop', position: [40,182], width: 700, height: 470, resizable: false});
	      pieit();
	  });
    
}

function err(msg){
    $('<h2 dir="rtl">' + msg + '</h2>').dialog({modal: true, show: 'drop',position: [40,80], width: 350, height: 200, resizable: false});
}



function postit(daat) {
    
    click(function () {
	      console.log(daat);
	      wait(1);
	      $.post('../../votes/vote' + '?dummy=' + new Date(), daat, function (res) {
			 if (res != 'OK'){
			     stopwait();
			     err('התקשתי לזהות אותך - אנא נסה לרענן את הדף (F5)');
			 }

			 var query = daat.query ? daat.query + '&' : '?';
			 query += 'ajx=true' + '&dummy=' + new Date();
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
	      wait(2);
	      FB.api('/' + ME.uid + '/feed', 'post', msg, function(response) {
			 if (!response || response.error) {
			     evt('shared/no', response.error);
			     stopwait();
			 } 
			 else {
			     evt('shared/yes');
			     stopwait();
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




