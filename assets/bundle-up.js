module.exports = function(assets) {
  assets.root = __dirname;
  assets.addJs('/javascripts/*.js');
  assets.addJs('/javascripts/jquery/jquery-1.9.1-dev.js', 'development');
  assets.addJs('/javascripts/jquery/jquery-1.9.1.js', 'production');
  assets.addCss('/stylesheets/*.styl');
};