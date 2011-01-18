function update(){
    $('.dataz').each(function (i, k){
			 var i = $(k).data('id');
			 var p = $(k).data('path');
			 var v = k.value;
			 $.post(window.location.pathname + '/update', {i: i, p: p, v: v});
		     });
}

$(document).ready(function(){

		      $('.eval').click(function (){
					   var path = '';
					   var id = '';
					   $(this).parents('.key').each(
					       function (i, k){
						   if ($(k).prevAll('.ID').size() > 0){
						       id = $(k).prevAll('.ID').children()[0].innerHTML;
						   }
						   path = k.id + '.' + path;
					       });
					   path = path.substr(0, path.length - 1);
					   id = id.substr(1, id.length - 3);
					   var input = $('<input class=\'dataz\' type=\'text\' value="' + this.innerHTML +
						       '" /><input type=\'button\' onclick="update()" />');
					   input.data('path', path);
					   input.data('id', id);
					   $(this).replaceWith(input);
				       });
		  });

function rmpost(id) {

    $.post(window.location.pathname + '/die', {vid: id}, function () {
	       $('#' + id).parent().remove();
	   }); // TODO: can save one call 
    return true;
}