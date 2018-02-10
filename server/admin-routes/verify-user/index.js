var db = require('../../config/mongo.db');

exports.prefix = "/verify";

exports.name = "verify_user";

exports.engine = "handlebars";

exports.before = function(request, response, next) {
  if (request.session.accept){
      var id = request.params._id;
      if (!id) return next();
      db.User.findOne({id:id}, function(err, user) {
          if (!user) return next('route');
          request.var_name = user;
          next();
      });
  }else{
      response.redirect('/login');
  }

};

exports.income_list = function(request, response) {
  db.User.find({"income_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
    response.render("verify-user/income_list", {
      title: 'income_list',
      income_count: results.length,
      crud_user: results
    });
  });
};
exports.income_verify= function(request, response) {
  var id=request.params._id;
  db.User.findOne({'id':id},function(err,result){
    if (!result) return;
    result.income_verified=2;
      result.save(function(err){
          if (err) return;
      console.log("income_verified");
  
      db.User.find({"income_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
        response.render("verify-user/income_list", {
            title: 'List Users',
            crud_user: results
        });
      });
    });
  });
};
exports.profession_list = function(request, response) {
  db.User.find({"profession_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
    response.render("verify-user/profession_list", {
      title: 'List Users',
      profession_count: results.length,
      crud_user: results
    });
  });
};
exports.profession_verify= function(request, response) {
  var id=request.params._id;
  db.User.findOne({'id':id},function(err,result){
    if (!result) return;
  result.profession_verified=2;
  result.save(function(err){
    if (err) return;
    console.log("profession_verified");
  
  db.User.find({"profession_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
    response.render("verify-user/profession_list", {
        title: 'List Users',
        crud_user: results
    });
  });
  });
  });
};

exports.education_list = function(request, response) {
  db.User.find({"education_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
    response.render("verify-user/education_list", {
      title: 'List Users',
      education_count: results.length,
      crud_user: results
    });
  });
};
exports.education_verify= function(request, response) {
  var id=request.params._id;
  db.User.findOne({'id':id},function(err,result){
    if (!result) return;

    console.log("result"+result);
  result.education_verified=2;
  result.save(function(err){
    if (err) return;
    console.log("education_verified");
  
  db.User.find({"education_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
      console.log("<<<<<< step2 >>>>>>>");
    response.render("verify-user/education_list", {
        title: 'List Users',
        crud_user: results
    });
  });
  });
  });
};