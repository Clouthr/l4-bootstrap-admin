
/* security for ajax */
$.ajaxSetup({
	data: {
		'csrf_token': $('meta[name="csrf-token"]').attr('content')
	}
});

/* datatables helpers */
function styledt(table){
	$(table+'-container .dataTables_filter label').addClass('pull-right'); 
	$(table+'-container .dataTables_filter input').attr('placeholder', 'Search'); 
	$(table+'-container .dataTables_filter input').addClass('form-control');
	$(table+'-container .dataTables_length select').addClass('form-control');
	$(table+'-container .dt-pop-control').detach().prependTo('.dataTables_filter')
	$(table+'-container .dataTables_paginate').addClass('pull-right');
}

function dtLoad(table, action, hidemd, hidesm, hide){
	var aSelected = [];
	var oTable=$(table).dataTable( {
		"sDom": "<'row'<'col-md-6'l><'col-md-6'f>r>t<'row'<'col-md-6'i><'col-md-6'p>>",
		"sPaginationType": "bootstrap",
		"bAutoWidth": false,
		"bProcessing": true,
		"bServerSide": true,
		"sAjaxSource": action,"bRetrieve": true,
		"fnInitComplete": function ( oSettings ) {
			styledt(table);
		},
		"oLanguage": {
				"sLengthMenu": "Limit _MENU_",
				"sSearch": "",
					"oPaginate": {
					"sPrevious": "",
				"sNext": ""
			  }
		  },
		"fnRowCallback": function( nRow, aData, iDisplayIndex ) {
			if ( $.inArray(aData[0], aSelected) !== -1 )  $(nRow).addClass('highlight');
		 },
		"fnDrawCallback": function ( oSettings ) {
			
			oTable.fnSetColumnVis( 0, false,false );

			$(table+' tr').find(hidemd).addClass('hidden-sm hidden-xs'); 
			$(table+' tr').find(hidesm).addClass('hidden-xs'); 
			$(table+' tr').find(hide).addClass('hidden'); 

			$('.datatable-loading').fadeOut();
			$(table+'-container').fadeIn();
		}
	});

	$('#site-modal').on('hidden.bs.modal', function () {
		$(document).off("click", table+' tbody tr');
		$(document).off("click",  table+"-container .dt-mass");
	})

	$(document).on("click", table+' tbody tr', function(e) {
		e.preventDefault();
		
		var aData = oTable.fnGetData( this );
		var id = aData[0];

		var index = $.inArray(id, aSelected);
		if ( index === -1 ) {
			aSelected.push( id );
		} else aSelected.splice( index, 1 );
	
		 if(aSelected.length > 0){
			 $(table+'-container .dt-pop-control').fadeIn();
		 } else $(table+'-container .dt-pop-control').fadeOut();

		$(this).toggleClass('highlight');
	} );

	$(document).on("click",  table+"-container .dt-mass", function(e) {
		e.preventDefault();  

		var action=$(this).attr('data-action');
		var table=$(this).attr('data-table');
		var method=$(this).attr('data-method');
		var run=false;
		var _ids='';
		$.each(aSelected, function(i,value){ _ids+=value+','; });

		if(method == 'modal'){
			modalfyRun(this,$(this).attr('data-action')+'?ids='+_ids);
		}else if($(this).attr('data-confirm') == 'true'){
			if(action == 'user/mass/merge'){
				$.ajax({
					type: 'GET',
					url: 'user/mass/merge?ids='+_ids
				}).done(function(msg) {
					if(msg){
						bootbox.confirm(msg, function(result) {
							if(result) fnRunMass(action, table, method, aSelected);
						});
					} else {
						console.log(msg);
						bootbox.alert(lang_unable_to_exec);
					}
				}).fail(function(jqXHR, textStatus) {
						console.log(jqXHR);
						bootbox.alert( lang_unable_to_exec + textStatus);
				 });
				} else {
					bootbox.confirm(lang_areyousure, function(result) {
						if(result) fnRunMass(action, table, method, aSelected);
					});
				}
		} else fnRunMass(action, table, method, aSelected);
		return false;
	});
}


/* on clicks */
$(document).on("click", ".ajax-alert", function(e) {
	e.preventDefault();    
	bootbox.confirm(lang_areyousure, function(result) {    
		if (result) document.location.href = $(this).attr("href");    
	});
});

$(document).on("click", ".ajax-alert-confirm", function(e) {
	e.preventDefault();    
	var data_table = $(this).attr("data-table"); 
	var data_row = $(this).attr("data-row"); 
	var link = $(this).attr("href"); 
	var data_method=$(this).attr('data-method');
	var data_type=$(this).attr('data-type');
	if(!data_type) data_type='json';
	if(!data_method) data_method='POST';

	bootbox.confirm(lang_areyousure, function(result) {    
		if (result) {
			$.ajax({
				type: data_method,
				dataType: data_type,
				url: link
			}).done(function(msg) {
				if(data_type == "json"){
					if(msg.result == "success"){
						if(data_row){
							$('#site-modal').modal('hide')
							oTable = $('#'+data_table).dataTable();
							oTable.fnReloadAjax();
						//	var index = jQuery.inArray(data_row, aSelected);
						//	aSelected.splice( index, 1 );
						} else {
							$('#site-modal').modal('hide');
						}
					}else {
						console.log(msg);
						bootbox.alert( lang_unable_to_exec + msg.error);
					}
				}
			}).fail(function( jqXHR, textStatus ) {
 					console.log(jqXHR);
					bootbox.alert( lang_unable_to_exec + textStatus);
			});
		}    
	});
	return false;
});

$(document).on("submit", ".form-ajax", function(e) {
	$('input[type=button], input[type=submit]').attr('disabled', true).addClass('disabled');
	$.post(
		$(this).attr('action'),
		$(this).serialize(),
		function(data){
			$("#site-modal").html(data);
			$('html, body, #site-modal').animate({ scrollTop: 0 }, 0);
			$('input[type=button], input[type=submit]').attr('disabled', false).removeClass('disabled');
			//console.log(data);
		}
	);
	return false;   
}); 

$(document).on("click", "a", function(e) {
	if($(this).attr('href')=='#') return false;
});

$(document).on("click", ".modalfy", function(e) {
	e.preventDefault();   
	modalfyRun(this,$(this).attr("href"));
});


function modalfyRun(th,url){
	$.ajax({
		type: 'GET',
		url: url
	}).done(function(msg) {
		if(msg){
			$('#site-modal').html(msg).modal();
		} else {
			console.log(msg);
			bootbox.alert(lang_unable_to_exec);
		}
	}).fail(function(jqXHR, textStatus) {
			console.log(jqXHR);
			bootbox.alert( lang_unable_to_exec + textStatus);
	 });
}

/* helpers */
function fnRunMass(action, data_table, data_method,aSelected){
	if(!data_method) data_method='POST';
	//console.log(data_table);
	$.ajax({
			type: data_method,
			url: action,
			dataType: 'json',
			data: { rows: JSON.stringify(aSelected) }
		})
	  .done(function( msg ) {
			if(msg.result == "success"){
				aSelected=[];
				oTable = $('#'+data_table).dataTable();
				oTable.fnReloadAjax();
				$(".dt-pop-control").fadeOut();
			}else {
				console.log(msg);
				bootbox.alert( lang_unable_to_exec + msg.error);
			}
	  }).fail(function(jqXHR, textStatus) {
			console.log(jqXHR);
			bootbox.alert( lang_unable_to_exec + textStatus);
	  });
}


function loadWeather(location, woeid) {
	if(localStorage.getItem('weather_time') > 0 && ((new Date().getTime() - localStorage.getItem('weather_time'))/1000 < 300)){
		$(".panel-weather").html(localStorage.getItem('weather_html'));
	} else {
	  $.simpleWeather({
		location: location,
		woeid: woeid,
		unit: 'f',
		success: function(weather) {
			$(".panel-weather").hide();
			$(".panel-weather").html('<a href="#"><span class=" icon-'+weather.code+'"></span> '+weather.temp+'&deg; '+ weather.currently+'</a>');
			$(".panel-weather").attr('title', weather.city + ', '+ weather.region );
			$(".panel-weather").show();
			localStorage.setItem('weather_html',$(".panel-weather").html());
			localStorage.setItem('weather_time',new Date().getTime());
		}
	  });
	}
}

function _resize_sparkline(data){
	if( $( window ).width() > 760){
		var _w=(($( window ).width()/4)/6)-9;
	} else 	var _w=(($( window ).width()/2)/6)-10;

	$.each(data, function(i,value){ 
		$('#spark_'+ i).sparkline(value.data.reverse(), { enableTagOptions: true , barWidth: _w, barSpacing: '6' });
	});
}

function throttle(f, delay){
    var timer = null;
    return function(){
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = window.setTimeout(function(){
            f.apply(context, args);
        },
        delay || 500);
    };
}



/* navigation, swipe & weather */
$(document).ready(function() {
	$(".main-nav").swipe( {
		swipe:function(event, direction, distance, duration, fingerCount) {
			if(direction == "down") $('.main-nav .collapse').collapse('show');
			if(direction == "right") $('.sidebar').collapse('show');
			if(direction == "left") $('.sidebar').collapse('hide');
		},
		 threshold:0
		});

		$(".sidebar").swipe( {
		swipe:function(event, direction, distance, duration, fingerCount) {
			if(direction == "left") $('.sidebar').collapse('hide');
		},
		 threshold:0
	});

	localdata_weather = JSON.parse(localStorage.getItem('weather_location'));
	if(localdata_weather){
		loadWeather(localdata_weather.lat+','+localdata_weather.lon); //load weather using your lat/lng coordinates
	} else {
		if ("geolocation" in navigator) {
		  navigator.geolocation.getCurrentPosition(function(position) {
			localStorage.setItem('weather_location', JSON.stringify({'lat':position.coords.latitude, 'lon':position.coords.longitude}));
			loadWeather(position.coords.latitude+','+position.coords.longitude); //load weather using your lat/lng coordinates
		  });
		} else loadWeather('Seattle',''); 
	}

});


/* on/off switcher */
$(document).on("click", ".btn-toggle", function(e) {
	e.preventDefault();   
    $(this).find('.btn').toggleClass('active');  
    
    if ($(this).find('.btn-primary').size()>0) {
    	$(this).find('.btn').toggleClass('btn-primary');
    }
    if ($(this).find('.btn-danger').size()>0) {
    	$(this).find('.btn').toggleClass('btn-danger');
    }
    if ($(this).find('.btn-success').size()>0) {
    	$(this).find('.btn').toggleClass('btn-success');
    }
    if ($(this).find('.btn-info').size()>0) {
    	$(this).find('.btn').toggleClass('btn-info');
    }
});