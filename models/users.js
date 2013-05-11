var fs = require('fs'), path = require('path');
var core = require('./core');
var users = null;
var allBuckets = null;
exports.create = function(json){
	json.isGuest = function(){
		return this['password'] === null;
	};
	json.listBuckets = function(cb){
		if (!allBuckets){
			var allBucketJSONs = fs.readdirSync(path.resolve(global.KATED_HOME + '/config/buckets'));
			allBuckets = [];
			for(var i in allBucketJSONs){
				if(/.+\.json$/.test(allBucketJSONs[i])){
					console.info(core);
					allBuckets.push(core.loadBucket(allBucketJSONs[i].match(/(.+)\.json/)[1]));
				}
			}
		}
		var result = [];
		for(var i in allBuckets){
			var bucket = allBuckets[i];
			for(var j in this['roles']){
				if(bucket['role'] == this['roles'][j]){
					result.push(bucket);
				}
			}
		}
		cb(result);
	};
	json.ownBucket = function(bucket){
		for(var j in this['roles']){
			if(bucket['role'] == this['roles'][j]){
				return true;
			}
		}
		return false;
	};
	return json;
}
exports.login = function(name, password, callback){
	if (!users){
		users = require(path.resolve(global.KATED_HOME + '/config/users.json'));
	}
	var user = null;
	for(var i in users){
		var u = users[i];
		if(u['name'].toLowerCase() === name.toLowerCase() && u['password'] === password){
			user = u;
			break;
		}
	}
	if(!user){
		callback(null);
		return ;
	}
	callback(exports.create(user));
}