function appendData(data){
	var html = tmpl('files_template', { 'files': data.files });
	$("#files").append(html);
	$("#files").toggleClass("empty", !$("#files .file").length);
}
function basename(n, noExt){
	var m = n.match(/[\/\\][^\\\/]*$/i);
	var r = m && m[0] || n;
	if (!noExt)
		return r;
	var e = extname(r);
	return r.substr(0, r.length - e.length);
}
function extname(n){
	var m = n.match(/\.[^\.]*$/i);
	return m && m[0] || '';
}