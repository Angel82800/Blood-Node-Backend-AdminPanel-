var db = require('../../config/mongo.db');

exports.prefix = "/acceptance";

exports.name = "acceptance_user";

exports.engine = "handlebars";

exports.before = function(request, response, next) {
    if (request.session.accept){
        next();
    }else{
        response.redirect('/login');
    }
};

// exports.before = function(request, response, next) {
//   var id = request.params._id;
//   if (!id) return next();
//   db.User.findOne({id:id}, function(err, user) {
//     if (!user) return next('route');
//     request.var_name = user;
//     next();
//   });
// };

exports.acceptance_list = function(request, response) {
  db.User.find().exec(function(err, results) {
    for (var i=0;i<results.length;i++)
    {
      //console.log(results[i].user_accept);
      if (results[i].user_accept==1){
        results[i].acceptance="checked";
      }else{
        results[i].acceptance="";
      }
    }
    response.render("acceptance-user/list", {
      title: 'acceptance list',
      crud_user: results,
    });
  });
};
exports.acceptance_update = function(request, response) {

  var body=request.body.acceptanceToggle;
  if (body == undefined)
  {
    console.log("everybody is ignored")
    db.User.find().exec(function(err, results) {
    var on_ids=[];
    var off_ids=[];
    for (var i=0;i<results.length;i++){
        off_ids.push(results[i].id);
    }

        db.User.update({id:{"$in":off_ids}},{user_accept:0},{multi: true},function(err,states){
            if (err) throw err;
            response.redirect("/acceptance/acceptance_list");
        });

  });
  }else{
    db.User.find().exec(function(err, results) {
    var on_ids=[];
    var off_ids=[];
    var on_modified=[];
    var off_modified=[];
    var matched_user=['x','x','x','x','x'];
    var matched_info_true;
    if (Math.random()>0.7){
       matched_info_true = ['2','2','2','2','2'];
    }else if(Math.random()>0.4){
       matched_info_true = ['2','2','2','2','2'];
       matched_info_true[Math.round(Math.random()*5)]="1";
    }else{
       matched_info_true = ['2','2','2','2','2'];
       matched_info_true[Math.round(Math.random()*5)]="1";
       matched_info_true[Math.round(Math.random()*5)]="1";
    }
    
    var matched_info_false = ['0','0','0','0','0'];
    var new_match_on = {
      time:new Date(),
      matched_username:matched_user,
      matched_info:matched_info_true,
      matched_user:matched_user
    }
    var new_match_off = {
      time:new Date(),
      matched_username:matched_user,
      matched_info:matched_info_false,
      matched_user:matched_user
    }
    for (var i=0;i<results.length;i++){
      console.log(results[i].id,body[results[i].id]);

      if (body[results[i].id]=='on'){
        on_ids.push(results[i].id);
        if (results[i].user_accept==0){
          on_modified.push(results[i].id);
        }
      }else{
        off_ids.push(results[i].id);
        if (results[i].user_accept==1){
          off_modified.push(results[i].id);
        }
      }
    }
      db.User.update({id:{"$in":on_ids}},{$set:{user_accept:1}}, {multi: true},function(err,states){
        db.User.update({id:{"$in":off_ids}},{user_accept:0},{multi: true},function(err,states){
          db.User.update({id:{"$in":on_modified}},{$push:{match:new_match_on}},{multi: true},function(err,states){
            console.log(err);
            db.User.update({id:{"$in":off_modified}},{$push:{match:new_match_off}},{multi: true},function(err,states){
                response.redirect("/acceptance/acceptance_list");
            });
          });
        });
      });

 
  });
  }

};


// exports.income_verify= function(request, response) {
//   var id=request.params._id;
//   db.User.findOne({'id':id},function(err,result){
//     if (!result) return;
//   result.income_verified=2;
//   result.save(function(err){
//     if (err) return;
//     console.log("income_verified");
  
//   db.User.find({"income_verified":1}).sort({"verify_request_time": 1}).exec(function(err, results) {
//     response.render("verify-user/income_list", {
//         title: 'List Users',
//         crud_user: results
//     });
//   });
//   });
//   });
// };
