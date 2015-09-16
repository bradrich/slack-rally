'use strict';

// Require all necessities
var http = require('http'),
	querystring = require('querystring'),
	requestify = require('requestify'),
	logme = require('logme'),
	config = require('./config'),
	slackNotify = require('slack-notify')(config.slackHost),
	moment = require('moment');

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
		icon_url: config.iconUrl,
		channel: body.channel_id
	};

	// Validate that the request came from our friends at Slack
	if(config.slackToken && config.slackToken !== body.token){
		return logme.error('Token \'' + body.token + '\' didn\'t match the environment variable.');
	}

	// Get the input and set the cmd
	var input = body.text.split(' ');
	var cmd = input[0];
	var hasSecondaryCMD = (input[1]) ? true : false;
	logme.info('... slack command is: ' + cmd);

	// Service a help request
	if('help' === cmd){
		notify.text = '_/' + config.slashCommand + ' ' + cmd + '_\nThose crazy devs are always adding new tricks, but here\'s what I\'ve got right now...\nThe format is always */' + config.slashCommand + ' <command>* where command is an artifact in Rally, such as *US123*, *DE123* or *TA123*. \nIf you\'d like to dig deeper, type */' + config.slashCommand + ' <command> help* for each of the individual commands.';
		slackNotify.send(notify);
	}
	// Service a slash command
	else{

		// Make sure that command is in proper format
		if(/(?:US|DE|TA|TC)\d+/ig.test(cmd)){

			// Set necessities
			var requestURL = config.rallyURL + config.rallyAPIEndpoint,
				requestQuery = '(FormattedID = ' + cmd + ')',
				artifact = {
					typeAbbr: cmd.substring(0, 2).toLowerCase(),
					type: null,
					typeFormatted: null,
					typeSquished: null,
					projectID: null,
					rallyURL: null,
					creationDate: null,
					lastUpdateDate: null
				};

			// What type of artifact are we dealing with?
			if('us' === artifact.typeAbbr){
				requestURL += 'hierarchicalrequirement/';
				artifact.typeFormatted = 'User Story';
				artifact.typeSquished = 'userstory';
			}
			else if('de' === artifact.typeAbbr){
				requestURL += 'defect/';
				artifact.typeFormatted = 'Defect';
				artifact.typeSquished = 'defect';
			}
			else if('ta' === artifact.typeAbbr){
				requestURL += 'task/';
				artifact.typeFormatted = 'Task';
				artifact.typeSquished = 'task';
			}
			else if('tc' === artifact.typeAbbr){
				requestURL += 'testcase/';
				artifact.typeFormatted = 'Test Case';
				artifact.typeSquished = 'testcase';
			}

			// Request information from Rally
			requestify.get(requestURL, {
				headers: { authorization: config.rallyAuth },
				params: { query: requestQuery }
			}).then(function(response){

				logme.info('Successfully requested the partial result.');

				// Get the PARTIAL result of the request from the response body
				var resultPart = JSON.parse(response.getBody()).QueryResult.Results[0];

				// Does the resultPart actually exist?
				if(resultPart){

					// Set type from result
					artifact.type = resultPart._type;

					// Request the FULL result
					requestify.get(resultPart._ref, {
						headers: { authorization: config.rallyAuth }
					}).then(function(response){

						logme.info('Successfully requested the full result.');

						// Get the FULL result of the request from the response body
						var resultFull = JSON.parse(response.getBody())[artifact.type];

						// Get the projectID from the project URL
						var projectURL = config.rallyURL + config.rallyAPIEndpoint + 'project/';
						artifact.projectID = resultFull.Project._ref.replace(projectURL, '');

						// Set the artifact URL
						artifact.rallyURL = config.rallyURL + config.rallyArtifactEndpoint + artifact.projectID + 'd/detail/' + artifact.typeSquished + '/' + resultFull.ObjectID;

						// Set the necessary dates
						// artifact.creationDate = moment(resultFull.CreationDate).format('dddd, MMMM Do YYYY, h:mm:ss a');
						// artifact.lastUpdateDate = moment(resultFull.LastUpdateDate).format('dddd, MMMM Do YYYY, h:mm:ss a');

						// Build Slack notify
						// notify.text = '<' + artifact.rallyURL + '|' + artifact.typeFormatted + ' ' + resultFull.FormattedID + '> - *' + resultFull._refObjectName + '*';
						// notify.attachments = [{
						// 	fallback: artifact.typeFormatted + ' ' + resultFull.FormattedID + ': <' + artifact.rallyURL + '>',
						// 	pretext: '<' + artifact.rallyURL + '|' + artifact.typeFormatted + ' ' + resultFull.FormattedID + '>',
						// 	color: '#D00000',
						// 	fields: [{
						// 		title: resultFull._refObjectName,
						// 		value: '*Owner:* ' + resultFull.Owner._refObjectName + '\n*Creation Date:* ' + artifact.creationDate + '\n*Last Update Date:* ' + artifact.lastUpdateDate + '\n*Blocked:* ' + resultFull.Blocked + '\n*Schedule:* Release - ' + resultFull.Release._refObjectName + ', Iteration - ' + resultFull.Iteration._refObjectName,
						// 		short: false
						// 	}]
						// }];
						// slackNotify.send(notify);

						// Is there a secondary command?

					}, function(error){
						logme.error(error.body);
						notify.text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request resulted in an error. Please try again.';
						slackNotify.send(notify);
					});

				}
				// Request does not exist
				else{
					logme.error(cmd + ' does not exist.');
					notify.text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request did not produce any results. Please check your request format and try again.';
					slackNotify.send(notify);
				}

			}, function(error){
				logme.error(error.body);
				notify.text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request resulted in an error. Please try again.';
				slackNotify.send(notify);
			});

		}
		// Handle a command in the improper format
		else{
			logme.error('Illegal command: ' + cmd);
			notify.text = '_/' + config.slashCommand + ' ' + cmd + '_\nThat command does not compute. Try asking me for help.';
			slackNotify.send(notify);
		}

	}

}