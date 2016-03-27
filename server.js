
/**
 * 
 * Chargement des composants
 **/
var express=require('express');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var twig=require("twig");
var session=require("express-session");
var csrf = require('csurf'); // Protection CSCRF
var helmet = require('helmet'); // Protection CSP
var lusca = require('lusca'); // Protection LUSCA
var app=express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var favicon = require('serve-favicon');

//CSRF Protection
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })


/**
 * 
 * Configuration des middlewares 
 **/
app
   .use(favicon(__dirname + '/public/images/favicon.ico'))
   .use(bodyParser.urlencoded({extended:false}))
   .use(cookieParser())
   .use(helmet())
   .use(express.static('.'))
   
   .use(session({ // Config sécurisé de la session
      secret: '96826587412301',
      key: 'sessionId',
      resave: true,
	   saveUninitialized: true,
	   secure : true,
	   httpOnly: true
   }));



/**
 * Disable x-powered-by
 * Why? Because you don’t want to make it easy for 
 * an attacker to figure what you are running
 * The X-Powered-By header can be extremely useful 
 * to an attacker for building a site’s risk profile
 */ 
app.disable('x-powered-by');

/**
 * Protection diverses
 * 
 */
app.use(lusca({
    csp: {//White liste
         policy: {
          'default-src': '\'self\' \'unsafe-inline\' https://maxcdn.bootstrapcdn.com/ https://code.jquery.com/ https://ajax.googleapis.com/ wss://aws-remote-lightsaber-mccstan.c9users.io/socket.io/',
        }
    },
    xframe: 'SAMEORIGIN', //Protection contre le clickjacking
    //p3p: 'ABCDEF',
    hsts: {maxAge: 31536000, includeSubDomains: true, preload: true}, //Communications via HTTPS
    //xssProtection: true, // Lutter contre le cross site scripting
    //xContentTypeOptions: 'nosniff' 
})); 


//Gestion d'erreur en cas de mauvaise transmission
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)

  // handle CSRF token errors here
  res.status(403);
  res.send('Formulaire non valide');
});



/**
 * 
 * Configuration du dossier servant de vue  
 **/
app.set('views', 'views');

var last_key;
var keys;


function reduceRooms(rooms, page){
   var number=4;
   var start = number * (page - 1) + 1;
   var end = start+number;
   var i=1;
   var reducedRooms = {};
   
      
   
   if(Object.keys(rooms).length > number){
      Object.keys(lightSaberRooms).reverse().forEach(function(key){
         if(i >= start && i < end ){
            reducedRooms[key] = rooms[key];
         }
         i++;
      });
   }
   else{
      reducedRooms = rooms;
   }
   
   return reducedRooms;
}




/**
 *
 * Variables globales de gestion
 */
var connectedUsers = {};
var lightSaberRooms = {};
var Cstate = {};

/**
 * ROUTES
 * 
*/


//ADDROOM
app.post('/addroom', parseForm, csrfProtection, function(req, res){
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      var id = "GeneratedRoomID" ;
      if(req.body.roomid.length >= 1){
         id = req.body.roomid;
      }
       
      var controller = "Non défini";
      var control = false;
      if(req.body.profile == 'controller'){
         controller = req.session.user.username;
         control = true;
      }
      
      var members = {};
      members[req.session.user.username] = req.session.user.username;
      
      lightSaberRooms[id] = {
         name : id,
         controller : controller,
         creator : req.session.user.username,
         members : members,
         membersNumb : Object.keys(members).length,
         control : control
      };
      
      lightSaberRooms[id].membersNumb = function(){
         return Object.keys(this.members).length;
      }
      
         
      keys = lightSaberRooms['_keys'];
      last_key=id;
      delete lightSaberRooms['_keys'];
      
      res.redirect('/roomlist');
      
   }
});



// saberroom/:roomid
app.get('/saberroom/:roomid/:option', function(req, res) {
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      var profile  ;
      var roomid = req.params.roomid;
      var username = req.session.user.username;
      var option = req.params.option;
      if(lightSaberRooms[roomid] !== undefined){
         if(lightSaberRooms[roomid].controller == username){
            profile = 'controller' ;
         }
         else{
            lightSaberRooms[roomid].members[username] = username;
            profile = 'viewer' ;
            if(option == 'controller'){
               profile = 'controller' ;
            }
         }
         
         //console.log("CR :", Cstate.currentRoom, " - CU :",Cstate.currentUsername, " - CP :",Cstate.currentProfile )
         /*
         io.on('connection', function(socket){
            //socket.on('access-event', function(controller){
               socket.emit('new-controller-event', username);
            //});
            
         });*/
         
         req.session.user['profile'] = profile ;
         res.render('saberroom.twig', {
            user : req.session.user,
            roomname : roomid
         }); 
      }
   }
});






//LOGIN
app.post('/login', parseForm, csrfProtection, function(req, res){
   if(req.session.user == undefined){ // Pas de session active
      if(connectedUsers[req.body.identifiant] == undefined){ // Identifiant non defini
         
         //Generer identifiant si envoi du user vide
         var id = "GeneratedUsername" ;
         if(req.body.identifiant.length >= 1)
            id = req.body.identifiant;
         
         //Initialisation d'une session
         req.session.user = {
           username : id
         };
         
         //Ajout de l'utilisateur dans la liste
         connectedUsers[id] = req.session.user;
         
         //Affichage tu tableau de bord user
         res.redirect("/roomlist");
      }
      else{ //Identifiant deja existant
         //On affiche la page de connection avec erreur
         res.render('login.twig', {
            error : true,
            errorMessage : "Identifiant déjà utilisé",
            disconnect : false
         });
      }
      
   }
   else { // session deja active
         //Affichage tu tableau de bord user
         res.redirect("/roomlist"); 
   }
   
});

// Route pour la gestion de la déconnection à l'application
app.get('/logout', function(req, res){
   if(req.session == undefined){ // pas de session active
      res.redirect('/');
   }
   else{ // session active on retire l utilisateur
      if(req.session.user == undefined){ // pas de session active
         res.redirect('/');
      }
      else{
         delete connectedUsers[req.session.user.username];
         req.session.destroy();
         req.session = null;
         res.redirect('/');
      }
      
   }
   

});



//Afichage de la liste des rooms
app.get('/roomlist', csrfProtection, function(req, res){
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      res.redirect('/roomlist/page/1');
   }
});

app.get('/roomlist/page/:num', csrfProtection, function(req, res){
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      var totalPages = Math.ceil(Object.keys(lightSaberRooms).length / 4);
      res.render('dashboard.twig', {
         user : req.session.user,
         rooms : reduceRooms(lightSaberRooms, req.params.num),
         csrfToken: req.csrfToken(),
         totalPages : totalPages,
         currentPage : req.params.num
      });  
   }
});

//Racine de l'application
app.get('/', csrfProtection, function(req, res){
   if(req.session.user == undefined){
      res.render('login.twig', {
         csrfToken: req.csrfToken()
      }); 
   }
   else
      res.redirect('/roomlist');
   
});





/**
 * 
 * Events
 */
//Evenements de connection
io.on('connection', function(socket){
  //Evenements de logout
  var username;
  socket.on('disconnect', function(){
    if(username !== undefined){
        console.log('User disconnected : '+username);
        var serviceMessage = {
          text : 'User "'+username+'" disconnected',
          type : 'user-logout'
        };
        socket.broadcast.emit('service-login-message', serviceMessage);
    }
  });


   //Evenements de login
  socket.on('login-alert', function(loggedUser){
    console.log('user logged in : '+loggedUser);
    username=loggedUser;
    if(username !== undefined){
      var serviceMessage = {
        text : 'User "'+username+'" logged in',
        type : 'user-login'
      };
      socket.broadcast.emit('service-message', serviceMessage);
    }
  });
  
  //Evenements de creation de room
  socket.on('new-room', function(room) {
      var serviceMessage = {
        text : "Une nouvelle room crée :"+room,
        type : 'new-room-broadcast'
      };
      socket.broadcast.emit('service-message', serviceMessage);
  });
  
  //Room active
   socket.on('active-room', function(room) {
      var serviceMessage = {
        text : "Une nouvelle room est active :"+room,
        type : 'active-room-broadcast'
      };
      socket.broadcast.emit('service-message', serviceMessage);
  });
  
   //Room active
   socket.on('none-active-room', function(room) {
      var serviceMessage = {
        text : "Une room est indisponible :"+room,
        type : 'active-room-broadcast'
      };
      socket.broadcast.emit('service-message', serviceMessage);
  });
  
  
  
  //Event transmission de coord
  socket.on('orientationemission', function(coordonnee, controller) {
     //jaugeCoord(coord);
     //console.log('Le salaud');
     socket.broadcast.emit('orientationreception', coordonnee, controller);
  });
  
  socket.on('access-event', function(Username, roomname, profile){
     console.log('access-event Server received');
     console.log("PRO :", profile);
     if(profile == 'controller'){
        socket.broadcast.emit('new-controller-event', Username, roomname);
        console.log('new-controller-event sent');
     }
     
     
  });
  
  socket.on('touchEvent', function(touchPosition, Cusername) {
      socket.broadcast.emit('touchreception', touchPosition, Cusername);
  });
  
  

});

// On lance le serveur en écoutant les connexions arrivant sur le port
http.listen(process.env.PORT, function(){
  console.log('Server is listening on *:'+process.env.PORT);
});


