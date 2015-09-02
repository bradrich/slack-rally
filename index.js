'use strict';

// Require all necessities
var http = require('http');
var querystring = require('querystring');
var requestify = require('requestify');
var logme = require('logme');
var config = require('./config');
var slackNotify = require('slack-notify')(config.slack_host);

// Create the http server
http.createServer(function(req, res){
	var body = '';
	req.on('data', function(chunk){
		body += chunk;
	});
	req.on('end', function(){
		res.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
		res.end();

		body = querystring.parse(body);
		console.info(body);

		handlePayload(body);
	});
}).listen(config.port || 1337);

// Handle the payload request from Slack
function handlePayload(body){

	logme.info('Slack request received: ' + body.text);

	// Set notify object for slackNotify
	var notify = {
		username: config.username,
		icon_url: config.icon_url,
		channel: body.channel_id
	};

	// Validate that the request came from our friends at Slack
	if(config.slack_token && config.slack_token !== body.token){
		return logme.error('Token \'' + body.token + '\' didn\'t match the environment variable.');
	}

	// Get the command
	var cmd = body.text.split(' ')[0];
	logme.info('... slack command is: ' + cmd);

	// Service a help request
	if('help' === cmd){
		var output = 'Those crazy devs are always adding new tricks, but here\'s what I\'ve got right now... The format is always \'/' + config.slash_command + ' <command>\' where command is an artifact in Rally, such as US123, DE123 or TA123.';
		output += '\nIf you\'d like to dig deeper, type \'/' + config.slash_command + ' <command> help\' for each of the individual commands.';
		notify.text = output;
		slackNotify.send(notify);
	}
	// Service a slash command
	else{

		// Make sure that command is in proper format
		if(/(?:US|DE|TA|TC)\d+/ig.test(cmd)){

			// Set necessities
			var artifactType = cmd.substring(0, 2).toLowerCase();
			var artifactTypeFull = null;
			var requestURL = config.rally_url;
			var requestQuery = '(FormattedID = ' + cmd + ')';

			// What type of artifact are we dealing with?
			if('us' === artifactType){
				requestURL += 'hierarchicalrequirement/';
				artifactTypeFull = 'Story';
			}
			else if('de' === artifactType){
				requestURL += 'defect/';
				artifactTypeFull = 'Defect';
			}
			else if('ta' === artifactType){
				requestURL += 'task/';
				artifactTypeFull = 'Task';
			}
			else if('tc' === artifactType){
				requestURL += 'testcase/';
				artifactTypeFull = 'Test Case';
			}

			// Request information from Rally
			requestify.get(requestURL, {
				headers: { authorization: 'Basic YnJpY2hhcmRzb25AYWR2YW5jZWFtZXJpY2EubmV0OlU4dkxAQlVrYld4WTRURWd1dGlaR3lUcHc=' },
				params: { query: requestQuery }
			}).then(function(response){

				// Get the results of the request from the response body
				var result = JSON.parse(response.getBody()).QueryResult.Results[0];
				notify.attachments = [{
					fallback: artifactTypeFull + ' ' + cmd + ': <' + result._ref + '>',
					color: '#D00000',
					fields: [{
						title: artifactTypeFull + ' ' + cmd,
						value: result._refObjectName + '\n<' + result._ref + '>',
						short: false
					}]
				}];
				slackNotify.send(notify);

			}, function(error){
				logme.error(error.body);
				var output = '_/' + config.slash_command + ' ' + cmd + '_\nYour request resulted in an error. Please try again.';
				notify.text = output;
				slackNotify.send(notify);
			});

		}
		// Handle a command in the improper format
		else{
			logme.error('Illegal command: ' + cmd);
			var output = '_/' + config.slash_command + ' ' + cmd + '_\nThat command does not compute. Try asking me for help.';
			notify.text = output;
			slackNotify.send(notify);
		}

	}

}