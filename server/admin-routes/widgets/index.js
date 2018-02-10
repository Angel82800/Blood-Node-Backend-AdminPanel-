exports.prefix = '/widgets';

exports.before = function(request, response, next) {
    if (request.session.accept){
        next();
    }else{
        response.redirect('/login');
    }
};

exports.index = function(request, response) {
  response.render("widgets/index", {
    title: "Widgets"
  })
};