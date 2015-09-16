'use strict';

// Require all necessities
var http = require('http'),
	querystring = require('querystring'),
	slack = require('./slack');

// Create the http server
module.exports = http.createServer(function(req, res){
	var body = '';
	req.on('data', function(chunk){
		body += chunk;
	});
	req.on('end', function(){
		res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
		res.end();

		body = querystring.parse(body);
		console.info(body);

		slack.handlePayload(body);
	});
});