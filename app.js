var argv = require('optimist').argv
	, deepExtend = require('deep-extend')
	, path = require('path')
	;
var settings = deepExtend({
	port: 8010,
	home: '.'
}, argv);

global.KATED_HOME = path.resolve(settings['home']);
console.info('Kited started at ' + KATED_HOME);
var express = require('express')
	, fs = require('fs')
	, engine = require('ejs-locals')
	, core = require('./models/core')
	, lingua = require('lingua')
	;

var app = module.exports = express();

// Configuration

app.configure(function(){
	app.engine('ejs', engine);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(lingua(app, {
		defaultLocale: 'en',
		path: __dirname + '/i18n'
	}));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'your secret here' }));
	app.use(core.expressShortcuts);
	app.use(app.router);
	app.use('/images', express.static(__dirname + '/assets/images'));
	app.use(express.static(__dirname + '/tmp/public'));
});


app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
	
	require('bundle-up')(app, __dirname + '/assets/bundle-up', {
		staticRoot: global.KATED_HOME + '/tmp/public/',
		staticUrlRoot:'/',
		bundle:false,
		minifyCss: false,
		minifyJs: false
	});
});

app.configure('production', function(){
	app.use(express.errorHandler()); 

	require('bundle-up')(app, __dirname + '/assets/bundle-up', {
		staticRoot: global.KATED_HOME + '/tmp/public/',
		staticUrlRoot:'/',
		bundle:true,
		minifyCss: true,
		minifyJs: true
	});
});

// Routes
console.log("Routes:");
var routesFolder = __dirname + '/routes';
fs.readdirSync(routesFolder).sort().forEach(function(name){
	var map = require(routesFolder + '/' + name);
	console.log(" %s", name);
	for(var path in map){
		console.log("   %s", path);
		path.split("&").forEach(function(p){
			app.all(p.trim(), map[path]);
		});
	}
});

app.locals.env = app.settings.env;

core.setupThumbnaild(app, function(){
	app.listen(app.settings.port = settings['port']);
	console.log("Express server listening on port %d in %s mode", settings['port'], app.settings.env);
});
