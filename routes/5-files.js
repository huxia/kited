
var util = require('util');
var core = require('../models/core');
var path = require('path');
var deepExtend = require('deep-extend')

module.exports = {
	'/': function(req, res){
		req.currentUser.listBuckets(function(buckets){
			var files = [];
			buckets.forEach(function(bucket){
				files.push({
					'name': bucket.id,
					'type': 'Folder',
					'path': '',
					'url': '/browse/' + bucket.id
				});
			});
			res.render('files', {
				'data': {
					'files': files,
					'page': null
				}
	 		});
		});
	},
	"/browse/:bucket_id/* & /browse/:bucket_id": function(req, res) {
		function render(err, data){
			if (err || !data){
				
				err = err ? err : {status: 500 };
				err.message = err.message || 'Unknown error';
				data = data || {};

				

				res.statusCode = err.status;
			}
			res.format({
				'text/html': function(){
					res.render('files', {
						title: path.basename(data.path).replace('/', ''),
						'data': data,
						'error': err && err.status || false,
						'message': err && err.message || false
					})
				},
				'application/json': function(){
					res.json(data);
				},
				'application/javascript': function(){
					res.jsonp(data);
				}
			});
		}
		var bucket = core.loadBucket(req.params.bucket_id);
		if(!req.currentUser.ownBucket(bucket)){
			render({
				status: 401,
				message: 'Permission denied',
			}, {
				'bucket': bucket.id,
				path: req.params[0] || '',
				page: req.query.page,
				limit: req.query.limit,
			});
			return;
		}
		core.requestFolder({
			'_bucket': bucket,
			path: req.params[0] || '',
			page: req.query.page,
			limit: req.query.limit,
			host: req.app.settings['external-host'] || req.host,
			port: req.app.settings['external-port'] || req.app.settings.port,
			request: req
		}, render);
	}
};