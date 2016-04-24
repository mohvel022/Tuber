var express = require('express')
var User = require('./models/user.js');
var Class = require('./models/class.js');
var jwt = require('jsonwebtoken')


var api = express.Router()
var jwt_secret = require('../config/auth.js').jwt_secret


api.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

api.get('/', function(req, res){
  res.json({
    'Welcome' : 'To our api bby'
  })
})

api.post('/authenticate', function(req, res) {
    var password = req.body.email || req.query.passowrd;
    var email = req.body.username || req.query.username;

    User.findOne({username: email, password: password}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
               res.json({
                    type: true,
                    data: user,
                    token: user.token
                });
            } else {
                res.json({
                    type: false,
                    data: "Incorrect email/password"
                });
            }
        }
    });
});

api.post('/signin', function(req, res) {

    var email = req.body.email || req.query.email;
    var password = req.body.password || req.query.password;

    User.findOne({email: email, password: password}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var userModel = new User();
                userModel.local.email = req.body.email ||  req.query.email;
                userModel.local.password = req.body.password || req.query.password;
                userModel.local.first = req.body.first || req.query.first;
                userModel.local.last = req.body.last || req.query.last;
                userModel.local.birthday = req.body.birthday || req.query.birthday;


                userModel.save(function(err, user) {
                    user.token = jwt.sign(user, jwt_secret);
                    user.save(function(err, user1) {
                        res.json({
                            type: true,
                            data: user1,
                            token: user1.token
                        });
                    });
                })
            }
        }
    });
});

api.get('/profile', ensureAuthorized, function(req, res) {
    User.findOne({token: req.headers['X-Requested-With']}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            res.json({
                type: true,
                data: user
            });
        }
    });
});


api.get('/logout', ensureAuthorized, function(req, res){
  req.headers['authorization'] = null;
  res.json({Message : 'Successfully logged out!'})
})



function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

process.on('uncaughtException', function(err) {
    console.log(err);
});


module.exports = api;
