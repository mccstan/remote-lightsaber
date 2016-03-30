// JavaScript File
//le code jquery pour le controle de saisie dans le formulaire !!
$(function(){
  
    $("form").on("submit", function() { 
        //interdire des identifiant de moin de 4 caractères ! 
        if($("#identifiant").val().length < 4) {
            $("#div-submit").addClass("has-error");
            $("#alert p").replaceWith("<p>Votre Identifiant doit devez contenir au moins 4 caractères ! </p>");
            $("#alert").show("slow").delay(4000).hide("slow");
            return false;
        }else if(!$("#identifiant").val().match("^[a-zA-Z]+[0-9]*$")){ //ici on empêche le username de contenir des espaces et de commencé acec un chiffre 
            $("#div-submit").addClass("has-error");
            $("#alert p").replaceWith("<p>Votre Identifiant ne doit pas contenir d'espace ni commencer par un chiffre ! </p>");
            $("#alert").show("slow").delay(4000).hide("slow");
            return false;
        }
        
        /* $.post('/login',{_csrf : } ,function(result) {
            alert(result);
          });   */
        
            });
    
    
});
