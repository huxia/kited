var util = require('util');
function fileFromPrefix(prefix, path){
	return {
		name: prefix.Prefix.substr(path.length).replace(/^\/*/, '').replace(/\/*$/, ''),
		type: 'Folder',
		path: prefix.Prefix
	};
}
function fileFromObject(object, path){
	return {
		name: object.Key.substr(path.length).replace(/^\/*/, ''),
		lastModified: object.LastModified,
		type: 'File',
		path: object.Key
	};
}

module.exports = function(bucketInfo){
	var aws = require('aws-sdk');
	aws.config.update({
		"region": 'us-east-1'
	});
	aws.config.update(bucketInfo['storage_config']);
	var s3 = new aws.S3();
	this.read = function(path, callback){
		s3.client.getObject({
			Bucket: bucketInfo['storage_config']['bucket'],
			Key: path
		}).on('complete', function(response){
			var error = null;
			if (!response || response.error || !response.data){
				error = response.error && response.error.message || 'unknwon s3 error';
			}
			console.info('s3 read done. error: ' + error);
			if (callback) {
				callback(error, response && response.data && response.data.Body);
			}
		}).send();
	};
	this.write = function(path, data, callback){
		s3.client.putObject({
			Bucket: bucketInfo['storage_config']['bucket'],
			Key: path,
			Body: data
		}).on('complete', function(response){

			var error = null;
			if (!response || response.error || !response.data){
				error = response.error && response.error.message || 'unknwon s3 error';
			}
			console.log('s3 write done: error: ' + error);
			if (callback) {
				callback(error);
			}
		}).send();
	};
	this.list = function(path, page, pageSize, callback){

		s3.client.listObjects({
		 	Bucket: bucketInfo['storage_config']['bucket'],
		 	Delimiter: '/',
		 	Marker: page || '',
		 	MaxKeys: parseInt(pageSize) + 2,
		 	Prefix: path
		}).on('complete', function(response){

			var error = null;
			if (!response || response.error || !response.data){
				error = response.error && response.error.message || 'unknwon s3 error';
			}
			console.info(response);
			console.log('s3 list done: error: ' + error);
			var files = [];
			if(response && response.data && response.data.CommonPrefixes){
				response.data.CommonPrefixes.forEach(function(prefix){
					var file = fileFromPrefix(prefix, path);
					if(file && file.name && file.name.length)
						files.push(file);
				});
			}
			if(response && response.data && response.data.Contents){
				response.data.Contents.forEach(function(object){
					var file = fileFromObject(object, path);
					if(file && file.name && file.name.length)
						files.push(file);
				});
			}
			var data = {
				'path':  path || '',
				'files': files && files.slice(0, pageSize),
				'bucket': bucketInfo.id,
				'nextPage': files.length > pageSize ? files[pageSize-1].path : null,
				'previousPage': null,
				'limit': pageSize,
				'page': page,
				'hasMore': files.length > pageSize,
				'debug': util.inspect(response)
			};
			callback(error, data);
		}).send();
	};
	return this;
}