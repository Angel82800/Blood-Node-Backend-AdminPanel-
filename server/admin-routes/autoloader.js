'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var db = require('../config/mongo.db');


var Autoloader = function () {
	function Autoloader() {
		_classCallCheck(this, Autoloader);
		this.routes = [];
		this.path = __dirname;
	}

	_createClass(Autoloader, [{
		key: 'initRoutes',
		value: function initRoutes() {
			var routes = [];
			// get routes names
			fs.readdirSync(this.path).forEach(function (name) {
				//console.log("name : "+name.split('.')[0]);
				if (name !== 'autoloader.js') {
					routes.push(name.split('.')[0]);
				}
			});

			this.routes = routes;
		}
	}, {
		key: 'allRoutesNames',
		value: function allRoutesNames() {
			this.initRoutes();

			var routes = [];

			this.routes.forEach(function (name) {
				routes.push('/' + name + '*');
			});

			return routes;
		}
	}, {
		key: 'loadRoutes',
		value: function loadRoutes(expressApp, options) {
			// If verbose
			var verbose = options.verbose;
            //console.log("test:"+this.routes);

			//ADD
			expressApp.post("/login_user",function(req,res){
				console.log("email",req.body.email);
                db.User.findOne({"email":req.body.email}, function(err, result) {
                    if (err){
                        res.render('user/login', {
                            title: 'Login',
                            layout: 'auth'
                        });
					}else{
                    	if(result){
                    		console.log(result.password);
                    		if(result.password == req.body.password){
                                req.session.accept = result;
                                res.redirect('/crud');
								console.log("success111"+req.session.accept);
							}else{
                                res.render('user/login', {
                                    title: 'Login',
                                    layout: 'auth'
                                });
							}
						}else{
                            res.render('user/login', {
                                title: 'Login',
                                layout: 'auth'
                            });
						}
					}
                });
			});
			//End

			this.routes.forEach(function (name) {
				// Log module
				verbose && console.log('\n   %s:', name);

				var obj = require('./' + name);
				var name = obj.name || name;
				var prefix = obj.prefix || '';
				var engine = obj.engine || 'handlebars';
				var before = obj.before || false;
				var method;
				var path;
				var routeName;
				//console.log(obj);
				// generate routes based
				// on the exported methods
				for (var key in obj) {
					// "reserved" exports
					if (~['name', 'prefix', 'engine', 'before'].indexOf(key)) continue;
					// route exports
					switch (key) {
						case 'list':
							method = 'get';
							path = '/' + name + 's';
							break;
						case 'show':
							method = 'get';
							path = '/' + name + '/:_id';
							break;
						case 'new':
							method = 'get';
							path = '/' + name + '/new';
							break;
						case 'create':
							method = 'post';
							path = '/' + name;
							break;
						case 'acceptance_update':
							method = 'post';
							path = '/acceptance_update';
							break;
						case 'income_verify':
							console.log("<< income verify>>");
							method = 'get';
							path = '/' + 'income' + '/:_id';
							break;
						case 'profession_verify':
							method = 'get';
							path = '/' + 'profession' + '/:_id';
							break;
						case 'education_verify':
							method = 'get';
							path = '/' + 'education' + '/:_id';
							break;
						// case 'setPhoto':
						// 	method = 'post';
						// 	path = '/set_photo';
						// 	break;
						// case 'setForceAccept':
						// 	method = 'post';
						// 	path = '/set_force_accept';
						// 	break;
						// case 'getMatchedInfo':
						// 	method = 'post';
						// 	path = '/get_matched_info';
						// 	break;
						// case 'askMatch':
						// 	method = 'post';
						// 	path = '/ask_match';
						// 	break;
						// case 'setEducationVerifyPhoto':
						// 	method = 'post';
						// 	path = '/set_education_verify_photo';
						// 	break;
						// case 'setProfessionVerifyPhoto':
						// 	method = 'post';
						// 	path = '/set_profession_verify_photo';
						// 	break;
						// case 'setIncomVerifyPhoto':
						// 	method = 'post';
						// 	path = '/set_income_verify_photo';
						// 	break;
						// case 'setMatched':
						// 	method = 'post';
						// 	path = '/set_matched';
						// 	break;
						// case 'removePhoto':
						// 	method = 'post';
						// 	path = '/remove_photo';
						// 	break;
						// case 'find_users':
						// 	method = 'post';
						// 	path = '/find_users';
						// 	break;
						// case 'getprofilephoto':
						// 	method = 'post';
						// 	path = '/get_profile_photo';
						// 	break;
						// case 'changePassword':
						// 	method = 'post';
						// 	path = '/change_password';
						// 	break;
						// case 'setverifyimg':
						// 	method = 'post';
						// 	path = '/setverifyimg';
						// 	break;
						// case 'verifyemail':
						// 	method = 'post';
						// 	path = '/verify_email';
						// 	break;
						// case 'facebook_user':
						// 	method = 'post';
						// 	path = '/get_user_detail'
						// 	break;
						// case 'getverify':
						// 	method = 'post';
						// 	path = '/get_verify';
						// 	break;
						// case 'forgotpwd':
						// 	method = 'post';
						// 	path = '/forgotpwd';
						// 	break;
						// case 'uploadPhoto':
						// 	method = 'post';
						// 	path = '/uploadPhoto';
						// 	break;
						case 'edit':
							method = 'get';
							path = '/' + name + '/:_id/edit';
							break;
						case 'update':
							method = 'put';
							path = '/' + name + '/:_id';
							break;
						case 'remove':
							method = 'get';
							path = '/' + name + '/:_id/remove';
							break;
						case 'delete':
							method = 'delete';
							path = '/' + name + '/:_id';
							break;
						case 'index':
							method = 'get';
							path = prefix === '' ? '/' : '';
							break;
						default:
							method = 'get';
							path = '/' + key;
					}

					path = prefix + path;
					routeName = name + '.' + key;

					if (before) {
						expressApp[method](path, routeName, before, obj[key]);
						verbose && console.log('     %s %s -> before -> %s', method.toUpperCase(), path, routeName);
					} else {
						expressApp[method](path, routeName, obj[key]);
						verbose && console.log('     %s %s -> %s', method.toUpperCase(), path, routeName);
					}

				}
			});
		}
	}]);

	return Autoloader;
}();

module.exports = Autoloader;
