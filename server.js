
/**
 * 
 * Chargement des composants
 **/
var express=require('express');
var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var twig=require("twig");
var session=require("express-session");
var csrf = require('csurf'); // Protection CSCRF pour sassurer que les données nous arrivant proviennent bien des formulaire que nous avons envoyés !
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
          "default-src": " 'self' 'unsafe-inline' https://maxcdn.bootstrapcdn.com/ wss://lightsaber-awsuvsq.rhcloud.com//socket.io/",
        }
    },
    hsts: {maxAge: 31536000, includeSubDomains: true, preload: true}, //Communications via HTTPS
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

//Fonction de pagination
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


//Fonction random
function getRandomArbitrary(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}



/**
 *
 * Variables globales de gestion
 */
var connectedUsers = {};
var lightSaberRooms = {};
var saberControllers = {};
var error=false;
/**
 * ROUTES
 * 
*/


// /addroom Route de gestion de la création de nouvelles rooms dans l'application
app.post('/addroom', parseForm, csrfProtection, function(req, res){
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      var id = 'Room' + getRandomArbitrary(1999, 5000096) ;
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
         control : control, 
         roomControlled : false
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


// /deleteroom  Suppression d'une room
app.get('/deleteroom/:roomid', function(req, res) {
    if(req.session.user == undefined){
      res.redirect('/');
   }
   else{
      if(lightSaberRooms[req.params.roomid].creator == req.session.user.username){
         delete lightSaberRooms[req.params.roomid];
      }
      res.redirect('/roomlist/page/1');
      
   }
});

// ∕leaveroom Route pour quitter une room.
app.get('/leaveroom/:roomid', function(req, res) {
   if(req.session.user == undefined){
      res.redirect('/');
   }
   else{// Suppression du user de la room
      delete lightSaberRooms[req.params.roomid].members[req.session.user.username];
      if(lightSaberRooms[req.params.roomid].controller == req.session.user.username){
         lightSaberRooms[req.params.roomid].roomControlled = false;
         lightSaberRooms[req.params.roomid].controller = 'Non défini';
      }
      res.redirect('/roomlist/page/1');
   }
});



// saberroom/:roomid  Route de gestion d'accès à une room
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
            lightSaberRooms[roomid].roomControlled = true;
         }
         else{
            lightSaberRooms[roomid].members[username] = username;
            profile = 'viewer' ;
            if(option == 'controller'){
               profile = 'controller' ;
               lightSaberRooms[roomid].controller = username;
               lightSaberRooms[roomid].roomControlled = true;
            }
         }
         
         req.session.user['profile'] = profile ;
         res.render('saberroom.twig', {
            user : req.session.user,
            roomname : roomid
         }); 
      }
   }
});






// /login Route de gestion de la connection d'un utilisateur su l'application avec protection CSRF
app.post('/login', parseForm, csrfProtection, function(req, res){
   if(req.session.user == undefined){ // Pas de session active
      if(connectedUsers[req.body.identifiant] == undefined){ // Identifiant non defini
         error = false;
         //Generer identifiant si envoi du user vide
         var id = 'User' + getRandomArbitrary(1999, 5000096) ; ;
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
         error=true;
         res.redirect("/");
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
         csrfToken: req.csrfToken(),
         error : error
      }); 
   }
   else
      res.redirect('/roomlist');
   
});





/**
 * 
 * Communications socket.io
 * Gestion des interactions par socket.io
 */
 
//Evenements de connection
io.on('connection', function(socket){
  //Evenements de logout
  var username;
  socket.on('disconnect', function(){
    if(username !== undefined){
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
  socket.on('orientationemission', function(coordonnee, controller, roomid) {
     //Code Broadcast
     /*
     socket.broadcast.emit('orientationreception', coordonnee, controller);
     */
     //Passage en mode multicast
     
     socket.broadcast.to(roomid).emit('orientationreception', coordonnee, controller);
     
  });
  
  socket.on('access-event', function(Username, roomname, profile){
     // Code broadcast
     /*
     console.log('access-event Server received');
     console.log("PRO :", profile);
     if(profile == 'controller'){
        socket.broadcast.emit('new-device-event', Username, roomname, profile);
        console.log('new-device-event sent');
     }
     */
     //Passage en mode multicast
     
     console.log('access-event Server received');
     console.log("PROFILE :", profile);
     socket.join(roomname);
     if(profile == 'controller'){
        if (saberControllers[roomname] == undefined){
         saberControllers[roomname] = {};
        }
        saberControllers[roomname][Username] = Username ;
        console.log(saberControllers);
        socket.broadcast.to(roomname).emit('new-controller-event', Username, roomname);
        console.log('new-controller-event server sent');
     }
     else{
        //socket.broadcast.to(roomname).emit('new-viewer-event', saberControllers[roomname], roomname);
        io.sockets.in(roomname).emit('new-viewer-event', saberControllers[roomname], roomname);
        console.log('new-viewer-event server sent');
     }
     
     
  });
  
  socket.on('touchEvent', function(touchPosition, Cusername, roomid) {
      //Broadcast mode
      /*
      socket.broadcast.emit('touchreception', touchPosition, Cusername);
      */
      //multicast mode
      console.log('touchreception sever received');
      socket.broadcast.to(roomid).emit('touchreception', touchPosition, Cusername, roomid);
      
  });
  
  
   socket.on('controllerquit', function(username, roomid) {
      //Broadcast mode
      /*
      socket.broadcast.emit('depart-controller-event', username);
      */
      //multicast mode
      console.log('touchreception server received');
      socket.broadcast.to(roomid).emit('depart-controller-event', username, roomid)
      socket.leave(roomid);
  });
  
  

});

// On lance le serveur en écoutant les connexions arrivant sur le port
http.listen(process.env.PORT, function(){
  console.log('Server is listening on *:'+process.env.PORT);
});


