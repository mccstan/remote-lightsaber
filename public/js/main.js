var socket = io();



//LES ELEMENTS A ENVOYER

//fonction de callback
function process(event) {
	var gamma = event.gamma ? event.gamma * (Math.PI/180) : 0;
    var beta = event.beta ? event.beta * (Math.PI/180) : 0;
    var alpha = event.alpha ? event.alpha * (Math.PI / 180) : 0;
    var controller = username;
    var roomid = roomname;
    //code broadcast
    //socket.join(roomid);
    socket.emit("orientationemission", {alpha : alpha, beta : beta, gamma : gamma }, controller, roomid);
}

if (typeof profile == 'undefined') {
	var userProfile = undefined;
}
else{
	var userProfile = profile;
}

//emmission des donnnées par le controller
if(userProfile=='controller'){
	
	var q = document.createElement("div");
	q.innerHTML="<a href=\"/leaveroom/"+roomname+"\">Quitter la room</a>";
	q.style.textAlign="center";
	q.style.border="2px solid rgb(227,227,227)";
	document.getElementById('principal').appendChild(q);
	q.addEventListener('click',function(e){
		
		socket.emit("controllerquit",username);
		
	});
    
	
	
	
	var cadre = document.createElement("div"); 
    cadre.style.border='5px solid blue';
    cadre.style.height='300px';
    cadre.style.width='100%';
    
    //àjouter l'évenement !!! 
   	cadre.addEventListener("touchmove",function(e){
   		var touchliste= e.touches;
   		var touchX = touchliste[0].screenX;
   		var touchY= touchliste[0].screenY;
   		var roomid = roomname;
   		//alert('x = '+touchX+' Y= '+touchY);
   		socket.emit('touchEvent',{touchX : touchX, touchY : touchY }, username, roomid);
   		
   	}, false);
    document.getElementById('principal').appendChild(cadre);
    if(window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", process, false);
    } 
    
    
    
} else if (userProfile=='viewer'){
	
	//CHARGEMENT DU SCRIPT DE LA SCENE
	//CODE POUR IMPORTATION DU JAVASCRIPT
    var js_script = document.createElement('script');
	js_script.type = "text/javascript";
	js_script.src = "/public/js/printerlightsaber.js";
	js_script.async = true;
	document.getElementsByTagName('head')[0].appendChild(js_script);
	
	
	var quitter = document.createElement("div");
	quitter.innerHTML="<a href=\"/leaveroom/"+roomname+"\">Quitter la room</a>";
	//quitter.style.textAlign="center";
	//quitter.style.border="2px solid rgb(227,227,227)";
	quitter.className = "btn btn-link btn-lg btn-block";
	document.getElementById('principal').appendChild(quitter);
	

} // fin si



/***
 * 
 * Gestion et mise à jour de l'interface 
 * 
 */
 

//Emission d'évènement lors d'un connection
$("#login-form form").on("submit", function() {
    socket.emit('login-alert', "Nouvelle connection");
});

//Emmission d'évènement lors de la création d'un room.
$("#rooms-list form").on("submit", function() {
	var roomname = $('#roomid').text();
    socket.emit('new-room', roomname);
});


//Chargement dynamique de la liste des rooms
$("a.page-link").on("click", function(event) {
	event.preventDefault();
	$("#rooms-list").load(this.href+" #rooms-list");
});




//Mise à jour de la liste des rooms avec tous les détails sur les rooms
socket.on('service-message', function(message) {
   $("#rooms-list #tab1").load("/roomlist #rooms-list #tab1"); 
});


//




/**
 * 
 * 
 * Pagination 
 * 
 * 
 */ 
 /*
var visiblePages;
var totalPages = 0;
if (typeof total === 'undefined') {
    // variable is undefined
}else{
	totalPages=total;
}

var first = false;
var next = false;
var prev = false;
var last = false;

if(totalPages < 3){
	visiblePages = totalPages;
}
else {
	visiblePages = 3;
	first = 'début';
	next = 'suiv'
	prev = 'prec';
	last = 'fin';
}

var pagination= {
	    totalPages: totalPages,
	    visiblePages: visiblePages,
	    first : first,
	    prev : prev,
	    next : next,
	    last : last,
	    href: '#page={{pageNumber}}',
	    hrefVariable: '{{pageNumber}}',
	    onPageClick: function (event, page) {
	        $("#rooms-list #tab1").load("/roomlist/page/"+page+" #rooms-list #tab1"); 
	    }
	}
	
$('#pagination-content').twbsPagination(pagination);
*/





