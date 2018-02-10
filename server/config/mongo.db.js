var mongoose  = require('mongoose'),
    Schema    = mongoose.Schema,
    bcrypt = require('bcrypt'); //new
    urlMLocal = 'mongodb://localhost:27017/HighBlood-DB';

// Uncomment for use mongo database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/HighBlood-DB');

// Users Model
var usersSchema = new Schema({
  id: {type:Number, unique: true },
  password: String,
  name: String,
  profile_photo : String,
  email:  { type: String, unique: true },
  age: Number,
  income : Number,
  currency_type : String,
  school : String,
  photos:[String],
  about : String,
  gender : Number,
  verify_img : {
    income:String,
    profession:String,
    education:String
  },
  tempToken:String,
  verify_request_time:Date,
  email_verified:Boolean,
  income_verified:{
      type:Number,
      default:0
  },
  profession_verified:{
      type:Number,
      default:0
  },
  education_verified:{
      type:Number,
      default:0
  },
  // verified : {
  //   email:Boolean,
  //   income:Number,
  //   profession:Number,
  //   education:Number,
  //   school_email:Boolean
  // },
  location : {
    latitude: Number,
    longitude: Number
  },
  lastMessage : [{
    other_userid:Number,
    message:String
  }],
  like_users : [String],
  unlike_users : [String], 
  job : String,
  token: String,
  user_state: Number,
  user_accept:Number,
  school_type:Number,
  school_email:String,
  facebook_id : String,
  isStartConversation : [String],
  isViewedNewMatchedUser : [String],
  match:[{
    time:Date,
    matched_user:[],
    matched_info:[],
    matched_username:[]
  }],
  fcm_token:String,
  settings:{
    discovery : {
      maximum_distance : {
        type:Number,
        default:80
      },
      interested_in : Number,
      age_range : {
        type:String,
        default:"18,25"
      },
      schools:[String],
      income:String,
      currency_type:String
    },
    show_my_profile : Boolean,
    see_other_verified_profiles : {
      type:Boolean,
      default:false
    },
    notification : {
      new_match : Boolean,
      new_message : Boolean,
      in_app_vibration : Boolean,
      in_app_sound : Boolean
    }
  }
}, {collection:'users'});

var User = exports.User = mongoose.model('User', usersSchema);


// Saves the user's password hashed (plain text password storage is not good)
usersSchema.pre('save', function (next) {
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<pre save>>>>>>>>>>>>>>>>>>>>>>>>>");
  var user = this;
  console.log(this.isNew);
  if (this.isModified('password') || this.isNew) {
    console.log("~~~~~Modified~~~~~~~~");
    bcrypt.genSalt(10, function (err, salt) {
      console.log("saved new password or new user");
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    console.log("~~~next()~~~~");
    return next();
  }
});


// Create method to compare password input to password saved in database
exports.comparePassword = function(pw, user_pw, cb) {
  console.log("<<<<<<<<<<<<<<<log--encoded password , user_pw>>>>>>>>>>>>>>>>>>>>>>>>");
  console.log(pw,user_pw);
  console.log("<<<<<<<<<<<<<<<compare password>>>>>>>>>>>>>>>>>>>>>>>>>");
  if(pw == user_pw){
      return cb(null, true);
    }else
    return cb(null, false);
};



exports.getUsers = function(cb) {
  User.find().exec(function(err, results) {
    cb(err, results);
  });
};


var users = exports.users = [
  new User({ 
    id: 1, 
    name: 'admin', 
    password: 'admin', 
    email: 'admin@admin.com'
  })]

// add users from collection mongo
this.getUsers(function(err, results) {
  if (err) throw err;
  results.forEach(function(user) {
    users.push(user);
  });
});

exports.findById = function(id, cb) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].id === id) {
      return cb(null, users[i]);
    }
  }
  return cb(new Error('User ' + id + ' does not exist'));
};

exports.findByname = function(name, cb) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].name === name) {
      return cb(null, users[i]);
    }
  }
  return cb(null, null);
};

exports.findByEmail = function(email, cb) {
  for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].email === email) {
      return cb(null, users[i]);
    }
  }
  return cb(null, null);
};

exports.changeUser = function(user){
    for (var i = 0, len = users.length; i < len; i++) {
    if (users[i].id === user.id) {
      users[i] = user;
    }
  }

}