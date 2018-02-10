var jwt = require('jsonwebtoken');
var passport = require('passport');
var Mailgun = require('mailgun-js');
var randtoken = require('rand-token');
var hash = require('./pass').hash,
    config   = require('../../config/main.db'),
    db   = require('../../config/mongo.db');
var schools_db = require('../../config/university.db.json');
var Auth = exports.Auth = {};
var fs = require('fs');

Auth.authenticate = function(username, pass, fn) {
  if (!module.parent) //console.log('authenticating %s:%s', username, pass);
  db.findByEmail(username, function(err, user) {
    //console.log(user);
    if (!user) return fn(new Error('cannot find user'));
    db.comparePassword(pass,user.password, function(err, isMatch) {
          if (isMatch && !err) {
            return fn(null, user); 
          }else{
            fn(new Error('invalid password'));
          }
    });
  });
}

Auth.restrict = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}
Auth.loadRoutes = function(parentApp) {
  //console.log("load Routes");
  // when you create a user, generate a salt
  // and hash the password ('foobar' is the pass here)
  var criptUsers = function(req, res, next) {
    db.users.forEach(function(user, index) {
    });
    next();
  };

  //Auth~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  parentApp.use(passport.initialize());
  require('../../config/passport')(passport);
  parentApp.post('/api/login', function(req, res){
      //console.log("<<<<<<<<<<<<login module>>>>>>>>>>>>>>");
      var latitude = req.headers.latitude;
      var longitude = req.headers.longitude;
      var fcm_token = req.body.fcm_token;
      console.log(req.body);
      db.User.findOne({"email":req.body.email}, function(err, user) {
      if (err){
        //console.log(err);
        return res.json({success:false, err:err.message});
      } 
      if (!user) {
        res.send({ success: false, message: 'Authentication failed. User not found.' });
      } else {
        // Check if password matches
        console.log(req.body.password + user.password);
        db.comparePassword(req.body.password,user.password, function(err, isMatch) {
          console.log(isMatch);
          if (isMatch && !err) {
            if (latitude && longitude)
            {
              user.location.latitude = latitude; 
              user.location.longitude = longitude;
              if (fcm_token){
                user.fcm_token = fcm_token;
              }
              //user.fcm_token = fcm_token;
              user.save(function(err){
                if (err){
                  //console.log(err);
                  res.json({ success: false, error:err });
                }
              });
            }
            //console.log(config);
            // Create token if the password matched and no error was thrown
            var token = jwt.sign({email:user.email}, config.secret);
            if (user.name=="" || user.name==undefined)
            {
              res.json({success : true,
                userid : user.id,
                token : 'JWT ' + token,
                profile_info:{
                  user_state : 0,
                    gender : user.gender
                },
              });
            } else {
              //console.log(user.id);
              var user_state = user.user_state;
              if (!user_state)
                user_state=1;
              req.session.user = user;
              res.json({
                  success : true,
                  userid : user.id,
                  token : 'JWT ' + token,
                  profile_info: {
                    name:user.name,
                    email:user.email,
                    age:user.age,
                    income : user.income,
                    currency_type : user.currency_type,
                    school:user.school,
                    about : user.about,
                    gender : user.gender,
                    photos:user.photos,
                    job : user.job,
                    email_verified:user.email_verified,
                    income_verified:user.income_verified,
                    profession_verified:user.profession_verified,
                    education_verified:user.education_verified,
                    user_state : user_state}
                });
            }

          } else {
            res.send({ success: false, error: 'Authentication failed. Passwords did not match.' });
          }
        });
      }
    });
  });

  parentApp.get('/api/dashboard', passport.authenticate('jwt', { session: false }), function(req, res) {
    res.json({ success: true});
  });

  parentApp.get('/logout', 'logout', function(req, res){
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
      res.redirect('/login');
    });
   
  });

  parentApp.post('/api/logout', passport.authenticate('jwt', { session: false }), function(req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function(){
        res.json({success: true});
    });
  });
 
  parentApp.get('/login', 'login', criptUsers, function(req, res) {
    res.render('user/login', {
      title: 'Login',
      layout: 'auth'
    });
  });

  parentApp.post('/login', function(req, res){
    Auth.authenticate(req.body.username, req.body.password, function(err, user){
      if (user) {
        //console.log("userid=",user.id);
        req.session.regenerate(function(){
          req.session.user = user;
          req.session.success = 'Authenticated as ' + user.name
            + ' click to <a href="/logout">logout</a>. '
            + ' You may now access <a href="' + parentApp.locals.url('dashboard.v2') + '">' + parentApp.locals.url('dashboard.v2') + '</a>.';
          res.redirect('/login');
        });
      } else {
        req.session.error = 'Authentication failed, please check your '
          + ' username and password.'
          + ' (use "admin" and "admin")';
        res.redirect('/login');
      }
    });
  });
  // Register route
  parentApp.get('/register', 'register', function(req, res) {
    res.render( 'user/register', {
      title: 'Register',
      layout: 'auth'
    });
  });
  parentApp.post('/register', function(req, res) {
    //console.log("User : " + req.body);
    var body = req.body;

    if (body) {
      //console.log("Email : " + body.email);
      db.findByEmail(body.email, function(err, user) {
        var token=randtoken.generate(32);
        //console.log("token=",token);
        if (!user) {
          var User = new db.User({
            id: Math.floor(100000 + Math.random() * 900000).toString().substring(0,4),
            password: body.password,
            name: body.name,
            email: body.email,
            token:token
          });
          User.save(function(err) {
            if (err) req.session.error = err.message;
            else{
                req.session.success = 'User saved successfuly!';
                db.users.push(User);
            } 
            res.redirect('/register');
          });
        }
        else {
          req.session.error = "Email is already Exists";
          res.redirect('/register');
        }
      });
    }
    else
    {
      res.redirect('/register');
    }
  });

  parentApp.post('/api/register', function(req, res) {

    var body = req.body;
    var interested_in = 0;
    if (body.gender==0) interested_in=1;
    var latitude = req.headers.latitude;
    var longitude = req.headers.longitude;
    var fcm_token = req.body.fcm_token;
    var request_time = new Date();
    if (body) {
      db.User.findOne({email:body.email}, function(err, user) {
        if (err) return res.json({success:false,error:err});
        if (user) return res.json({success:false,error:"email already exist"});
        if (!user) {
          var User = new db.User({
            id: Math.floor(100000 + Math.random() * 900000).toString().substring(0,6),
            password: body.password,
            email: body.email,
            gender:body.gender,
            //fcm_token:fcm_token,
            name: "",
            age: 0,
            income : 0,
            currency_type : "USD",
            school : "",
            photos:[],
            about : "",
            verify_img : {
              income:"",
              profession:"",
              education:""
            },
            verify_request_time:request_time,
            email_verified:false,
            income_verified:0,
            profession_verified:0,
            education_verified:false,
            location : {
              latitude: latitude,
              longitude: longitude
            },
            job : "",
            fcm_token : fcm_token,
            settings : {
              discovery : {
                maximum_distance : 80,
                interested_in : interested_in,
                age_range : "18,25",
                schools:[],
                income:"0",
                currency_type:"USD"
              },
              show_my_profile:true,
              notification : {
                new_match : true,
                new_message : true,
                in_app_vibration : false,
                in_app_sound : false 
              }
            },
            user_state : 0
          });
          User.save(function(err) {
            if (err) {
              req.session.error = err.message;
              return res.json({success: 0,
                error : err.message,
                });
            }
            else{

//~~~~~~~~~~~~~~~~~~~~~mailGun~~~~~~~~~~~~~~~~~~~~~~~~

                // var domain_url='sandbox85606688ef0445ec8a74e71d4325f706.mailgun.org';
                // var api_key='key-bfe7ab6eebbbcd62145804b2ad9ac8f7';
                // var from_who="Mailgun <postmaster@sandbox85606688ef0445ec8a74e71d4325f706.mailgun.org>";
                // var mailgun = new Mailgun({apiKey: api_key, domain: domain_url});

                // var data = {
                // //Specify email data
                //   from: from_who,
                // //The email to contact
                //   to: body.email,
                // //Subject and text data  
                //   subject: 'verify mail from highblood',
                //   html: 'Welcome to highblood'
                // }

                // //Invokes the method to send emails given the above data with the helper library
                // mailgun.messages().send(data, function (err, eresult) {
                //     //If there is an error, render the error page
                //     if (err) {
                        
                //         //console.log("got an error: ", err);
                //     }
                //     //Else we can greet    and leave
                //     else {
                //         //Here "submitted.jade" is the view file for this landing page 
                //         //We pass the variable "email" from the url parameter in an object rendered by Jade
                        
                //         //console.log(eresult);
                //     }
                // });

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                var token = jwt.sign({email:User.email}, config.secret);
                // User.fcm_token=token;
                // User.save(function(err){
                //   if (err){
                //     return res.json({success:0});
                //   }
                // })
                req.session.success = 'User saved successfuly!';
                db.users.push(User);
                res.json({success: true,
                  userid : User.id,
                  token : 'JWT ' + token,
                  gender : User.gender
                });
            } 
          });
        }
      });
    }
    else
    {
      res.json({result: false,
          error : "Failed Registeration",
      });
    }
  });


  parentApp.post('/api/set_profile',passport.authenticate('jwt', { session: false }), function(req, res) {

    var body = req.body;
    var photos = body.photos;
    console.log(photos);
    var longitude = req.headers.longitude;
    var latitude = req.headers.latitude;
      if( Object.prototype.toString.call( photos ) === '[object Array]' ) {
          photos = photos;
      }else{
          photos = JSON.parse(photos);
      }
    if (photos==null || photos==undefined){
      //console.log("No photos");
      photos = [];
    }

    if (photos.length==0){
      photos=[];
    }
    //console.log("photos",photos);
    if (body) {
      db.User.findOne({"id":body.userid}, function(err, user) {
        //console.log("User : " + user);
        if (user) {
          var user_state=user.user_state;
          if (user_state<2){
            user_state=1;
          }
          if (body.name) user.name = body.name;
          if (body.age) user.age = body.age;
          if (body.income) user.income = body.income;
          if (body.currency_type) user.currency_type = body.currency_type;
          if (body.school) user.school = body.school;
          if (body.about) user.about = body.about;
          if (body.gender) user.gender = body.gender;
          if (photos) user.photos = photos;
          if (body.job) user.job = body.job;
          if (user_state) user.user_state=user_state;
          if (longitude) user.location.longitude = longitude;
          if (latitude) user.location.latitude = latitude;
          user.save(function(err) {
            if (err) req.session.error = err.message;
            else{
                req.session.success = 'User saved successfuly!';
                db.changeUser(user);
            }
            res.json({success: true,
                 userid : user.id,
                });
          });
        }
        else {
          req.session.error = "User is not exists";
            res.json({success: false,
                error : "User is not exists",
                });
        }
      });
    }
    else
    {
      res.json({success: 0,
          error : "Failed",
          });
    }
  });

  parentApp.post('/api/get_profile',passport.authenticate('jwt', { session: false }), function(req, res) {

    var body = req.body;
    //console.log(body);
    //console.log("userid=",body.userid);
    if (body.userid) { 

      db.User.findOne({"id":body.userid}, function(err, user) {
        //console.log("User : " + user);
        if (user) {
          var token = jwt.sign({email:user.email}, config.secret);
          res.json(
            {
              success: true,
              userid : user.id ,
              token : 'JWT ' + token,
              profile_info : 
              {
                name: user.name,
                email:  user.email,
                age: user.age,
                income : user.income,
                currency_type : user.currency_type,
                school : user.school,
                gender : user.gender,
                photos : user.photos,
                job : user.job,
                about : user.about,
                email_verified:user.email_verified,
                income_verified:user.income_verified,
                profession_verified:user.profession_verified,
                education_verified:user.education_verified,
                user_state : user.user_state,
                match:user.match
              }
            });
        }
        else {
          req.session.error = "User is not exists";
            res.json({success: false,
                error : "User is not exists",
                });
        }
      });
    }
    else
    {
      res.json({success: false,
          error : "Failed",
          });
    }
  });




parentApp.post('/api/set_success',passport.authenticate('jwt', { session: false }), function(req, res) {

    var body = req.body;
    if (body.userid) {
      db.User.findOne({"id":body.userid}, function(err, user) {
        //console.log("User : " + user);
        if (user) {
          user.user_state = 2;
          user.save();
          res.json(
            {
              success: true,
              userid : user.id

            });
        }
        else {
            res.json({success: false,
                error : "User is not exists",
                });
        }
      });
    }
    else
    {
      res.json({success: false,
          error : "Failed",
          });
    }
  });




  parentApp.post('/api/get_other_info',passport.authenticate('jwt', { session: false }), function(req, res) {

    var body = req.body;
    if (body) { 

      db.User.findOne({"id":body.userid}, function(err, user) {
        //console.log("User : " + user);
        if (user) {
          res.json(
            {
              success: true,
              profile_info : 
              {
                name: user.name,
                email:  user.email,
                age: user.age,
                income : user.income,
                currency_type : user.currency_type,
                school : user.school,
                about : user.about,
                gender : user.gender,
                photos : user.photos,
                job : user.job,
              }
            });
        }
        else {
          req.session.error = "User is not exists";
            res.json({success: false,
                error : "User is not exists",
          });
        }
      });
    }
    else
    {
      res.json({success: false,
          error : "Failed",
          });
    }
  });


    var multer  =   require('multer');
    var User_DB=require('../../config/mongo.db');
    var filename = "";
    var configAuth = require('../../config/facebook.auth');
    var FB = require('facebook-node');
    FCM = require('fcm-node');
    var firebase = require('firebase');
    var emailExistence = require('email-existence');
    var config_firebase = {
        apiKey: "AIzaSyBHWO-CknRvJsuWme6A8kDRWjx7LUblhe0",
        authDomain: "highblood.firebaseapp.com",
        databaseURL: "https://highblood.firebaseio.com",
        storageBucket: "firebase-highblood.appspot.com",
        messagingSenderId: "810721192126"
      };
      firebase.initializeApp(config_firebase);
    var storage =   multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, './public/admin-lte/uploads/');
      },
      filename: function (req, file, callback) {
        filename =makeFileName()+"_" + "photo.jpg";
        //console.log("filename="+filename);
        callback(null, filename);
      }
  });
  var upload = multer({ storage : storage},{limits : {fieldNameSize : 10}}).single('photo');
  function remove(arr, what) {
      var found = arr.indexOf(what);
      while (found !== -1) {
          arr.splice(found, 1);
          found = arr.indexOf(what);
      }
  }
function makePassword()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function makeFileName()
{
    var text = "";
    var possible = "012345678901234567890123456789012345678901234567890123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

parentApp.post('/api/set_photo', function(req, res) {
    console.log("<<<<<<<<<<<<<<<<<<<set photo module11111111111111111>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.log(req.body);
 //   console.log(req.files);
    upload(req,res,function(err) {
        if(!err || err.message == "Unexpected end of multipart data") {

            var idTemp=req.body.userid;
            var id=req.body.userid;
            if(id == null){
              id = req.headers.userid;
              idTemp = req.headers.userid;
            }
            
            if (typeof idTemp=='object')
            {
              id=idTemp[0];
            }
            console.log("id=",id);
            filename1="http://192.168.0.71:8080/admin/admin-lte/uploads/" + filename;//158.69.211.23
            console.log(filename1);
            res.json({ success: true ,url:filename1});
        } else{
          console.log(err);
          res.json({success:false ,error:"Error uploading file."});
        }
    });
});

parentApp.post('/api/remove_photo',passport.authenticate('jwt', { session: false }), function(req, res) {
    var id=req.body.userid;
    if (id){
    //console.log("id="+id);
    User_DB.User.findOne({"id":id}, function(err,result) {
        if(err) {
           //console.log(err);
            res.json({ success: false, error:err });
        }
        else
        {
            //console.log("<<<<<<<<<<<<remove photo>>>>>>>>>>>>>>>>>>>>>>");
              //console.log(result);
            //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            var photos=result.photos;
            remove(photos,req.body.url);
            //console.log(photos);
            User_DB.User.findOneAndUpdate({"id":id}, {photos:photos}, function(err, user) {
                if(err) {
                    //console.log(err);
                    res.json({ success: false, error:err });
                }
                else
                {
                    // filename=req.body.userid;
                    //console.log("photo is removed");
                    res.json({ success: true});
                }
            });
        }
    });
  }else{
    res.json({ success: false});
  }
});



parentApp.post('/api/get_profile_photo',passport.authenticate('jwt', { session: false }), function(req, res) {
    User_DB.User.find({"id":req.body.userid}, function(err,results) {
        if(err) {
           //console.log(err);
            res.json({ success: false, error:err });
        }
        else
        {
            var result=results[0];
            profilePhoto=result.profile_photo;
            res.json({success : true , photo1:profilePhoto});
        }
    });
});

parentApp.post('/api/set_income_verify_photo',passport.authenticate('jwt', { session: false }), function(req, res) {
    console.log("<<<<<<<<<<<<<< set_income_verify_photo Module >>>>>>>>>>>>>>>>>>");
    upload(req,res,function(err) {
        if(!err) {
            console.log(err);
            return res.json("Error uploading file.");
        }else{
            console.log(req.body.userid);
            var idTemp=req.body.userid;
            var id=req.body.userid;
            console.log("prevID",id);

            if(id == null){
                id = req.headers.userid;
                idTemp = req.headers.userid;
            }

            if (typeof idTemp=='object')
            {
              id=idTemp[0];
            }
            User_DB.User.findOne({"id":id}, function(err,result) {
              if (err)
              {
                return res.json("Error uploading file.");
              }else{
                if (!result) return res.json({success:false , error:"Error uploading file."});
                filename="http://192.168.0.71:8080/admin/admin-lte/uploads/" + filename;
                result.verify_img.income=filename;
                result.income_verified = 1;
                if (result.profession_verified==0){
                  result.verify_request_time = new Date();
                }
                  result.save(function(err){
                  if (err){
                    return res.end("Error uploading file.");
                  }else{
                    res.json({ success: true ,url:filename});
                  }
                });
                
              }
            });
        } 
            
    });

});


parentApp.post('/api/set_profession_verify_photo',passport.authenticate('jwt', { session: false }), function(req, res) {
    upload(req,res,function(err) {
        if(!err) {
            //console.log(err);
            return res.end("Error uploading file.");
        }else{
            var idTemp=req.body.userid;
            var id=req.body.userid;

            if(id == null){
                id = req.headers.userid;
                idTemp = req.headers.userid;
            }

            if (typeof idTemp=='object')
            {
              id=idTemp[0];
            }
            //console.log("prevID",id);
            User_DB.User.findOne({"id":id}, function(err,result) {
              if (err)
              {
                return res.end("Error uploading file.");
              }else{
                if (!result) return res.json({success:false , error:"Error uploading file."});
                filename="http://192.168.0.71:8080/admin/admin-lte/uploads/" + filename;//192.168.0.71:8080
                result.verify_img.profession=filename;
                result.profession_verified = 1;
                if (result.income_verified==0){
                  result.verify_request_time = new Date();
                }
                result.save(function(err){
                  if (err){
                    return res.end("Error uploading file.");
                  }else{
                    res.json({ success: true ,url:filename});
                  }
                });
              }
            });
        } 
            
    });

});

parentApp.post('/api/set_school_verify_photo',passport.authenticate('jwt', { session: false }), function(req, res) {
    upload(req,res,function(err) {
        if(!err) {
            console.log(err);
            return res.end("Error uploading file.");
        }else{
            var idTemp=req.body.userid;
            var id=req.body.userid;

            if(id == null){
                id = req.headers.userid;
                idTemp = req.headers.userid;
            }

            if (typeof idTemp=='object')
            {
              id=idTemp[0];
            }
            console.log("prevID",id);
            User_DB.User.findOne({"id":id}, function(err,result) {
              if (err)
              {
                return res.end("Error uploading file.");
              }else{
                if (!result) return res.json({success:false , error:"Error uploading file."});
                filename="http://192.168.0.71:8080/admin/admin-lte/uploads/" + filename;//192.168.0.71:8080
                result.verify_img.education=filename;
                result.education_verified = 1;
                if (result.income_verified==0){
                  result.verify_request_time = new Date();
                }
                result.save(function(err){
                  if (err){
                    return res.end("Error uploading file.");
                  }else{
                    res.json({ success: true ,url:filename});
                  }
                });
              }
            });
        } 
            
    });
});



parentApp.post('/api/set_school_email',passport.authenticate('jwt', { session: false }), function(req, res) {
    User_DB.User.findOne({"id":req.body.userid}, function(err,result) {
      if (err)
      {
        return res.end(err.message);
      }else{
        if (!result) return res.json({success:false , error:"The user is not exist."});
        result.school_email=req.body.school_email;
        result.education_verified = 1;
        result.save(function(err){
          if (err){
            return res.end(err.message);
          }else{
            res.json({ success: true});
          }
        });
      }
    });
});

parentApp.get('/activity/:_id',function(req,res){

  var id = req.params._id;
  //console.log(id);
  res.json({
    success:true
  });

});


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
parentApp.post('/api/ask_match',passport.authenticate('jwt', { session: false }), function(req, res) {
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<ask_match>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  var currentTime = new Date();
  // console.log(currentTime);
  var userid=req.body.userid;
  User_DB.User.findOne({"id":userid},function(err, result){
      //console.log("first Result : "+result);
    if (!result) return res.json({success:false , error : "user not exist"});
    if (err) return res.json({success:false , error:err.message});


    User_DB.User.find({},function(errs,users){
      var user_count = users.length;
      var user_token = [];
      var random_user = [];
      var voter_name = [];
      var match_count = 0;
      var match = [];
      console.log(result.match);
          if (result){
            if (result.match.length>0){

              	match = result.match[result.match.length-1];
                console.log("result.match.time is exist");
                var differenceDay = daysBetween(match.time,currentTime);
                console.log(differenceDay);
                var d = parseInt(Number((0.5-differenceDay)*60*60*24*1000));
                console.log(d);
                if(match.hasOwnProperty('matched_info')){
                    for (var i=0 ; i< 5 ; i++){
                        if (match.matched_info[i]==2){
                            match_count++;
                        }
                    }
                    if (differenceDay<0.5){
                        return res.json({ success : true , time_remaining : d , match_result :match.matched_info,voters : arr_test(match.matched_username) });//Jin match.matched_info
                    }
                }else{
                    if (differenceDay<0.5){
                        return res.json({ success : true , time_remaining : d , match_result :[0,2,2,2,0],voters : arr_test(match.matched_username) });//Jin match.matched_info
                    }
                }

            }

              console.log("<<<<<<<<<<<<<<<<<< User Count Test >>>>>>>>>>>>>>>>>>>>>>");
              if (user_count>5&& match_count<3)
              {
                  console.log("<<<<<<<<<<<<<<<<<< user_count>5&& match_count<3 >>>>>>>>>>>>>>>>>>>>>>");
                  var ind = 0;
                  while(ind<5){
                    var random_index=getRandomInt(0,user_count-1);
                    console.log("random:"+random_user);//
                    if (users[random_index].id!=userid && random_user.indexOf(users[random_index].id)===-1 && users[random_index].gender != result.gender){
                      if(users[random_index].id == null)
                        random_user.push("");
                      if(users[random_index].fcm_token == null)
                        user_token.push("");
                      if(users[random_index].name == null)
                        voter_name.push("");

                    }
                      ind+=1;
                  }
                  random_user[4]="3772";
                  user_token[4]="c8h7a7QHUBs:APA91bH9ETUU-3UTaGSrIGCJcsRGsLcpPWaDVfpXhyhxYgOXXHozaULlODmCr_Du5uiYlygeZB1PGlYvU00p1SSf_nKi19NL6DkOmollsBZ8QPxFyNk06aete08TyhlR9uvyyO60G5vO";
                  voter_name[4]="amisha";
                  random_user[3]="8150";
                  user_token[3]="cWtEq0nTErw:APA91bFyOdQmnkWRyYgZzdGH5TX9popLG05FoXKhVFXRHsSS2NdyIXsK3apq0sKUYZ7KVYX8S75Oiq1UwV2xdN5sLWOFqQmkDw8552t7_mcEm9-rm_DakBliYHn2PA96oLY3RAa37HQH";
                  voter_name[3]="yuna";
                    console.log("stest");
                  //random_user[3]="2685";
                  //console.log("selected voter==",voter_name);
                  // var tempid=8253;
                  // var tempfcm='f5wOo5iPqww:APA91bGKuLbO-_SVqP0aADXTlEOM6Qw3CunGeGtnCHdNXa8sR-L75N2tJTDIQPezMtjZFX8tnLrM9dPqLnPcjMFkHr4uh5XV5ABFKD0aiYoY30uC9qU4bFm310BhpJmLXOc89fYZ3Aw0';
                  // random_user.push(tempid);
                  // user_token.push(tempfcm);
                  //console.log("selected user===",random_user);
                  var new_match = {};
                  new_match.matched_user=random_user;
                  new_match.matched_info=["0","0","0","0","0"];
                  new_match.time=new Date();
                  new_match.matched_username = voter_name;
                  result.match.push(new_match);
                  console.log("result : "+result);console.log("match_result : "+new_match.matched_info);
                  result.save(function(err){
                    if (err){
                      console.log("Error:"+err);
                    }else{
                      console.log("send_notification");
                      send_notification(user_token,userid,result.name , result.profile_photo);
                      res.json({success : true ,time_remaining : 1000*60*60*24 , match_result: new_match.matched_info, voters : arr_test(voter_name) });
                    // push notification code here

                    }
                  });
              }
              else{
                console.log("without push notification");
                res.json({ success : true , time_remaining : d , match_result :[0,2,1,0,0],voters : ["","dfd","fdsf","fdsf",""]});
                //res.json({success:true, match_result :match.matched_info , voters : match.matched_username});
              }
          }
          else{
            res.json({success:false,err:"match time exist"});
          }
      });
    });
});

function send_notification(user_token,userid,name,image_url){
  var serverKey = 'AAAAvMK_qL4:APA91bEuf5FopoQL-hmCYJkbRQpw-YUjnRVNFkYu5aLG5KoGUmK3N9h1fcAcl4Jw9NxKvvPjxgKtkPswmjz7kVBRHbK7q70borlUDl1J3oMRNk7JzUxy9QNuWhcSVJC0Qgp3g0hIABRd';
  var validDeviceRegistrationToken = 'f8SfBA_P-Bc:APA91bEFnxU05hUWCGUkxFMYRM5bXbBkc3uDEGt581Se_bHFtcOWoQSOffZ8XkpWsoWoQtNvIyqWbtmrOh7C2keQIDelyXvlHJY_zIpIQIWfZDx6Pk3vmmIaGeYs8EV3KhZmy_iKPKWQ'; //put a valid device token here
  var fcmCli= new FCM(serverKey);

  var payloadMulticast = {
      registration_ids:[user_token[0],
          user_token[1],user_token[2],user_token[3],user_token[4]], //valid token among invalid tokens to see the error and ok response
      data: {
          userid: userid,
          type : 1,
          image_url : image_url
      },
      priority: 'high',
      content_available: true,
      notification: { title: '', body: 'You have been selected by the Covenant to vote whether ' + name + ' gets to be part of our exclusive network.', sound : "default", badge: "1" }
  };

  var callbackLog = function (sender, err, res) {
      console.log("\n__________________________________")
      console.log("\t"+sender);
      console.log("----------------------------------")
      console.log("err="+err);
      console.log("res="+res);
      console.log("----------------------------------\n>>>");
  };

  function sendOK()
  {
      fcmCli.send(payloadOK,function(err,res){
          callbackLog('sendOK',err,res);
      });
  }

  function sendError() {
      fcmCli.send(payloadError,function(err,res){
          callbackLog('sendError',err,res);
      });
  }

  function sendMulticast(){
      fcmCli.send(payloadMulticast,function(err,res){
          callbackLog('sendMulticast',err,res);
      });
  }
  sendMulticast();
  var watch = setTimeout(function(){checkVote(userid)},3000000);
}

parentApp.post('/api/test_notification',function(req,res){
  var serverKey = 'AAAAvMK_qL4:APA91bEuf5FopoQL-hmCYJkbRQpw-YUjnRVNFkYu5aLG5KoGUmK3N9h1fcAcl4Jw9NxKvvPjxgKtkPswmjz7kVBRHbK7q70borlUDl1J3oMRNk7JzUxy9QNuWhcSVJC0Qgp3g0hIABRd';
  var validDeviceRegistrationToken = 'f8SfBA_P-Bc:APA91bEFnxU05hUWCGUkxFMYRM5bXbBkc3uDEGt581Se_bHFtcOWoQSOffZ8XkpWsoWoQtNvIyqWbtmrOh7C2keQIDelyXvlHJY_zIpIQIWfZDx6Pk3vmmIaGeYs8EV3KhZmy_iKPKWQ'; //put a valid device token here
  var fcmCli= new FCM(serverKey);

  var payloadMulticast = {
      registration_ids: [req.body.fcm],//valid token among invalid tokens to see the error and ok response
      data: {
          type : 1,
      },
      priority: 'high',
      content_available: true,
      notification: { title: '', body: 'You have been selected by the Covenant to vote whether xxx gets to be part of our exclusive network.', sound : "default", badge: "1" }
  };

  var callbackLog = function (sender, err, res) {
      console.log("\n__________________________________")
      console.log("\t"+sender);
      console.log("----------------------------------")
      console.log("err="+err);
      console.log("res="+res);
      console.log("----------------------------------\n>>>");
  };

  function sendMulticast(){
      fcmCli.send(payloadMulticast,function(err,res){
          callbackLog('sendMulticast',err,res);
      });
  }
  sendMulticast();
})

function checkVote(userid){
  //console.log("___________________check Vote_________________________");
    User_DB.User.findOne({"id":userid},function(err, result){
      User_DB.User.find({},function(errs,users){
        var user_count = users.length;
        var matched_info=result.match[result.match.length-1].matched_info;
        //console.log(matched_info);
        var unvoted_count=0;
        for (var i=0;i<5;i++){
          if (matched_info[i]=='0'){
            unvoted_count++;
          }
        }
        if (unvoted_count>3){
          var ind = 0;
          var user_token = [];
          var random_user = [];
          while(ind<5){
            var random_index=getRandomInt(0,user_count-1);
            // if (users[random_index].userid && users[random_index].fcm_token){
            if (users[random_index].id!=userid && random_user.indexOf(users[random_index].id) === -1 && users[random_index].gender != result.gender){
              random_user.push(users[random_index].id);
              user_token.push(users[random_index].fcm_token);
              ind+=1;
            }
          }
          //var watch = setTimeout(function(){checkVote(userid)},3000);//3000000
          //console.log(random_user);
          //send_notification(user_token);
          var new_match = {};
          //console.log("reset vote~~~~~~~~~~~");
          new_match.matched_user=random_user;
          new_match.matched_info=["0","0","0","0","0"];
          new_match.time=new Date();
          result.match.push(new_match);
          result.save(function(err){
            if (!err){
              send_notification(user_token,userid,result.name,result.profile_photo);
              //console.log("send_notification");
            }
          })
        }
        
      });
    });
  //console.log("____________________________________________");
}
var Currency = require('currency-conversion');
parentApp.get('/api/currencies',passport.authenticate('jwt', { session: false }), function(req, res) {
var currency = new Currency({
  access_key: '5c5a83470fb7e02212e2380ef3dc0215',
  secure: true
});
//console.log("get currencies list");
currency.list(function(err,result){
  if (err){
    //console.log(err);
  }
  //console.log(result);
});
var liveQuery = {
  source: 'USD',
  currencies: ['SGD']
};
currency.list(liveQuery, function (err, result) {
  if (err) {
      return //console.log('Live Callback (Error): ' + JSON.stringify(err));
  }
    //console.log('Live Callback (Result): ' + JSON.stringify(result));
  res.json({
    success:true,
    currencies:result.currencies
  });
});

});

parentApp.post('/api/set_matched',passport.authenticate('jwt', { session: false }), function(req, res) {
  User_DB.User.findOne({"id":req.body.match_userid},function(err,result){
    if (err)
    {
      res.json({success:false , error : err});
    }else{
      //console.log(result);
      var matches=result.match;
      var match=matches[result.match.length-1];
      var match_matched_info=match.matched_info;
      if (match.matched_user.indexOf(req.body.userid)<0){
        //console.log("timeout");
        res.json({success:false , error : "timeout"});
      }
      else
      {
        //console.log(match.matched_user);
        var index=match.matched_user.indexOf(req.body.userid);
        //console.log(match);
        console.log("user-matched=",req.body.matched);
        if (parseInt(req.body.matched)==1){
          //console.log("matched");
          match_matched_info[index]='2';  
        }else{
          //console.log("not matched");
          match_matched_info[index]='1';
        }
        match.matched_info=match_matched_info;
        matches[result.match.length-1]=match;
        //console.log(matches);
        result.match.splice(result.match.length-1,1);
        result.match.push(match);
        result.save(function(err){
          if (err){
            res.json({success:false,err:err});
          }else{
            //console.log("success");
            // var serverKey = 'AAAAvMK_qL4:APA91bEuf5FopoQL-hmCYJkbRQpw-YUjnRVNFkYu5aLG5KoGUmK3N9h1fcAcl4Jw9NxKvvPjxgKtkPswmjz7kVBRHbK7q70borlUDl1J3oMRNk7JzUxy9QNuWhcSVJC0Qgp3g0hIABRd';
            // var validDeviceRegistrationToken=result.fcm_token;
            // var fcmCli= new FCM(serverKey);
            // var callbackLog = function (sender, err, res) {
            //               //console.log("\n__________________________________")
            //               //console.log("\t"+sender);
            //               //console.log("----------------------------------")
            //               //console.log("err="+err);
            //               //console.log("res="+res);
            //               //console.log("----------------------------------\n>>>");
            //           };
            // var payloadOK = {
            //     to: validDeviceRegistrationToken,
            //     data: { //some data object (optional)
            //         index:index,
            //         result:req.body.matched,
            //         type:1
            //     },
            //     priority: 'high',
            //     content_available: true,
            //     notification: { //notification object
            //         title: 'HELLO', body: 'Match Result!', sound : "default", badge: "1" 
            //     }
            // };
            // fcmCli.send(payloadOK,function(err,res){
            //     callbackLog('sendOK',err,res);
            // });

            res.json({success:true});
          }
        });
      }
    }
  });
});

parentApp.post('/api/set_force_accept',passport.authenticate('jwt', { session: false }), function(req, res) {
  //console.log("~~~~~~~~~~~~~~~~~~~~~set force accept~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  User_DB.User.findOne({"id":req.body.userid},function(err,result){
    if (err)
    {
      res.json({success:false , error : err});
    }else{
      //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      if (result.length==0) return res.json({success:false, error:"user does not exist"});
      result.user_state=2;
      result.user_accept=1;
      result.save(function(err){
        if (err) {
          return res.json({success:false , error : err});
        }
      })
      //console.log("strip start");
      var currency_type = result.settings.discovery.income;
      //strip test~~~~~~~~~~~~~~~~~~~~~~~~~
      var stripe = require('stripe')('pk_test_tewZEoVMZZTsIiL6aBhdSrsG');
      stripe.setApiKey('sk_test_sDKY7TjdYrO0xfcEZrjytoig');
      stripe.setTimeout(20000); // in ms (default is node's default: 120000ms)
      stripe.customers.create({
        email: result.email
      }).then(function(customer){
        return stripe.customers.createSource(customer.id, {
          source: {
             object: 'card',
             exp_month: 10,
             exp_year: 2018,
             number: req.body.card_number,
             cvc: req.body.cvc
          }
        });
      }).then(function(source) {
        return stripe.charges.create({
          amount: req.body.amount*20,
          currency: currency_type,
          customer: source.customer
        });
      }).then(function(charge) {
        // New charge created on a new customer 
      }).catch(function(err) {
        // Deal with an error 
        return res.end("payment err");
      });
      //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


      res.json({success:true, result :true});
    }
  });
});

parentApp.post('/api/get_verify',passport.authenticate('jwt', { session: false }), function(req, res) {
    User_DB.User.findOne({"id":req.body.userid}, function(err,results) {
        if(err) {
           //console.log(err);
            res.json({ success: 0, error:err });
        }
        else
        {
            var verified= {income:false,profession:false,education:false}
            var result=results;
            verified=result.verified;
            //profilePhoto=result.profilePhoto;
            res.json({income:verified.income , profession:verified.profession , education:verified.education});
        }
      // object of the user
    });
});




parentApp.post('/api/verify_email', function(req, res) {
    console.log(req.body);
    User_DB.User.find({"email":req.body.email}, function(err,results) {
        if(err) {
           //console.log(err);
           res.json({ success:false , error:err });
        }
        else
        {
            console.log(results);
            if (results.length>0){
                console.log("result=1");
                res.json({ success:true , result:1});
            }
            else
            {
                console.log("result=0");
                res.json({ success:false , result:0});
            }
        }
      // object of the user
    });
});
parentApp.post('/api/forgotpwd', function(req, res) {
    User_DB.User.findOne({"email":req.body.email}, function(err,results) {
        //console.log("<<<<<<<<<<<<<<<<<<<<<<<forgotpwd module>>>>>>>>>>>>>>>>>>>>>");
        if(err) {
            //console.log("~~~~~~~~~DBERROR~~~~~~~~~~~~");
            //console.log(err);
            res.json({ success:false });
        }
        else
        {
            //console.log("email is="+req.body.email);
            //console.log("~~~~~~~~~~user result~~~~~~~~~~~~~~~");
            //console.log(results);
            //console.log("~~~~~~~~~~user result~~~~~~~~~~~~~~~");
            if (results){
                var domain_url='mg.highblood.co';
                var api_key='key-bfe7ab6eebbbcd62145804b2ad9ac8f7';
                var from_who="HighBlood";
                var mailgun = new Mailgun({apiKey: api_key, domain: domain_url});
                var newPassword = makePassword();
                //console.log("new Password="+newPassword);
                var data = {
                  from: from_who,
                  to: req.body.email,
                  subject: 'changed password',
                  html: newPassword
                }
                mailgun.messages().send(data, function (err, eresult) {
                    if (err) {
                        //console.log("got an error: ", err);
                        res.json({"success":false, error:"Email not available"});
                    }
                    else {
                        results.password=newPassword;
                        results.save(function(err){
                          if (err){
                                res.json({"success":false, error:"Email not available"});
                          }else{
                                res.json({"success":true, message:"We have sent you a password to registered Email"});
                          }
                        });
                    }
                });
            }
            else
            {
                res.json({"success":false, error:"Email not available"});
            }
        }
    });
});
parentApp.post('/api/change_password',passport.authenticate('jwt', { session: false }), function(req, res) {
  User_DB.User.findOne({"id":req.body.userid}, function(err,user) {
        if(err) {
            //console.log("~~~~~~~~~DBERROR~~~~~~~~~~~~");
            //console.log(err);
            res.json({ success:false });
        }
        else
        {
            if (!user) return res.json({success:false , error:"user is not exist"});
            User_DB.comparePassword(req.body.old_password,user.password, function(err, isMatch) {
              if (isMatch && !err) {
                user.password = req.body.password;
                user.save(function(err){
                  if (err){
                        //console.log(err);
                        res.json({ success: false, error:err });
                  }else{
                        
                        res.json({ success:true });
                  }
                });
              } 
              else 
              {
                res.send({ success: false, error: 'old password did not match.' });
              }
            });
        }
    });
});
parentApp.post('/api/find_users',passport.authenticate('jwt', { session: false }), function(req, res) {
  var userid = req.body.userid;
  var search_location;
  var users=[];
  User_DB.User.findOne({"id":userid},function(err , user){

  	var min_age = user.settings.discovery.age_range.split(",")[0];
  	var max_age = user.settings.discovery.age_range.split(",")[1];
  	var income = user.settings.discovery.income;
    if (!income){
      income = 0;
    }
  	var distance = user.settings.discovery.maximum_distance;
    var see_other_verified_profiles = user.settings.see_other_verified_profiles;
  	var user_lat = user.location.latitude;
  	var user_lon = user.location.longitude;
    var gender = user.settings.discovery.interested_in;
    var schools = user.settings.discovery.schools;
    var like_popup = false;
    if (typeof user.like_users == 'undefined' || user.like_users.length==0) like_popup=true;
    var unlike_popup = false;
    if (typeof user.unlike_users == 'undefined' || user.unlike_users.length==0) unlike_popup=true;
    // //console.log("interested_in=",gender);
    // //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    // //console.log(user.like_users,user.unlike_users);
    // //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    User_DB.User.find({},function(err, results){
      if (err)
      {
        res.json({success: false , err : err});
      }
      else
      {
      	if (!results){
      		res.json({success: false , message : "there is no user" ,});
      	}else{
      		//console.log("searched result count",results.length);
	        for (var i=0;i<results.length;i++)
	        { 
            //console.log(results[i].id);
            if (user.unlike_users.indexOf(results[i].id)>-1 || user.like_users.indexOf(results[i].id)>-1) continue;
            if (see_other_verified_profiles == true && results[i].income_verified <2 && results[i].profession_verified<2 && results[i].education_verified<2) continue;
            if (schools.length!=0 && schools.indexOf(results[i].school)==-1) continue;//jin
	                ////console.log(min_age,"<",results[i].age,"<",max_age,results[i].income,">",income);
	          if (results[i].age>min_age && results[i].age<max_age && results[i].income >= income ){//jin
              ////console.log("interested_in=",gender ,results[i].name,"=", results[i].gender);
              if ((results[i].gender==gender && gender !=2) || (gender == 2)){
	              search_location = results[i].location;
	              var diff_distance=getDistanceFromLatLonInKm(user_lat , user_lon , search_location.latitude , search_location.longitude);
	              ////console.log("diff_distance=",diff_distance , "<>",distance);
	               if (diff_distance <= distance)//jin
	              // {
	                	var temp_user={};
	                	if (results[i].id!=user.id){
	                		temp_user.userid = results[i].id;
	                		temp_user.name = results[i].name;
	                		temp_user.age = results[i].age;
	                		temp_user.income = results[i].income;
	                		temp_user.currency_type = results[i].currency_type;
	                		temp_user.school = results[i].school;
	                		temp_user.about = results[i].about;
	                		temp_user.gender = results[i].gender;
	                		temp_user.photos = results[i].photos;
	                		temp_user.job = results[i].job;
	                		temp_user.email_verified = results[i].email_verified;
	                		temp_user.income_verified = results[i].income_verified;
	                		temp_user.profession_verified = results[i].profession_verified;
	                		temp_user.education_verified = results[i].education_verified;
	                		users.push(temp_user);
	                	}
	            	  //}
	              }//jin
                //}
	          }//jin
	        }
	        if (users.length==0){
				res.json({success : true , message : "There are no profiles matched you may change your discovery settings for better results", Should_show_like_popup:like_popup ,Should_show_nope_popup:unlike_popup});
	        }else{
	        	res.json({success : true , users : users , Should_show_like_popup:like_popup ,Should_show_nope_popup:unlike_popup});
	        }
      	}
      }
    });
  });
});

parentApp.post('/api/register_facebook',function(req, response) {

  //console.log(req.body.access_token);
  var body=req.body;
  var token='';
  var fcm_token = req.body.fcm_token;
  console.log(fcm_token);
  var id=Math.floor(100000 + Math.random() * 900000).toString().substring(0,4);
  FB.setAccessToken(body.access_token);
  var body = 'My first post using facebook-node';
  FB.api('/me', { fields: ['id', 'name','friends','email','gender','location','birthday','education','about','currency','work','albums'] }, function (res) {
    if(!res || res.error) {
      //console.log(!res ? 'error occurred' : res.error);
        //print('whitedove error');
      return response.json({success:false , error:"The user is not exist"});
    }else{
        FB.api(
            "/"+res.id+"/albums",
            function (response) {
                if (response && !response.error) {
                  /* handle the result */
                }
            }
        );
      User_DB.User.findOne({"email":res.email},function(err , user){
        if (err){
          return response.json({success:false , error:err.message});
        }else{
          if (user){
            
            if (fcm_token){
            	user.fcm_token= fcm_token;
            	user.save(function(err){
                  		var token = jwt.sign({email:user.email}, config.secret);
			            response.json({
			              success:true ,
			              userid : user.id, 
			              token: 'JWT ' + token,
			              profile_info: {
			                name:user.name, 
			                email:user.email,
			                age:user.age, 
			                income : user.income, 
			                currency_type : user.currency_type,
			                school:user.school, 
			                about : user.about, 
			                gender : user.gender,
			                photos:user.photos, 
			                job : user.job,
			                email_verified:user.email_verified,
			                income_verified:user.income_verified,
			                profession_verified:user.profession_verified,
			                education_verified:user.education_verified,

			                user_state : user.user_state}
			            });
            	});
            }
          }else{
                var gender = 0;
                var interested_in=1;
                if (res.gender=='female') {
                  gender=1;
                  interested_in=0;
                }

                //console.log(res.location);
                var location={
                  latitude : 0,
                  longitude : 0
                };
                if (res.location)
                {
                  location=res.location;
                }
                var education=res.education;
                var school='';
                var highSchool='';
                var college='';
                var other='';
                var schoolType=0;
                //console.log(education);
                //console.log(res.about);
                var about='';
                if (res.about)
                {
                  about=res.about;
                }
              if( Object.prototype.toString.call( education ) === '[object Array]' && education!=null) {
                  for (var i=0;i<education.length;i++){
                      var schoolTemp=education[i].school;
                      if (education[i].type=="High School"){
                          highSchool=schoolTemp.name;
                          break;
                      }else if(education[i].type=="College"){
                          college=schoolTemp.name;
                      }else{
                          other=schoolTemp.name;
                      }
                  }
              }

                if (highSchool.length>0){
                  school=highSchool;
                  schoolType=2;

                }else if(college.length>0){
                  school=college;
                  schoolType=1;
                }else{
                  school=other;
                  schoolType=0;
                }
                var age=0;
                if(res.birthday !=null){
                    var tempData=new Date(res.birthday);
                    age=new Date();
                    var ageDifMs = Date.now() - tempData.getTime();
                    var ageDate = new Date(ageDifMs); // miliseconds from epoch
                    //console.log(ageDate);
                    age=Math.abs(ageDate.getUTCFullYear() - 1970);
                }

                var workTemp = "";
                var workInfo = ""
                if(res.work !=null){
                    workTemp=res.work[0];
                    workInfo=workTemp.employer;
                }

                var currencyTemp = "";
                var currencyType = "";
                if(res.currency != null){
                    currencyTemp = res.currency;
                    currencyType=currencyTemp.user_currency;
                }
                var photo_url = ["https://graph.facebook.com/"+res.id+"/picture?height=200&width=200"];//jin6

                var User = new db.User({
                    id: id,
                    password: "",
                    email: res.email,
                    gender:gender,
                    name: res.name,
                    age: age,
                    income : 0,
                    currency_type : currencyType,
                    school : school,
                    photos:photo_url,//jin6
                    about : about,
                    verify_img : {
                      income:"",
                      profession:"",
                      education:""
                    },
                    email_verified:false,
                    income_verified:0,
                    profession_verified:0,
                    education_verified:false,
                    school_type:schoolType,
                    location : {
                      latitude: location.latitude,
                      longitude: location.longitude
                    },
                    settings : {
                      discovery : {
                        maximum_distance : 50,
                        interested_in : interested_in,
                        age_range : "18,25",
                        schools:[],
                        income:"10000",
                        currency_type:"USD"
                      },
                      show_my_profile:true,
                      notification : {
                        new_match : true,
                        new_message : true,
                        in_app_vibration : false,
                        in_app_sound : false 
                      }
                    },
                    facebook_id : res.id,
                    job : workInfo.name,
                    fcm_token : fcm_token,
                    user_state : 1
                });
                User.save(function(err) {
                  if (err) {
                    //console.log(err);
                    req.session.error = err.message;
                    return response.json({success: false,
                      message : "you are already registered",
                      });
                  }
                  else{
                      token = jwt.sign({email:User.email}, config.secret);
                      req.session.success = 'User saved successfuly!';
                      response.json({success : true ,  
                      userid : id ,
                      token : 'JWT ' + token, 
                      profile_info:{
                        name:User.name, 
                        email:User.email,
                        age:User.age, 
                        income : User.income, 
                        currency_type : User.currency_type,
                        school:User.school, 
                        about : User.about, 
                        gender : User.gender,
                        photos:User.photos, 
                        job : User.job,
                        email_verified:User.email_verified,
                        income_verified:User.income_verified,
                        profession_verified:User.profession_verified,
                        education_verified:User.education_verified,
                        user_state : User.user_state
                        }
                     });
                  } 
                });
              }
          }
        });
      }
  });
});

parentApp.post('/api/email_existence',function(req,res){
  //console.log("<<<<<<<<<<<<<<<email check module>>>>>>>>>>>>>>>>>>>>>>>>");
  emailExistence.check(req.body.email, function(err,eres){
    if (err){
      //console.log(err);
      res.json({success:false});
    }else{
      //console.log(eres);
      if (eres){
        res.json({success:true});
      }else{
        res.json({success:false});
      }
    }
  })
});

parentApp.post('/api/set_settings',function(req,res){
  var userid = req.body.userid;
  var discovery = req.body.discovery;
    if( Object.prototype.toString.call( discovery ) === '[object Array]' ) {
        discovery = discovery;
    }else{
        discovery = JSON.parse(discovery);
    }
  var show_my_profile = req.body.show_my_profile;
  var notification = req.body.notification;
    if( Object.prototype.toString.call( notification ) === '[object Array]' ) {
        notification = notification;
    }else{
        notification = JSON.parse(notification);
    }

  var schools = req.body.schools;
  var see_other_verified_profiles = req.body.see_other_verified_profiles;
  if (!userid) return res.json({success:false,error : "userid is empty"});
  User_DB.User.findOne({"id":userid},function(err , user){
    if (err) return res.json({success:false , error : "user does not exist"});
    if (!user) return res.json({success:false , error : "user does not exist"});
    var settings = {};
    settings.discovery = discovery;
    settings.show_my_profile = show_my_profile;
    settings.see_other_verified_profiles = see_other_verified_profiles;
    settings.notification = notification;
    settings.schools=schools;
    user.settings = settings;
    user.save(function(err){
      if (err) return res.json({success:false , error : "save failed"});
      res.json({
        success:true,
        result:true
      });
    });
  });
});

parentApp.post('/api/settings',function(req,res){
  var userid = req.body.userid;
  if (!userid) return res.json({success:false,error : "userid is empty"});
  User_DB.User.findOne({"id":userid},function(err , user){
    if (err) return res.json({success:false , error : "user does not exist"});
    if (!user) return res.json({success:false , error : "user does not exist"});
    res.json({
      success:true,
      discovery:user.settings.discovery,
      show_my_profile:user.settings.show_my_profile,
      see_other_verified_profiles:user.settings.see_other_verified_profiles,
      notification:user.settings.notification
    });
  });
});

parentApp.post('/api/schools',function(req,res){
  //console.log("get schools");
  //console.log(schools_db);
  res.json({
    success:true,
    schools:schools_db
  });
});

parentApp.post('/api/verify_school_email',function(req,res){
  //console.log("verified_school",req.body.userid);
  User_DB.User.findOne({"id":req.body.userid},function(err , user){
  if (!user) {
  	//console.log("user does not exit");
    res.json({
      success : false,
      message : "please try again later"
    });
    return;
  }

  var domain_url='mg.highblood.co';
  var api_key='key-bfe7ab6eebbbcd62145804b2ad9ac8f7';
  var from_who="HighBlood herald@highblood.co";
  var tempToken = jwt.sign({email:'herald@highblood.co'}, config.secret);
  var mailgun = new Mailgun({apiKey: api_key, domain: domain_url});
  var newSchool = '<h1>Verify your school email to receive verified status on HighBlood</h1><br><h5>Click below to confirm your school email address</h5><a href="http://192.168.0.71:8080/verified_school/'+tempToken+'">click here</a>';
  //console.log(req.body.school_email);
  var data = {
    from: from_who,
    // to: req.body.school_email,
    to : req.body.school_email,
    subject: 'Verify your school email',
    html: newSchool
  }

  console.log("<<<<<<<<<< Verrify School Email Data >>>>>>>>>>>>>",data);
  mailgun.messages().send(data, function (err, eresult) {
      if (err) {
          console.log("<<<<<<<<<<<<<<<<<<< verify_school_email Error >>>>>>>>>>>>>>>>>>>>");
          res.json({"success":false, error:"Email not available"});
      }
      else {
        
           if (!user){

           }else{
              user.tempToken = tempToken;
              user.school_email = req.body.school_email;
              user.education_verified = 1;
              user.save(function(err){
                if (err) return;
                res.json({"success":true, message:"Please check your email."});        
              });
           }
      }
  });
});
});
parentApp.get('/verified_school/:token',function(req,res){
  var token = req.params.token;
  User_DB.User.findOne({"tempToken":token},function(err , user){
    if (user){
      user.education_verified = 2;
      user.save(function(err){
        res.json({
          success:true,
          message:'School email verified'
        });
      });
    }else{
      res.json({
          success:false,
          message:'Activation link has expired'
      });
    }
  });
});
//test api
parentApp.post('/test',function(req,res){
  //console.log("test~");
  User_DB.User.find({}).select('settings.discovery').exec(function(err,result){
    if (err){
      //console.log(err);
      res.json({
        success:false
      });
    }else{
      res.json({
          success:true,
          data:result
      });
    }
  });

});

parentApp.post('/api/discover_swipe',function(req,res){
  var userid = req.body.userid;
  var other_userid = req.body.other_userid;
  var action = req.body.action;
  var match = 0;
  User_DB.User.findOne({id:userid},function(err,user){
    if (err) return res.json({success:false , message:'please try again'});
    User_DB.User.findOne({id:other_userid}).exec(function(err,other){
      if (err) return res.json({success:false , message:'please try again'});
      //console.log(other);
      if (!other.like_users){
         match=0;
      }else{
          if (other.like_users.indexOf(user.id)>-1){
            match = 1;
          }
          var match_idx = user.like_users.indexOf(other_userid);
          var unmatch_idx = user.unlike_users.indexOf(other_userid);
          if (action==1){
            if (match_idx<0){
              user.like_users.push(other_userid);  
            }
            if (unmatch_idx>-1){
              user.unlike_users.splice(unmatch_idx,1);
            }
          }else{
            if (unmatch_idx<0)
            {
              user.unlike_users.push(other_userid);
            }
            if (match_idx>-1){
              user.like_users.splice(match_idx,1);
            }
          }
          user.save(function(err){
            if (err) return res.json({success:false , message : 'please try again'});
            //console.log(user);
            res.json({
              success:true,
              matched:match
            })
          });
        }
    });
  });
});


parentApp.post('/api/get_all_matched',function(req,res){
  var userid = req.body.userid;
  if (!userid){
    res.json({
      success : false
    })
  }else{
    User_DB.User.findOne({id:userid},function(err,user){
      User_DB.User.find({}).exec(function(err,users){
        var matched_ids = user.like_users;
        var unmatched_ids = user.unlike_users;
        var match = [];
        for (index in matched_ids){
            for (idx in users){
              if (users[idx].id == matched_ids[index]){
              	if (users[idx].like_users.indexOf(userid)==-1) continue;
                  var temp={};
                  temp.id = users[idx].id;
                  temp.matched = true;
                  temp.name =users[idx].name;
                  temp.profile_photo =users[idx].photos[0];
                  temp.email =users[idx].email;
                  temp.school_name = users[idx].school;
                  temp.lastMessage = '';
                  //console.log(users[idx].isStartConversation,users[idx].id);
                  if (users[idx].isStartConversation){
                    if (users[idx].isStartConversation.indexOf(userid)>-1){
                      temp.isStartConversation = true;
                    }else{
                      temp.isStartConversation = false;
                    }
                  }else{
                    temp.isStartConversation = false;
                  }
                  // if (users[idx].isViewedNewMatchedUser){
                  //   if (users[idx].isViewedNewMatchedUser.indexOf(userid)>-1){
                  //     temp.isViewedNewMatchedUser = true;
                  //   }else{
                  //     temp.isViewedNewMatchedUser = false;
                  //   }
                  // }else{
                  //   temp.isViewedNewMatchedUser = false;
                  // }
                  for (lx in user.lastMessage){
                    if (user.lastMessage[lx].other_userid == temp.id){
                      temp.lastMessage = user.lastMessage[lx].message;
                      break;
                    }
                  }
                  // temp.school_verify = users[idx].education_verified;
                  match.push(temp);
              }
            }
        }
        // for (index in unmatched_ids){
        //     for (idx in users){
        //       if (users[idx].id == unmatched_ids[index]){
        //           var temp={};
        //           temp.id = users[idx].id;
        //           temp.matched = false;
        //           temp.name =users[idx].name;
        //           temp.profile_photo =users[idx].photos[0];
        //           temp.email =users[idx].email;
        //           temp.school_name = users[idx].school;
        //           temp.school_verify = users[idx].education_verified;
        //           match.push(temp);
        //       }
        //     }
        // }
        res.json({
          success:true,
          school_verify:user.education_verified,
          school_name: user.school,
          match:match
        });
      });
    });
  }

});

parentApp.post('/api/unmatch_user',function(req,res){
  var userid=req.body.userid;
  User_DB.User.findOne({id:userid},function(err,user){
    if (err){
      //console.log(err);
      res.json({
        success:false
      });
      return;
    }
    if (!user){
      res.json({
        success:false
      });
      return;
    }
    var index = user.like_users.indexOf(req.body.unmatch_userid);
    if (index>-1){
      user.like_users.splice(index,1);
    }
    if (user.unlike_users.indexOf(req.body.unmatch_userid)==-1){
      user.unlike_users.push(req.body.unmatch_userid);
    }
    user.save(function(err){
      res.json({
        success:true
      });
    });
  });
});

parentApp.post('/api/start_conversation',function(req,res){
  var userid = req.body.userid;
  var other_userid = req.body.other_userid;
  User_DB.User.findOne({id:other_userid},function(err,user){
    if (!user){
      res.json({
        success:false,
        message:"error"
      });
      return;
    }
    var index = user.isStartConversation.indexOf(userid);
    if (index<0){
      //console.log("pushed");
      user.isStartConversation.push(userid);
    }
    //user.like_users.splice(index,1);
    user.save(function(err){
      if (err){
        res.json({
          success:false,
          message:"error"
        });
      }else{
        res.json({
          success:true,
          message:"success"
        });
      }
    })
  });
}); 

parentApp.post('/api/lastMessage',function(req,res){
  var userid = req.body.userid;
  var other_userid = req.body.other_userid;
  var lastMessage = req.body.lastMessage;
  User_DB.User.findOne({id:userid}).select('lastMessage').exec(function(err,user){
    var data = user.lastMessage;
    var isExist = 0;
    for (index in data){
      if (data[index].other_userid == other_userid){
        data[index].message = lastMessage;
        isExist = 1;
        break;
      }
    }
    if (isExist==0){
      var tempData = {};
      tempData.other_userid = other_userid;
      tempData.message = lastMessage;
      user.lastMessage.push(tempData);
    }
    user.save(function(err){
      if (err) {
        res.json({
          success:false
        });
      }else{
        res.json({
          success : true
        })
      }
    });
  });
});

parentApp.post('api/viewedNewMatchedUser',function(req,res){
  var user_id = req.body.userid;
  var other_userid = req.body.other_userid;
  User_DB.User.findOne({id:other_userid},function(err,user){
    if (err){
      res.json({
          success:false,
          message:"error"
      });
      return;
    }else if (!user){
      res.json({
        success:false,
        message:"error"
      });
      return;
    }
    var index = user.isViewedNewMatchedUser.indexOf(userid);
    if (index<0){
      user.isViewedNewMatchedUser.push(userid);
    }
    user.save(function(err){
      if (err){
        res.json({
          success:false,
          message:"error"
        });
      }else{
        res.json({
          success:true,
          message:"success"
        });
      }
    });


  });

})


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
};

function daysBetween( date1, date2 ) {
  //Get 1 day in milliseconds
  var one_day=1000*60*60*24;
  var d1=new Date(date1);
  var d2=new Date(date2);
  // Convert both dates to milliseconds
  var date1_ms = d1.getTime();
  var date2_ms = d2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
    
  // Convert back to days and return
  return difference_ms/one_day; 
}

function arr_test($arr){
  if($arr.length > 0){
    for(var i = 0; i<$arr.length;i++){
      if($arr[i] == null)
        $arr[i] = "";
    }
    return $arr;
  }else{
    return [];
  }
}


};