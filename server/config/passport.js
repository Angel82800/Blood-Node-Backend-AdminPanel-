var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User_DB = require('./mongo.db');
var config = require('./main.db');

// Setup work and export for the JWT passport strategy
module.exports = function(passport) {
  console.log("passport module~~~~~~~~~~~");
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  opts.secretOrKey = config.secret;
  console.log("opts",opts);
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    done(null,true);
  }));
};