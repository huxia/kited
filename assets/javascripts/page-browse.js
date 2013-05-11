var nextPageURL = null;
function appendData(data){
	var html = tmpl('files_template', { 'files': data.files });
	$("#files").append(html);
	$("#files").toggleClass("empty", !$("#files .file").length);
	if(!data.hasMore || !data.nextPage || !data.limit){
		$('#files_loadmore').css('visibility', 'hidden');
		nextPageURL = null;
	}else{
		$('#files_loadmore').css('visibility', 'visible');
		nextPageURL = 
			'/browse/' + encodeURIComponent(data.bucket) + '/' + encodeURI(data.path) + 
			'?page=' + encodeURIComponent(data.nextPage) + '&limit=' + encodeURIComponent(data.limit);
	}
}
function basename(n, noExt){
	var m = n.match(/[\/\\][^\\\/]*$/i);
	var r = m && m[0] || n;
	if (!noExt)
		return r;
	var e = extname(r);
	if(e.length > 0)
		r = r.substr(0, r.length - e.length - 1);
	r = r.replace(/([\[\(\.])/,"\u200B$1");
	return r;
}
function extname(n){
	var m = n.match(/\.([^\.]*)$/i);
	return m && m[1] || '';
}
function loadMore(){
	if(!nextPageURL){
		$('#files_loadmore').css('visibility', 'hidden');
		return;
	}

	$('#files_loadmore').attr('disabled', '');
	$.getJSON(nextPageURL, function(data){
		appendData(data);
		$('#files_loadmore').removeAttr('disabled');
	});
}