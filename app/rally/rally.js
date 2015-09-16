'use strict';

// Require all necessities
var config = require('../config'),
	logme = require('logme'),
	slack = require('../slack'),
	requestify = require('requestify'),
	_ = require('underscore');

// Function to run passed in command
function run(body, cmd, commands){

	// Set necessities
	var requestURL = config.rallyURL + config.rallyAPIEndpoint,
		requestQuery = '(FormattedID = ' + cmd + ')',
		artifact = {
			typeAbbr: cmd.substring(0, 2).toLowerCase(),
			type: null,
			typeFormatted: null,
			typeSquished: null,
			dataPart: null,
			dataFull: null,
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
		artifact.dataPart = JSON.parse(response.getBody()).QueryResult.Results[0];

		// Does the artifact.dataPart actually exist?
		if(artifact.dataPart){

			// Set type from result
			artifact.type = artifact.dataPart._type;

			// Request the FULL result
			requestify.get(artifact.dataPart._ref, {
				headers: { authorization: config.rallyAuth }
			}).then(function(response){

				logme.info('Successfully requested the full result.');

				// Get the FULL result of the request from the response body
				artifact.dataFull = JSON.parse(response.getBody())[artifact.type];

				// Get the projectID from the project URL
				var projectURL = config.rallyURL + config.rallyAPIEndpoint + 'project/';
				artifact.projectID = artifact.dataFull.Project._ref.replace(projectURL, '');

				// Set the artifact URL
				artifact.rallyURL = config.rallyURL + config.rallyArtifactEndpoint + artifact.projectID + 'd/detail/' + artifact.typeSquished + '/' + artifact.dataFull.ObjectID;

				// Service help secondary command
				if(commands[1] && 'help' === commands[1]){

					// Get active secondary commands
					var sCommands = '';
					_.keys(config.rallySecondaryCommands).forEach(function(command){
						if(config.rallySecondaryCommands[command].active){
							if('' === sCommands){ sCommands += '*' + command + '*'; }
							else{ sCommands += ', *' + command + '*'; }
						}
					});

					// Build slack notification
					var text = '_/' + config.slashCommand + ' ' + cmd + ' ' + commands[1] + '_\nThe format is always */' + config.slashCommand + ' <command> <secondary-command>* where command is an artifact in Rally, such as *US123*, *DE123* or *TA123*, and where secondary-command is a specific data request.\nYou are then allowed to issue a secondary command from the following:  ' + sCommands;
					slack.sendNotification(body, text);

				}
				// Is there a secondary command that is configured to be serviced?
				else if(commands[1] && config.rallySecondaryCommands[commands[1]]){

					logme.info('Servicing secondary command: ' + commands[1] + '.');

					// Check that command is active
					if(config.rallySecondaryCommands[commands[1]].active){
						logme.info('Secondary command requested is active.');
						var handle = require(config.rallySecondaryCommands[commands[1]].hook);
						logme.info('Got here!');
						if(typeof(handle.run) === 'function'){
							handle.run(body, artifact, commands);
						}
						else{
							logme.error(config.rallySecondaryCommands[commands[1]].name + ' command failed to register - missing run function.');
							var text = '_/' + config.slashCommand + ' ' + cmd + ' ' + commands[1] + '_\nYour request failed to register. Please remove the secondary command and try again.';
							slack.sendNotification(body, text);
						}
					}
					else{
						logme.error(config.rallySecondaryCommands[commands[1]].name + ' command is configured to be inactive. Update the command specifications to change this.');
						var text = '_/' + config.slashCommand + ' ' + cmd + ' ' + commands[1] + '_\nThis request is not currently active. Please remove the secondary command and try again.';
						slack.sendNotification(body, text);
					}

				}
				// Simple, one-level command
				else{
					var text = '<' + artifact.rallyURL + '|' + artifact.typeFormatted + ' ' + artifact.dataFull.FormattedID + '> - *' + artifact.dataFull._refObjectName + '*';
					slack.sendNotification(body, text);
				}

			}, function(error){
				logme.error(error.body);
				var text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request resulted in an error. Please try again.';
				slack.sendNotification(body, text);
			});

		}
		// Request does not exist
		else{
			logme.error(cmd + ' does not exist.');
			var text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request did not produce any results. Please check your request format and try again.';
			slack.sendNotification(body, text);
		}

	}, function(error){
		logme.error(error.body);
		var text = '_/' + config.slashCommand + ' ' + cmd + '_\nYour request resulted in an error. Please try again.';
		slack.sendNotification(body, text);
	});

}

// Handle commands
module.exports.handleCommands = function(body, commands){

	// Set cmd
	var cmd = commands[0];
	logme.info('... Slack command is: ' + cmd);

	// Service a help request
	if('help' === cmd){
		var text = '_/' + config.slashCommand + ' ' + cmd + '_\nThose crazy devs are always adding new tricks, but here\'s what I\'ve got right now...\nThe format is always */' + config.slashCommand + ' <command>* where command is an artifact in Rally, such as *US123*, *DE123* or *TA123*. \nIf you\'d like to dig deeper, type */' + config.slashCommand + ' <command> help* for each of the individual commands.';
		slack.sendNotification(body, text);
	}
	// Service a properly formatted slash command
	else if(/(?:US|DE|TA|TC)\d+/ig.test(cmd)){
		run(body, cmd, commands);
	}
	// Service a command with an unsupported format
	else{
		logme.error('Illegal command: ' + cmd);
		var text = '_/' + config.slashCommand + ' ' + cmd + '_\nThat command does not compute. Try asking me for help.';
		slack.sendNotification(body, text);
	}

};