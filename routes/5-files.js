
var util = require('util');
var core = require('../models/core');
var path = require('path');

module.exports = {
	"/browse/:bucket_id/* & /browse/:bucket_id": function(req, res) {
		function render(err, data){
			if (err || !data){
				
				err = err ? err : {status: 500 };
				err.message = err.message || 'Unknown error';
				data = {
					'error': err.status,
					'message': err.message
				};

				res.statusCode = err.status;
			}
			res.format({
				'text/html': function(){
					res.render('browse', {
						title: path.basename(data.path),
						'data': data
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
				message: 'Permission denied'
			});
			return;
		}
		core.requestFolder({
			'_bucket': bucket,
			path: req.params[0] || '',
			page: req.query.page,
			limit: req.query.limit,
			host: req.host,
			port: req.app.settings.port
		}, render);
	}
};