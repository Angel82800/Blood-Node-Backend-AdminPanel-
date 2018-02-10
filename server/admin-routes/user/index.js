exports.prefix = '/user';

exports.before = function(request, response, next) {
    if (request.session.accept){
        next();
    }else{
        response.redirect('/login');
    }
};

exports.lockscreen = function(request, response) {
	response.render('user/lockscreen', {
		title: 'Lock Screen',
		layout: 'lockscreen'
	});
};
exports.login = function(request, response) {
	response.render('user/login', {
		title: 'Login',
		layout: 'auth'
	});
};

// exports.user_login = function (request) {
//
// }
exports.register = function(request, response) {
	response.render('user/register', {
		title: 'Register',
		layout: 'auth'
	});
};
exports.profile = function(request, response) {
	response.render('user/profile', {
		title: 'Profile'
	});
};