var User_DB=require('../../config/mongo.db');
exports.prefix = '/dashboard';

//exports.before = function(request, response, next) { next() };

exports.index = function(request, response) {
	response.render('dashboard/index', {
		title: 'Blank Page'
	});
};
exports.v1 = function(request, response) {
	response.render('dashboard/v1', {
		title: 'V1'
	});
};
exports.v2 = function(request, response) {
	var totalUser = 0;
	var notSetProfileUser = 0;
	var unverifiedUser = 0;
	var verifiedUser =0 ;
	var male, female;
	User_DB.User.find().count(function(err,count){
		totalUser=count;
		console.log("totalUser="+totalUser);
	
	
	User_DB.User.find({user_state : 0}).count(function(err,count){
		notSetProfileUser=count;
		console.log("notSetProfileUser="+notSetProfileUser);
	// User_DB.User.findOneAndUpdate({gender:undefined}, {gender:0}, function(err, user) {
 //        if(err) {
 //            console.log(err);
 //        }
 //        else
 //        {
 //            console.log("file is uploaded");
 //        }   
    User_DB.User.find({"income_verified":1}).sort({"verify_request_time": 1}).exec(function(err, income) {
    User_DB.User.find({"profession_verified":1}).sort({"verify_request_time": 1}).exec(function(err, profession) {

	User_DB.User.find({gender : 0}).count(function(err,count){
		male=count;
		console.log("male="+male);
	User_DB.User.find({gender : 1}).count(function(err,count){
		female=count;
		console.log("female="+female);
	
	User_DB.User.find({user_state : 1}).count(function(err,count){
		unverifiedUser=count;
		console.log("unverifiedUser="+unverifiedUser);
	
	User_DB.User.find({user_accept : 1}).count(function(err,count){
		verifiedUser=count;
		console.log("verifiedUser="+verifiedUser);
	response.render('dashboard/v2', {
		title: 'V2',
		totalUser :totalUser,
		notSetProfileUser :notSetProfileUser,
		unverifiedUser : unverifiedUser,
		verifiedUser : verifiedUser,
		male : male,
		female : female,
		income_count : income.length,
		profession_count : profession.length
	});});});});});});});});});
};