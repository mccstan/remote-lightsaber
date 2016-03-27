var socket = io();

var colladaLoaded=false;

function colladaLoadedSet(){
	colladaLoaded=true;
}

//LES ELEMENTS A ENVOYER

//fonction de callback
function process(event) {
	var gamma = event.gamma ? event.gamma * (Math.PI/180) : 0;
    var beta = event.beta ? event.beta * (Math.PI/180) : 0;
    var alpha = event.alpha ? event.alpha * (Math.PI / 180) : 0;
    var controller = username;
    socket.emit("orientationemission", {alpha : alpha, beta : beta, gamma : gamma }, controller);
}

//emmission des donnnées par le controller
if(profile=='controller'){
	
	var cadre = document.createElement("div"); 
    cadre.style.border='5px solid blue';
    cadre.style.height='300px';
    cadre.style.width='100%';
    
    //
   
   
    //àjouter l'évenement !!! 
   	cadre.addEventListener("touchmove",function(e){
   		var touchliste= e.touches;
   		var touch = touchliste[0].item();
   		alert(touch.screenX);
   		
   	}, false);
    /*function processTouch(event){
    	//alert('Touch move');
    }*/
    
    
    document.getElementById('principal').appendChild(cadre);
	
	
	$('principale').append('<p>Je suis le con');
    if(window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", process, false);
    } 
    
    
    
} else if (profile=='viewer'){ //mise à l'écoute de l'afficheur

//$(function(){
     //verification de la presence du support WEBGL
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
            
    //Definition des variables
            
	var container, camera, controls, scene, renderer, particleLight;
	var dae = {}, daePoistion = {}, daeRotation = {}, position=0;
	
    //
    
	var loader = new THREE.ColladaLoader();
		
    //effectuer la conversion Axis pour les géométries , les animations et les contrôleurs
	loader.options.convertUpAxis = true;
	
	//Initialisation de la scene
	init();
	//animation de la scene
	//animate();
	//colladaLoadedSet();

	/*DEFNITION DES FONCTIONS DE LA SCENE*/
	
	//definition de la fonction d'initialisation de la scene
	function init() {
		//Creation du conteneur de la scene
		container = document.getElementById("principal");
		//document.body.appendChild( container );
		
		//creation et positionnement de la camera
		camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 2000 );
		//camera = new THREE.OrthographicCamera( window.innerWidth / - 16, window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / - 16, -200, 5000 );
		camera.position.set( 28.00, 10.70, 1.13 );
		camera.rotation.set(-1.47, 1.20, 1.46);
		camera.scale.x=camera.scale.y=camera.scale.z=1.00;
		camera.fov=50;
		//definition du controleur de device orientation
		controls = new THREE.DeviceOrientationControls( camera );
		// creation de la scene
		scene = new THREE.Scene();
		//scene.position.set(0,0,0);
		
		//Ajout d'un axe
		//var axisGeometrie = new THREE.AxisHelper(30);
		//scene.add(axisGeometrie);
		
		particleLight = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
		//scene.add( particleLight );
		// Ajout des lumieres sur la scene
		scene.add( new THREE.AmbientLight( 0xcccccc ) );
	
		var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0xeeeeee );
		directionalLight.position.x = 0.5;//Math.random() - 0.5;
		directionalLight.position.y = 0.5;//Math.random() - 0.5;
		directionalLight.position.z = 0.5;//Math.random() - 0.5;
		directionalLight.position.normalize();
		scene.add( directionalLight );
		
		var pointLight = new THREE.PointLight( 0xffffff, 4 );
		particleLight.add( pointLight );
		
		// Creation du renderer et ajout au conteneur
		renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		//renderer.setSize( 100, 100 );
		var taille= window.innerWidth;
		
		//renderer.setSize( 850, window.innerHeight );
		renderer.setSize( window.innerWidth*0.63, window.innerHeight*0.70 );
		container.appendChild( renderer.domElement );
		//Prédéfinition des positions des sabres
		initialisePosition ();
	}
	
	//fonction de prédefinition des positions des sabres
	function initialisePosition (){
			daePoistion[0] = new THREE.Vector3(0,-5,0);
			daeRotation[0] = new THREE.Vector3(-72, -1.5, 78.2);
			daePoistion[1] = new THREE.Vector3(0,4.5,0);
			daeRotation[1] = new THREE.Vector3(-72, 1.5, 78.2);
			daePoistion[2] = new THREE.Vector3(-2.5,0,-20);
			daeRotation[2] = new THREE.Vector3(-2.5, -2, 78.2);
			daePoistion[3] = new THREE.Vector3(-2.5,-0.5,18);
			daeRotation[3] = new THREE.Vector3(2.5, -1, 78.2);
		}
	
	//definition de la fonction d'animation de la scene
	function animate() {
		requestAnimationFrame( animate );
		controls.update();
		render();
		//stats.update();
	}
	
	
	//definition de la fonction de rendu
	function render() {
		camera.lookAt( scene.position );
		//camera.position.x= 2;
		//camera.position.y= 1;
		//camera.position.z= 3;
		particleLight.position.set(0.5, 0.5, 0.5);
		renderer.render( scene, camera );
	}
	
	//definition de la fonction d'animation de la scene
	function animeSabre(nomControlleur, beta, gamma, alpha) {
		var id = nomControlleur;
		dae[id].rotation.set(beta, gamma, alpha);
		//dae.rotation.set(beta, gamma, alpha);
		render();
	}
	//});
	
	// definition de la fonction d'ajout de controleur
	function addControlleur (nomControlleur){
		var id= nomControlleur;
		loader.load( '/public/images/Lightsaber1.dae', function ( collada ) {
		dae[id] = collada.scene;
		dae[id].traverse( function ( child ) {
			if ( child instanceof THREE.SkinnedMesh ) {
				var animation = new THREE.Animation( child, child.geometry.animation );
				animation.play();
			}
		});
	                
	    //definition de l'echelle de la scene collada
		dae[id].scale.x = 0.06;
		dae[id].scale.y = dae[id].scale.z = 0.06;
		//definition du positionnement
		//dae[id].position.set(daePoistion[position]);
		dae[id].position.x = daePoistion[position].x ;
		dae[id].position.y = daePoistion[position].y ;
		dae[id].position.z = daePoistion[position].z ;
		
		//dae[id].position.set(0,-0.5,0 );
		//dae[id].rotation.set(daeRotation[position]);
		dae[id].rotation.x = daeRotation[position].x ;
		dae[id].rotation.y = daeRotation[position].y ;
		dae[id].rotation.z = daeRotation[position].z ;
		
		//dae[id].rotation.set(-72, 0.50, 78.2);
		position ++; if(position > 3) position = 0;
		
		//dae[id].rotation.set(0, 10, 0);
		dae[id].updateMatrix();
		// ajout de la scene du collada sur la scene de three
		scene.add( dae[id] );
		//animation de la scene
		//animate();
		colladaLoadedSet();
		render();
	});
	}
	
	//Gestion des evements
	
	socket.on('new-controller-event', function(controller, roomname) {
		console.log("new-controller-event");
	    addControlleur(controller);
	    
	});
	
	socket.on("orientationreception", function (coordonee, controller){
		//var id = controleur;
	        console.log("Coordonnees: Beta="+coordonee.beta+ " Gamma="+coordonee.gamma+" Alpha="+coordonee.alpha);
	        if(colladaLoaded == true){
	        	
	        	//Rénormalisation des coordonnées par rapport a la scene
	        	coordonee.beta+=-2.25;
	        	coordonee.gamma+=0.02;
	        	coordonee.alpha+=-1.05;
	        	//transmission des coordonnées renormalisées au sabre
	        	animeSabre(controller, coordonee.beta, coordonee.gamma, coordonee.alpha);
	        }
	});

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





