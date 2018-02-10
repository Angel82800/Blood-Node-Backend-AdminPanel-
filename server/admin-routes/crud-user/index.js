var db = require('../../config/mongo.db');

exports.prefix = "/crud";

exports.name = "user";

exports.engine = "handlebars";

var emailExistence = require('email-existence');
exports.before = function(request, response, next) {
    if (request.session.accept){
        console.log("session : "+ request.session.accept+"tete"+request.session.test);
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



exports.index = function(request, response) {
  response.redirect('/crud/users');
};

exports.list = function(request, response) {
  db.User.find().exec(function(err, results) {
    response.render("crud-user/list", {
      title: 'List Users',
      crud_user: results
    });
  });
};

exports.new = function(request, response) {
  response.render("crud-user/new", {
    title: 'New User'
  });
};

exports.create = function(request, response) {
  var user = request.body.user;
  if (user) {
    var User = new db.User({
      id: Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4),
      name: user.name,
      password: user.password,
      email: user.email,
      age:user.age,
      gender:user.gender,
      income:user.income,
      currency_type:user.currency_type,
      school:user.school,
      school_email:user.school_email,
      school_type:user.school_type,
      job:user.job,
      about:user.about
    });
    // Save 
    User.save(function(err) {
      if (err) {
        request.session.error = err.message;
        response.redirect('back');
      }
      request.session.success = 'User created succesfuly!';
      response.redirect("/crud/user/" + User.id);
    });
  } else {
    response.redirect('/crud/users');
  }
};
exports.show = function(request, response) {
  var profilePhotoURL = request.var_name.photos;
  var verifyImgURL = request.var_name.verifyImg;
  var gender ;
  var schools ;
  var match = {};
  if (request.var_name.gender==0)
  {
    gender = "male" ;
  }
  else
  {
    gender = "female" ;
  }
  var income_verified ='';
  var profession_verified ='';
  var education_verified ='';
  if(request.var_name.income_verified == 2){
    income_verified='checked';
  }
  if(request.var_name.profession_verified == 2){
    profession_verified='checked';
  }
  if(request.var_name.education_verified == true){
    education_verified='checked';
  }
  var match_length = request.var_name.match.length;
  match=request.var_name.match[match_length-1];
  response.render("crud-user/show", {
    title: 'Show User',
    crud_user: request.var_name ,
    profilePhotoURL:profilePhotoURL,
    verifyImgURL:verifyImgURL,
    gender : gender,
    income_verified:income_verified,
    profession_verified:profession_verified,
    education_verified:education_verified,
    match:match
  });
};

exports.edit = function(request, response) {
  console.log("<<<<<<<<<<<<<<edit module>>>>>>>>>>>>>>>");
  var profilePhotoURL = request.var_name.profile_photo;
  var verifyImgURL = request.var_name.verify_img;
  var income_verified ='';
  var profession_verified ='';
  var education_verified ='';
  if(request.var_name.income_verified == 2){
    income_verified='checked';
  }
  if(request.var_name.profession_verified == 2){
    profession_verified='checked';
  }
  if(request.var_name.education_verified == 2){
    education_verified='checked';
  }
  response.render("crud-user/edit", {
    title: 'Edit User',
    crud_user: request.var_name ,
    profilePhotoURL:profilePhotoURL,
    verifyImgURL:verifyImgURL,
    income_verified:income_verified,
    profession_verified:profession_verified,
    education_verified:education_verified
  });
};

exports.update = function(request, response) {
  var user = request.body.user;

  request.var_name.name = user.name;
  request.var_name.email = user.email;
  request.var_name.age = user.age;
  request.var_name.gender = user.gender;
  request.var_name.income = user.income;
  request.var_name.currency_type = user.currency_type;
  request.var_name.school = user.school;
  request.var_name.school_email = user.school_email;
  request.var_name.school_type = user.school_type;
  request.var_name.job = user.job;
  request.var_name.profile_photo = user.profile_photo;
  request.var_name.location.latitude=user.latitude;
  request.var_name.location.longitude=user.longitude;
  var photos= [];
  if (user.photo_0){
    photos.push(user.photo_0);
  }
  if (user.photo_1){
    photos.push(user.photo_1);
  }
  if (user.photo_2){
    photos.push(user.photo_2);
  }
  if (user.photo_3){
    photos.push(user.photo_3);
  }
  if (user.photo_4){
    photos.push(user.photo_4);
  }
  if (user.photo_5){
    photos.push(user.photo_5);
  }
  request.var_name.photos = photos;
  request.var_name.verify_img.income = user.income_photo;
  request.var_name.verify_img.profession = user.profession_photo;
  request.var_name.verify_img.education = user.education_photo;
  if (user.income_verified=='on'){
    request.var_name.income_verified = 2;
  }else if(user.income_photo.length>0){
    request.var_name.income_verified = 1;
  }else{
    request.var_name.income_verified = 0;
  }
  if (user.profession_verify=='on'){
    request.var_name.profession_verified = 2;
  }else if (user.profession_photo.length>0){
    request.var_name.profession_verified = 1;
  }else{
    request.var_name.profession_verified = 0;
  }
  if (user.education_verify=='on'){
    request.var_name.education_verified = true;
  }else{
    request.var_name.education_verified = false;
  }
  request.var_name.about = user.about;
  request.var_name.save(function(err){
    if (err){
      request.session.success="error"
    }else{
      request.session.success="success"
    }
  });

  //email check module-------------------------
  console.log("<<<<<<<<<<<<<<<email check module>>>>>>>>>>>>>>>>>>>>>>>>");
  emailExistence.check(user.school_email, function(err,eres){
    if (err){
      console.log(err);
    }else{
      console.log(eres);
      if (eres){
        //res.json({success:true});
        request.var_name.education_verified=true;
      }else{
        //res.json({success:false});
      }
      
    }
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  db.User.findOneAndUpdate({id: request.var_name._id}, request.var_name, function(err) {
    if (err) {
      request.session.error = 'Error updating delete user!';
    } else {
      request.session.success = 'User updated succesfuly!';
    }
    // response.redirect("/crud/user/" + request.var_name.id + "/edit");
  });
  var profilePhotoURL = request.var_name.profile_photo;
  var verifyImgURL = request.var_name.verify_img;
  var verifyStatus = request.var_name.verified;
  var income_verified ='';
  var profession_verified ='';
  var education_verified ='';
  if(request.var_name.income_verified == 2){
    income_verified='checked';
  }
  if(request.var_name.profession_verified == 2){
    profession_verified='checked';
  }
  if(request.var_name.education_verified == true){
    education_verified='checked';
  }
  response.render("crud-user/edit", {
    title: 'Edit User',
    crud_user: request.var_name ,
    profilePhotoURL:profilePhotoURL,
    verifyImgURL:verifyImgURL,
    verifyStatus:verifyStatus,
    income_verified:income_verified,
    profession_verified:profession_verified,
    education_verified:education_verified
  });
};

exports.delete = function(request, response) {
  var result = '';

  db.User.findOneAndRemove({_id: request.var_name._id}, function(err) {
    if (err) {
      request.session.error = 'Error trying delete user!';
      result = err.message
    } else {
      request.session.success = 'User deleted succesfuly!';
      result = 'Deleted'
    }

    response.json({ result: result });
  });
};