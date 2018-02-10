
// var multer  =   require('multer');
// var User_DB=require('../../config/mongo.db');
// var filename = "";
// var Mailgun = require('mailgun-js');
// var configAuth = require('../../config/facebook.auth');
// var FB = require('fb');
// FCM = require('fcm-node');
// var firebase = require('firebase');
// var config = {
//     apiKey: "AIzaSyBHWO-CknRvJsuWme6A8kDRWjx7LUblhe0",
//     authDomain: "highblood.firebaseapp.com",
//     databaseURL: "https://highblood.firebaseio.com",
//     storageBucket: "firebase-highblood.appspot.com",
//     messagingSenderId: "810721192126"
//   };
//   firebase.initializeApp(config);
// var storage =   multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, './public/admin-lte/uploads/');
//   },
//   filename: function (req, file, callback) {
//     filename =makeFileName()+"_" + file.originalname;
//     console.log("filename="+filename);
//     callback(null, filename);
//   }
// });
// var upload = multer({ storage : storage}).single('photo');
// function remove(arr, what) {
//     var found = arr.indexOf(what);
//     while (found !== -1) {
//         arr.splice(found, 1);
//         found = arr.indexOf(what);
//     }
// }
// function makePassword()
// {
//     var text = "";
//     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//     for( var i=0; i < 10; i++ )
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// }
// function makeFileName()
// {
//     var text = "";
//     var possible = "012345678901234567890123456789012345678901234567890123456789";

//     for( var i=0; i < 10; i++ )
//         text += possible.charAt(Math.floor(Math.random() * possible.length));

//     return text;
// }
// exports.prefix = '/api';

// //exports.before = function(request, response, next) { next() };
// exports.new = function(request, response) {
//   response.render('upload/new', {
//     title: 'photo'
//   });
// };
// exports.uploadPhoto = function(req, res) {

//   upload(req,res,function(err) {
//         if(err) {
//           console.log(err);
//             return res.end("Error uploading file.");
//         }
//         console.log("file is uploaded");
//         res.end("File is uploaded");
//     });
// };

// // exports.setPhoto = function(req, res) {
// //     //var id=req.body.userid;
// //     //console.log("session-id",req.session.user.id);
// //     //var id=req.session.user.id;
// //     var id=8945;
// //     filename=id;
// //     User_DB.User.find({"id":id}, function(err,result) {
// //         console.log("setPhoto api works");
// //         if(err) {
// //            console.log(err);
// //             res.json({ success: false, error:err });
// //         }
// //         else
// //         {
// //             //var index=req.body.index;
// //             var photos=result[0].photos;
// //             // filename=req.body.userid;
// //             console.log(photos);
// //             upload(req,res,function(err) {
// //                 console.log("start uploading");
// //                 if(err) {
// //                     console.log(err);
// //                     return res.end("Error uploading file.");
// //                 }
// //                 filename="http://54.152.7.101:8080/admin/admin-lte/uploads/"+filename;
// //                 console.log(photos);
// //                 console.log("check photos");
// //                 if (photos.indexOf(filename)>-1){
// //                     console.log("already exist");
// //                     res.json({ success: false, error:"file is already exist" });
// //                     return;
// //                 }
// //                 console.log(result);
// //                 photos.push(filename);
// //                 console.log(photos);
// //                 User_DB.User.findOneAndUpdate({"id":id}, {photos:photos}, function(err, user) {
// //                     if(err) {
// //                         console.log(err);
// //                         res.json({ success: false, error:err });
// //                     }
// //                     else
// //                     {
// //                         console.log("file is uploaded");
// //                         res.json({ success: true ,url:filename});
// //                     }   
// //                 });
                
// //             });
// //         }
// //       // object of the user
// //     });
// // };
// exports.setPhoto = function(req, res) {
//     console.log("<<<<<<<<<<<<<<<<<<<set photo module>>>>>>>>>>>>>>>>>>>>>>>>>");
//     upload(req,res,function(err) {
//         if(err) {
//             console.log(err);
//             return res.end("Error uploading file.");
//         }else{
//             console.log("userid="+req.body.userid);
//             User_DB.User.findOne({"id":req.body.userid}, function(err,result) {
//               if (err)
//               {
//                 return res.end("Error uploading file.");
//               }else{
//                 console.log("saved filename="+filename);
//                 filename="http://54.152.7.101:8080/admin/admin-lte/uploads/" + filename;
//                 var photos = result.photos;
//                 console.log(result);
//                 if (photos.length<6){
//                   photos.push(filename);  
//                 }
//                 else
//                 {
//                   res.json({success:false , error:"over 6 image"});
//                   return;
//                 }
//                 console.log("photos"+photos);
//                 result.photos = photos;
//                 result.save(function(err){
//                   if (err){
//                     return res.end({success:false ,error:"Error uploading file."});
//                   }else{
//                     res.json({ success: true ,url:filename});
//                   }
//                 });
//               }
//             });
//         } 
//     });
// };
// exports.removePhoto = function(req,res) {
//     var id=req.body.userid;
//     console.log("id="+id);
//     User_DB.User.findOne({"id":id}, function(err,result) {
//         if(err) {
//            console.log(err);
//             res.json({ success: false, error:err });
//         }
//         else
//         {
//             console.log("<<<<<<<<<<<<remove photo>>>>>>>>>>>>>>>>>>>>>>");
//               console.log(result);
//             console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
//             var photos=result.photos;
//             remove(photos,req.body.url);
//             console.log(photos);
//             User_DB.User.findOneAndUpdate({"id":id}, {photos:photos}, function(err, user) {
//                 if(err) {
//                     console.log(err);
//                     res.json({ success: false, error:err });
//                 }
//                 else
//                 {
//                     // filename=req.body.userid;
//                     console.log("photo is removed");
//                     res.json({ success: true});
//                 }
//             });
//         }
//       // object of the user
//     });
// }


// exports.getprofilephoto = function(req, res) {
//     User_DB.User.find({"id":req.body.userid}, function(err,results) {
//         if(err) {
//            console.log(err);
//             res.json({ success: false, error:err });
//         }
//         else
//         {
//             var result=results[0];
//             profilePhoto=result.profile_photo;
//             //profilePhoto=result.profilePhoto;
//             res.json({success : true , photo1:profilePhoto});
//         }
//       // object of the user
//     });
// };

// exports.setIncomVerifyPhoto = function (req ,res){
//     upload(req,res,function(err) {
//         if(err) {
//             console.log(err);
//             return res.end("Error uploading file.");
//         }else{
//             User_DB.User.findOne({"id":req.body.userid}, function(err,result) {
//               if (err)
//               {
//                 return res.end("Error uploading file.");
//               }else{
//                 if (!result) return res.json({success:false , error:"Error uploading file."});
//                 filename="http://54.152.7.101:8080/admin/admin-lte/uploads/" + filename;
//                 result.verify_img.income=filename;
//                 result.save(function(err){
//                   if (err){
//                     return res.end("Error uploading file.");
//                   }else{
//                     res.json({ success: true ,url:filename});
//                   }
//                 });
                
//               }
//             });
//         } 
            
//     });

// };


// exports.setProfessionVerifyPhoto = function (req ,res){
//     upload(req,res,function(err) {
//         if(err) {
//             console.log(err);
//             return res.end("Error uploading file.");
//         }else{
//             User_DB.User.findOne({"id":req.body.userid}, function(err,result) {
//               if (err)
//               {
//                 return res.end("Error uploading file.");
//               }else{
//                 if (!result) return res.json({success:false , error:"Error uploading file."});
//                 filename="http://54.152.7.101:8080/admin/admin-lte/uploads/" + filename;
//                 result.verify_img.profession=filename;
//                 result.save(function(err){
//                   if (err){
//                     return res.end("Error uploading file.");
//                   }else{
//                     res.json({ success: true ,url:filename});
//                   }
//                 });
                
//               }
//             });
//         } 
            
//     });

// };

// exports.setEducationVerifyPhoto = function (req ,res){
//     upload(req,res,function(err) {
//         if(err) {
//             console.log(err);
//             return res.end("Error uploading file.");
//         }else{
//             User_DB.User.findOne({"id":req.body.userid}, function(err,result) {
//               if (err)
//               {
//                 return res.end("Error uploading file.");
//               }else{
//                 if (!result) return res.json({success:false , error:"Error uploading file."});
//                 filename="http://54.152.7.101:8080/admin/admin-lte/uploads/" + filename;
//                 result.verify_img.education=filename;
//                 result.save(function(err){
//                   if (err){
//                     return res.end("Error uploading file.");
//                   }else{
//                     res.json({ success: true ,url:filename});
//                   }
//                 });
                
//               }
//             });
//         } 
            
//     });

// };
// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }
// exports.askMatch = function(req , res){
//   var currentTime = new Date();
//   User_DB.User.findOne({"id":req.body.id},function(err, result){
//     User_DB.User.find({},function(errs,users){
//       var user_count = users.length;
//       var user_token = [];
//       var random_user = [];

//     // if (result.match.time)
//     // {
//     //   console.log("result.match.time is exist");
//     //   var differenceDay = daysBetween(currentTime , result.match_time);
//     //   if (differenceDay<0.5){
//     //     res.json({ success : false , error:"please send request later"});
//     //   }
//     //   else
//     //   {
//     //     res.json({success:true});
//     //     // push notification code here

//     //   }
//     // }
//     // else
//     // {
//       console.log("result.match.time is exist");
//       result.match.time=currentTime;
//         if (err)
//         {
//           res.json({success : false , error : err});
//         }else{
//             if (user_count>200){
//               var ind = 0;
//               while(ind<5){
//                 var random_index=getRandomInt(0,user_count-1);
//                 if (users[random_index].userid && users[random_index].fcm_token){
//                   random_user.push(users[random_index].userid);
//                   user_token.push(users[random_index].fcm_token);
//                   ind+=1;
//                 }
//               }
            

//                 var serverKey = 'AAAAvMK_qL4:APA91bEuf5FopoQL-hmCYJkbRQpw-YUjnRVNFkYu5aLG5KoGUmK3N9h1fcAcl4Jw9NxKvvPjxgKtkPswmjz7kVBRHbK7q70borlUDl1J3oMRNk7JzUxy9QNuWhcSVJC0Qgp3g0hIABRd';
//                 var validDeviceRegistrationToken = 'f8SfBA_P-Bc:APA91bEFnxU05hUWCGUkxFMYRM5bXbBkc3uDEGt581Se_bHFtcOWoQSOffZ8XkpWsoWoQtNvIyqWbtmrOh7C2keQIDelyXvlHJY_zIpIQIWfZDx6Pk3vmmIaGeYs8EV3KhZmy_iKPKWQ'; //put a valid device token here
//                 var fcmCli= new FCM(serverKey);

//                 var payloadOK = {
//                     to: validDeviceRegistrationToken,
//                     data: { //some data object (optional)
//                         url: 'news',
//                         foo:'fooooooooooooo',
//                         bar:'bar bar bar'
//                     },
//                     priority: 'high',
//                     content_available: true,
//                     notification: { //notification object
//                         title: 'HELLO', body: 'World!', sound : "default", badge: "1"
//                     }
//                 };

//                 var payloadError = {
//                     to: "4564654654654654", //invalid registration token
//                     data: {
//                         url: "news"
//                     },
//                     priority: 'high',
//                     content_available: true,
//                     notification: { title: 'TEST HELLO', body: '123', sound : "default", badge: "1" }
//                 };
//                 var payloadMulticast = {
//                     registration_ids:[user_token[0],
//                         user_token[1],user_token[2],user_token[3],user_token[4],
//                         validDeviceRegistrationToken], //valid token among invalid tokens to see the error and ok response
//                     data: {
//                         url: "news"
//                     },
//                     priority: 'high',
//                     content_available: true,
//                     notification: { title: 'Hello', body: 'Multicast', sound : "default", badge: "1" }
//                 };

//                 var callbackLog = function (sender, err, res) {
//                     console.log("\n__________________________________")
//                     console.log("\t"+sender);
//                     console.log("----------------------------------")
//                     console.log("err="+err);
//                     console.log("res="+res);
//                     console.log("----------------------------------\n>>>");
//                 };

//                 function sendOK()
//                 {
//                     fcmCli.send(payloadOK,function(err,res){
//                         callbackLog('sendOK',err,res);
//                     });
//                 }

//                 function sendError() {
//                     fcmCli.send(payloadError,function(err,res){
//                         callbackLog('sendError',err,res);
//                     });
//                 }

//                 function sendMulticast(){
//                     fcmCli.send(payloadMulticast,function(err,res){
//                         callbackLog('sendMulticast',err,res);
//                     });
//                 }
//                 sendOK();
//                 sendMulticast();
//                 sendError();
//                 res.json({success : true});
//             // push notification code here
//             }else{
//               console.log("without push notification");
//               res.json({success:true});
//             }
//         }
//       });
//     });    
// };
// exports.setMatched = function(req , res){
//   User_DB.User.findOne({"id":req.body.match_userid},function(err,result){
//     if (err)
//     {
//       res.json({success:false , error : err});
//     }else{
//       if (!result.match.matched_info){
//         result.match.matched_info=[0,0,0,0,0];
//       }
//       if (result.match.matched_user.indexOf(req.body.userid)<0){
//         res.json({success:false , error : "timeout"});
//       }
//       else
//       {
//         var index=result.match.matched_user.indexOf(req.body.userid);
//         if (req.body.matched==true){
//           result.match.matched_info[index]=2;  
//         }else{
//           result.match.matched_info[index]=1;
//         }
//         res.json({success:true});
//       }
//     }
//   });
// };

// exports.getMatchedInfo = function(req, res){
//   User_DB.User.findOne({"id":req.body.userid},function(err,result){
//     if (err)
//     {
//       res.json({success:false , error : err});
//     }else{
//       if (!result.match.matched_info){
//         result.match.matched_info=[0,0,0,0,0];
//       }
//       res.json({success:true, match_result :result.match.matched_info});
//     }
    
//   });
// };
// exports.setForceAccept = function (req , res){
//   User_DB.User.findOne({"id":req.body.userid},function(err,result){
//     if (err)
//     {
//       res.json({success:false , error : err});
//     }else{
//       result.user_state=2;
//       result.save(function(err){
//         if (err) {
//           res.json({success:false , error : err});
//           return;
//         }
//       })
//       res.json({success:true, result :true});
//     }
    
//   });
// };

// exports.getverify = function(req, res){
//     User_DB.User.find({"id":req.body.userid}, function(err,results) {
//         if(err) {
//            console.log(err);
//             res.json({ success: 0, error:err });
//         }
//         else
//         {
//             var verified= {income:false,profession:false,education:false}
//             var result=results[0];
//             verified=result.verified;
//             //profilePhoto=result.profilePhoto;
//             res.json({income:verified.income , profession:verified.profession , education:verified.education});
//         }
//       // object of the user
//     });
// };

// exports.verifyemail = function(req, res){
//     console.log(req.body.email);
//     User_DB.User.find({"email":req.body.email}, function(err,results) {
//         if(err) {
//            console.log(err);
//            res.json({ success:false , error:err });
            
//         }
//         else
//         {
//             console.log(results);
//             if (results.length>0){
//                 console.log("result=1");
//                 res.json({ success:true , result:1});
//             }
//             else
//             {
//                 console.log("result=0");
//                 res.json({ success:false , result:0});
//             }
//         }
//       // object of the user
//     });
// };

// exports.forgotpwd = function(req, res){
//     User_DB.User.findOne({"email":req.body.email}, function(err,results) {
//         console.log("<<<<<<<<<<<<<<<<<<<<<<<forgotpwd module>>>>>>>>>>>>>>>>>>>>>");
//         if(err) {
//             console.log("~~~~~~~~~DBERROR~~~~~~~~~~~~");
//             console.log(err);
//             res.json({ success:false });
//         }
//         else
//         {
//             console.log("email is="+req.body.email);
//             console.log("~~~~~~~~~~user result~~~~~~~~~~~~~~~");
//             console.log(results);
//             console.log("~~~~~~~~~~user result~~~~~~~~~~~~~~~");
//             if (results){
//                 var domain_url='sandbox85606688ef0445ec8a74e71d4325f706.mailgun.org';
//                 var api_key='key-bfe7ab6eebbbcd62145804b2ad9ac8f7';
//                 var from_who="Mailgun <postmaster@sandbox85606688ef0445ec8a74e71d4325f706.mailgun.org>";
//                 var mailgun = new Mailgun({apiKey: api_key, domain: domain_url});
//                 var newPassword = makePassword();
//                 console.log("new Password="+newPassword);
//                 var data = {
//                 //Specify email data
//                   from: from_who,
//                 //The email to contact

//                   // to: body.email,
//                   to: 'herald@highblood.co',
//                 //Subject and text data  
//                   subject: 'changed password',
//                   html: newPassword
//                 }

//                 //Invokes the method to send emails given the above data with the helper library
//                 mailgun.messages().send(data, function (err, eresult) {
//                     //If there is an error, render the error page
//                     if (err) {
                        
//                         console.log("got an error: ", err);
//                         res.json({"success":false, error:"Email not available"});
//                     }
//                     //Else we can greet    and leave
//                     else {
//                         //Here "submitted.jade" is the view file for this landing page 
//                         //We pass the variable "email" from the url parameter in an object rendered by Jade
//                         results.password=newPassword;
//                         console.log("~~~~~~~~~~~~changed password module~~~~~~~~~~~~");
//                         console.log(results);
//                         console.log("~~~~~~~~~~~~changed password~~~~~~~~~~~~~~~~~~~");
//                         results.save(function(err){
//                           if (err){
//                                 console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
//                                 console.log(err);
//                                 res.json({"success":false, error:"Email not available"});
//                           }else{
//                                 console.log(eresult);
//                                 res.json({"success":true, message:"We have sent you a password to registered Email"});
//                           }
//                         });
//                     }
//                 });
                
//             }
//             else
//             {
//                 res.json({"success":false, error:"Email not available"});
//             }
//         }
//       // object of the user
//     });
// };

// exports.changePassword = function(req, res){
//   User_DB.User.findOne({"id":req.body.userid}, function(err,user) {
//         if(err) {
//             console.log("~~~~~~~~~DBERROR~~~~~~~~~~~~");
//             console.log(err);
//             res.json({ success:false });
//         }
//         else
//         {
//             if (!user) return res.json({success:false , error:"user is not exist"});
//             User_DB.comparePassword(req.body.old_password,user.password, function(err, isMatch) {
//               if (isMatch && !err) {
//               //Here "submitted.jade" is the view file for this landing page 
//               //We pass the variable "email" from the url parameter in an object rendered by Jade
//                 user.password = req.body.password;
//                 user.save(function(err){
//                   if (err){
//                         console.log(err);
//                         res.json({ success: false, error:err });
//                   }else{
                        
//                         res.json({ success:true });
//                   }
//                 });
//               } 
//               else 
//               {
//                 res.send({ success: false, error: 'old password did not match.' });
//               }
//             });
//         }
//       // object of the user
//     });
// };

// exports.find_users = function(req, res){
//   console.log(req.headers.latitude);
//   console.log(req.headers.longitude);
//   var userinfo = req.body.info;
//   var user_lat = req.headers.latitude;
//   var user_lon = req.headers.longitude;
//   var search_location;
//   var userids=[];
//   User_DB.User.findOne({"id":userinfo.userid},function(err , user){
//     User_DB.User.find({"gender" : userinfo.gender , "school_type" : userinfo.school_type},function(err, results){
//       if (err)
//       {
//         res.json({success: false , err : err});
//       }
//       else
//       {
//         for (var i=0;i<results.length;i++)
//         {
//           if (results[i].age>userinfo.min_age && results[i].age<userinfo.max_age && results[i].income > userinfo.min_income && results[i].income < userinfo.max_income){
//               search_location = user.location;
//               var distance=getDistanceFromLatLonInKm(user_lat , user_lon , search_location.latitude , search_location.longitude);
//               if (distance < userinfo.distance)
//               {
//                 userids.push(results[i].userinfo);
//               }
//           }
//         }  
//       }
//     });
//   });
//   res.json({success : true , userids : userids});
// };

// exports.facebook_user = function(req, res){
//   //   var accessToken;
//   //   FB.api('oauth/access_token', {
//   //   client_id: configAuth.facebookAuth.clientID,
//   //   client_secret: configAuth.facebookAuth.clientSecret,
//   //   redirect_uri: configAuth.facebookAuth.callbackURL
//   //   }, function (response) {
//   //       console.log("auth");
//   //       if(!response || response.error) {
//   //           console.log(!response ? 'error occurred' : response.error);
//   //           return;
//   //       }
//   //       console.log(response);
//   //       accessToken = response.access_token;
//   //   });
//   //   var accessToken = FB.getAccessToken();
//   //   console.log("accessToken="+accessToken);
//   //   var token="EAACEdEose0cBAOtRuLZCL3z3UAXxhMZBw2qfpUY61BiZCFFgsJOmn8srJS2T0tdwniQ2KZBJKOZBakNzPd2N9GQGqLQZBkLuXZCbPGXJfaoYBY6ZC3fKdxmxWJzuj9MP4y7LqiAIih0wDRszZBBTi6jc2ih4BmNispVfLKqSGNZBFZB8QZDZD"
//   //   var url="/"+req.body.facebook_id;
//   //   FB.setAccessToken(accessToken);
//   //   console.log(url);
//   //   var fields = [
//   //     'id',
//   //     'name',
//   //     'gender']
//   //   FB.api(url,{fields: fields}, function(details) {
//   // // output the response
//   //       console.log(details);
//   //   });
// };


// function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
//   var R = 6371; // Radius of the earth in km
//   var dLat = deg2rad(lat2-lat1);  // deg2rad below
//   var dLon = deg2rad(lon2-lon1); 
//   var a = 
//     Math.sin(dLat/2) * Math.sin(dLat/2) +
//     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
//     Math.sin(dLon/2) * Math.sin(dLon/2)
//     ; 
//   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
//   var d = R * c; // Distance in km
//   return d;
// }

// function deg2rad(deg) {
//   return deg * (Math.PI/180)
// };

// function daysBetween( date1, date2 ) {
//   //Get 1 day in milliseconds
//   var one_day=1000*60*60*24;
//   var d1=new Date(date1);
//   var d2=new Date(date2);
//   // Convert both dates to milliseconds
//   var date1_ms = d1.getTime();
//   var date2_ms = d2.getTime();

//   // Calculate the difference in milliseconds
//   var difference_ms = date2_ms - date1_ms;
    
//   // Convert back to days and return
//   return difference_ms/one_day; 
// }