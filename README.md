# Api lists #



## - POST /api/login ##

### Request ###
{
	username : “user@user.com”,
	password : “password”
}

### Response ###

{
	success : true,
	token : “a293mdfj3jeksi”
}

or

{
	success : false,
	error : “Login failed”
}



## - POST /api/register ##

### Request ###
{
	email: “user@user.com”,
	password: “password”,
	name: “Alberto Silba”,
	username: “alberto383”
}

### Response ###

{
	success : true,
	token : “a293mdfj3jeksi”
}

or

{
	success : false,
	error : “Login failed”
}

## - GET /api/logout ##

### Request ###
{
}

### Response ###

{
	result: 1,
}


## - POST /api/getProfile ##

### Request ###
{
	userid: 3482,
}

### Response ###

{
"result":1,
"ProfileInfo":
 {
  username:"username",
  displayName:"Displayname",
  profilePhoto : ""
  age:37,
  income : 50000,
  currencytype : "$",
  schools:["School1","School2"],
  about : "about me",
  gender : "male",
  photos:[]
  job : "job"
 }
}

or
{
 result : 0
 error : "Error Message"
}


## - POST /api/setProfile ##

### Request ###
{
  userid: 3482,
  username:"changed username",
  displayName:"changed Displayname",
  profilePhoto : ""
  age:37,
  income : 50000,
  currencytype : "$",
  schools:["School1","School2"],
  about : "about me",
  gender : "male",
  photos:[]
  job : "job"
}

### Response ###

{
result:1,
userid : userid
}

or
{
 result : 0
 error : "Error Message"
}
