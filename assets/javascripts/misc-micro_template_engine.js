// http://ejohn.org/blog/javascript-micro-templating/
// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
(function(){
  var cache = {};
  this.htmlEscape = function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  };
  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn;
    if (!/\W/.test(str) ){
      fn = cache[str] = cache[str] || tmpl(document.getElementById(str).innerHTML);
    }else{
      var fnStr = "var p=[],print=function(){p.push.apply(p,arguments);};" +
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .trim()
          .split("<#").join("\t")
          .replace(/((^|#>)[^\t]*)'/g, "$1\r")
          .replace(/\t=h(.*?)[\s;]*#>/g, "',htmlEscape($1),'")
          .replace(/\t=u(.*?)[\s;]*#>/g, "',encodeURIComponent($1),'")
          .replace(/\t=j(.*?)[\s;]*#>/g, "',JSON.stringify($1),'")
          .replace(/\t=(.*?)[\s;]*#>/g, "',$1,'")
          .split("\t").join("');")
          .split("#>").join("p.push('")
          .split("\r").join("\\'")
        + "');}return p.join('');"
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      fn = new Function("obj", fnStr);
    }
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();