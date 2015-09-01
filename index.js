'use strict';

var http = require('http');
var querystring = require('querystring');
var requestify = require('requestify');
var config = require('./config');
var slack = require('slack-notify')(config.slack_host);

http.createServer(function (req, res) {
	var body = '';
	req.on('data', function(chunk) {
		body += chunk;
	});

	req.on('end', function() {
		res.writeHead(200, "OK", {'Content-Type': 'text/html'});
		res.end();

		body = querystring.parse(body);
		console.log(body);

		handlePayload(body);
	});
}).listen(config.port || 1337);

function handlePayload(body){
	if(config.slack_token && config.slack_token !== body.token){
		return console.error('Token `' + body.token + '` didn\'t match environment variable');
	}

	var text = body.text.split(' ');

	var artifact = text[0];

	// Get the artifact from Rally
	requestify.get('https://rally1.rallydev.com/slm/webservice/v2.0/defect?query=(FormattedID%20=%20' + artifact + ')').then(function(response){

		console.log(response.getBody());

		slack.send({
			username: config.username,
			icon_url: config.icon_url,
			channel: body.channel_id,
			text: '_' + body.command + ' ' + body.text + '_',
			attachments: [{
				title: 'result here'
			}]
		});

	});

	// slack.send({
	// 	username: config.username,
	// 	icon_url: config.icon_url,
	// 	channel: body.channel_id,
	// 	text: '_' + body.command + ' ' + body.text + '_',
	// 	attachments: [{
	// 		title: 'result here'
	// 	}]
	// });
}
