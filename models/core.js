
var   fs = require('fs')
	, path = require('path')
	;

global.THUMBNAILD_HOME = path.join(global.KATED_HOME, 'thumbnaild');
var storage = require('./storage')
	, crypto = require('crypto')
	, async = require('async')
	, util = require('util')
	, thumbnaild = require('thumbnaild')
	, path = require('path')
	, ncp = require("ncp").ncp
	, deepExtend = require('deep-extend')
	, uaParser = require('ua-parser')
	;
exports.expressShortcuts = function(req, res, next){
	// shortcuts
	res.locals.request = req;
	res.locals.response = res;
	res.locals.app = req.app;
	// ua
	var tablet = false;
	var phone = false;
	var p = uaParser.parse(req.headers['user-agent']);
	if(/android/i.test(p.os)){
		if(/mobile/.test(req.headers['user-agent'])){
			phone = true;
			tablet = false;
		}else{
			phone = false;
			tablet = true;
		}
	}else if(/ios/i.test(p.os)){
		if(/ipad/.test(p.device) || /tv/.test(p.device)){
			tablet = true;
			phone = false;
		}else{
			tablet = false;
			phone = true;
		}
	}
	res.locals.ua = req.ua = p.ua;
	res.locals.os = req.os = p.os;
	res.locals.device = req.device = p.device;
	res.locals.is = req.is = {
		"phone": phone,
		"tablet": tablet
	};
	
	next();
};
function mkdirSync(dir){
	if (!fs.existsSync(dir))
		fs.mkdirSync(dir);
}
exports.setupThumbnaild = function (app, callback){
	var bucketDir = path.join(path.join(global.KATED_HOME, 'config'), 'buckets');
	var jsonFiles = fs.readdirSync(bucketDir);
	mkdirSync(global.THUMBNAILD_HOME);
	mkdirSync(path.join(global.THUMBNAILD_HOME, 'config'));
	var thumbnaildBucketDir = path.join(path.join(global.THUMBNAILD_HOME, 'config'), 'buckets');
	mkdirSync(thumbnaildBucketDir);
	mkdirSync(path.join(global.THUMBNAILD_HOME, 'tmp'));

	for(var i in jsonFiles){
		if(/\.json$/.test(jsonFiles[i])){
			var json = JSON.parse(fs.readFileSync(path.join(bucketDir, jsonFiles[i])));
			if (json['thumbnaild'] && !json['thumbnaild']['external']){
				fs.writeFileSync(path.join(thumbnaildBucketDir, jsonFiles[i]), JSON.stringify({
					'cache_remotely': json['thumbnaild']['cache_remotely'],
					'cache_locally': json['thumbnaild']['cache_locally'],
					'shared_secret': json['thumbnaild']['shared_secret']
				}));
			}
		}
	}
	app.get('/thumbnaild/:schema/:bucket/*', thumbnaild.getThumbnail);

	ncp(path.join(path.join(global.KATED_HOME, 'config'), 'default-thumbnaild-schemas'),
		path.join(path.join(global.THUMBNAILD_HOME, 'config'), 'schemas'), function(){
			callback();
		})
};
function loadBucket(bucket){
	var p = path.resolve(global.KATED_HOME + '/config/buckets/' + bucket + '.json');
	if (!fs.existsSync(p)){
		return null;
	}
	var result = require(p);
	result.id = bucket;
	return result;
}
exports.loadBucket = loadBucket;
function getUrlSync(bucket, path, schema, host, port){
	var config = bucket['thumbnaild'];

	var thumbnaildBucket;

	var url;

	if (config['external']){
		var urlSchemaMappings = config['external']['schemas'];
		var urlSchema = urlSchemaMappings[schema] || schema;

		thumbnaildBucket = config['external']['bucket'];
		if (thumbnaildBucket == '__dynamic') {
			thumbnaildBucket = thumbnaild.encodeBucket(thumbnaildBucket, {
				"storage": bucket['storage'],
				"storage_config": bucket['storage_config']
			}, config['shared_secret']);
		}

		var h = config['external']['host'];
		if (!h || h == 'localhost'){
			h = host;
		}
		url = 'http://' + h + ':' + config['external']['port'] + '/' + encodeURIComponent(urlSchema) + '/' + encodeURIComponent(thumbnaildBucket) + '/' + encodeURI(path);
	}else{
		thumbnaildBucket = thumbnaild.encodeBucket(bucket['id'], {
			"storage": bucket['storage'],
			"storage_config": bucket['storage_config']
		}, config['shared_secret']);
		url = 'http://' + host + ':' + port + '/thumbnaild/' + encodeURIComponent(schema) + '/' + encodeURIComponent(thumbnaildBucket) + '/' + encodeURI(path);
	}

	if (config['shared_secret'] && config['shared_secret'].length){
		url += '?' + thumbnaild.SIGNING_PARAM_NAME + '=' + encodeURIComponent(thumbnaild.getRequestSigningSync(url, config['shared_secret']));
	}
	return url;
}

exports.requestFolder = function(objectInfo, callback){

	var bucket = objectInfo._bucket ? objectInfo._bucket : loadBucket(objectInfo.bucket);
	var cb = function(err, data){
		if(!data && !err){
			err = 'unknown error';
		}
		if(!data){
			data = {};
		}
		data = deepExtend(data, {
			bucket: bucket && bucket.id || null,
			path: objectInfo.path,
			page: objectInfo.page,
			limit: objectInfo.limit,
		});
		if(data.files) {
			for(var i in data.files){
				var file = data.files[i];
				var extName = file.name.match(/\..+$/) ? file.name.replace(/.*\./, '').toLowerCase() : 'unknown';
				

				// add thumbnail
				if (file.type == 'File'){
					if (extName.match(/(jpg|jpeg|bmp|png|tif|tiff)/i)){
						file['url_thumbnail'] = getUrlSync(bucket, file.path, 'thumbnail', objectInfo.host, objectInfo.port);
						file['url_full'] = getUrlSync(bucket, file.path, 'full', objectInfo.host, objectInfo.port);
					}
					file['url'] = getUrlSync(bucket, file.path, 'raw', objectInfo.host, objectInfo.port);
				}else{
					file['url'] = "/browse/" + bucket.id + "/" + file.path;
				}
			}
		}
		callback(err, data);
	};
	if (!bucket){
		cb({status: 500, message: 'Bucket not found: ' + objectInfo.bucket}, null);
		return;
	}
	if(!objectInfo.limit){
		if (objectInfo.request.is.phone) {
			objectInfo.limit = 21;
		}else {
			objectInfo.limit = 50;
		}
	}
	if(objectInfo.limit > 50)
		objectInfo.limit = 50;
	

	var s = storage(bucket);
	s.list(objectInfo.path, objectInfo.page, objectInfo.limit || 50, function(err, data){
		if(err || !data){
			cb({status: 404, message: err || 'unknown listing error'}, null);
			return;
		}
		cb(null, data);
	});
}