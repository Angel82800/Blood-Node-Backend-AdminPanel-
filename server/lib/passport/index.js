var passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    db       = require('../../db'),
    FacebookStrategy = require('passport-facebook').Strategy,
    configAuth = require('../../config/facebook.auth');
var Passport = exports.Passport = {};

Passport.load = function(parentApp) {
	// Configure the local strategy for use by Passport.
	//
	// The local strategy require a `verify` function which receives the credentials
	// (`username` and `password`) submitted by the user.  The function must verify
	// that the password is correct and then invoke `cb` with a user object, which
	// will be set at `req.user` in route handlers after authentication.
	passport.use(new Strategy(
	  function(username, password, cb) {
	    db.findByEmail(username, function(err, user) {
	      if (err) { return cb(err); }
	      if (!user) { return cb(null, false); }
	      if (user.password != password) { return cb(null, false); }
	      return cb(null, user);
	    });
	  }));

	// passport.use(new FacebookStrategy({
	//   clientID: configAuth.facebookAuth.clientID,
	//   clientSecret : configAuth.facebookAuth.clientSecret,
 //      callbackURL : configAuth.facebookAuth.callbackURL
	//   profileFields: ['id', 
	//   				'name',
	//   				'email',
	//   				'link', 
	//   				'locale', 
	//   				'timezone', 
	//   				'gender',
	//   				'picture',
	//   				'locale',
	//   				'photos', 
	//   				'user_friends', 
	//   				'user_about_me',
	//   				'user_birthday',
	//   				'user_education_history',
	//   				'user_location',
	//   				'user_photos',
	//   				'user_work_history'
	//   				],
	//   passReqToCallback: true
	// }, (req, accessToken, refreshToken, profile, done) => {
	// 	console.log("TestTEST");
	//   if (req.user) {
	//     User.findOne({ facebook: profile.id }, (err, existingUser) => {
	//       if (err) { return done(err); }
	//       if (existingUser) {
	//         req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
	//         done(err);
	//       } else {
	//         User.findById(req.user.id, (err, user) => {
	//           if (err) { return done(err); }
	//           user.facebook = profile.id;
	//           user.tokens.push({ kind: 'facebook', accessToken });
	//           user.name = user.name || '${profile.name.givenName} ${profile.name.familyName}';
	//           user.gender = user.gender || profile._json.gender;
	//           user.picture = user.picture || 'https://graph.facebook.com/${profile.id}/picture?type=large';
	//           user.save((err) => {
	//             req.flash('info', { msg: 'Facebook account has been linked.' });
	//             done(err, user);
	//           });
	//         });
	//       }
	//     });
	//   } else {
	//     User.findOne({ facebook: profile.id }, (err, existingUser) => {
	//       if (err) { return done(err); }
	//       if (existingUser) {
	//         return done(null, existingUser);
	//       }
	//       User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
	//         if (err) { return done(err); }
	//         if (existingEmailUser) {
	//           req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
	//           done(err);
	//         } else {
	//           const user = new User();
	//           user.email = profile._json.email;
	//           user.facebook = profile.id;
	//           user.tokens.push({ kind: 'facebook', accessToken });
	//           user.name = `${profile.name.givenName} ${profile.name.familyName}`;
	//           user.gender = profile._json.gender;
	//           user.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
	//           user.location = (profile._json.location) ? profile._json.location.name : '';
	//           user.save((err) => {
	//             done(err, user);
	//           });
	//         }
	//       });
	//     });
	//   }
	// }));

	passport.use(new FacebookStrategy({
	  clientID: configAuth.facebookAuth.clientID,
	  clientSecret : configAuth.facebookAuth.clientSecret,
      callbackURL : configAuth.facebookAuth.callbackURL

	},function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            db.User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new db.User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }));
	// Configure Passport authenticated session persistence.
	//
	// In order to restore authentication state across HTTP requests, Passport needs
	// to serialize users into and deserialize users out of the session.  The
	// typical implementation of this is as simple as supplying the user ID when
	// serializing, and querying the user record by ID from the database when
	// deserializing.
	passport.serializeUser(function(user, cb) {
	  cb(null, user.id);
	});

	passport.deserializeUser(function(id, cb) {
	  db.findById(id, function (err, user) {
	    if (err) { return cb(err); }
	    cb(null, user);
	  });
	});

	parentApp.use(passport.initialize());
	parentApp.use(passport.session());

	// Define routes.
	parentApp.get('/login', 'login', function(req, res) {
    	res.render('user/login', {
	      title: 'Login',
	      layout: 'auth'
	   	});
  	});
	  
  parentApp.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
  	console.log("login passport");
    req.session.success = 'Authenticated as ' + req.user.displayName
    + ' click to <a href="/logout">logout</a>. '
    + ' You may now access <a href="' + parentApp.locals.url('dashboard.v1') + '">' + parentApp.locals.url('dashboard.v1') + '</a>.';
    res.redirect('/login');
  });

  // =====================================
  // FACEBOOK ROUTES =====================
  // =====================================
  // route for facebook authentication and login
  parentApp.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

  // handle the callback after facebook has authenticated the user
  parentApp.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }),
  );

  parentApp.get('/profile', 'profile', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
    res.render('profile', { user: req.user });
  });
};
