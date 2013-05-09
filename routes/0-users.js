
var util = require('util');
var core = require('../models/core');
var users = require('../models/users');
var path = require('path');


module.exports = {
	'*': function(req, res, next){
		if (!req.currentUser && req.session){
			if(req.session['user'])
				req.currentUser = users.create(req.session['user']);
			else{
				users.login("__guest", null, function(user){
					if(user){
						req.currentUser = req.session['user'] = user;
					}
					next();
				});
				return;
			}
		}
		next();
	},
	'/logout': function(req, res){
		req.session = req.currentUser = null;
 		res.render('logout', {
			'message': res.lingua.content.user.signed_out
 		});
	},
	'/login': function(req, res){
 		if(req.body && req.body.name){
 			users.login(req.body.name, req.body.password, function(user){
 				if(!user){
 					res.render('login', {
 						'error': res.lingua.content.user.username_password_mismatch
			 		});
 				}else{
 					req.session['user'] = req.currentUser = user;
 					res.redirect('/');
 				}
 			});
 		}else{
	 		res.render('login', {

	 		})
 		}
 		
	},
	'/': function(req, res){
		req.currentUser.listBuckets(function(buckets){
			res.render('index', {
				'buckets': buckets
	 		});
		});
	}
}