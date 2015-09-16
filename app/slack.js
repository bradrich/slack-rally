'use strict';

// Require all necessities
var config = require('./config'),
	logme = require('logme'),
	slackNotify = require('slack-notify')(config.slackHost),
	rally = require('./rally/rally');

// Handle payload
module.exports.handlePayload = function(body){

	logme.info('Slack request received: ' + body.text);

	// Validate that the request came from our friends at Slack
	if(config.slackToken && config.slackToken !== body.token){
		return logme.error('Token \'' + body.token + '\' didn\'t match the environment variable.');
	}

	// Get the commands
	var commands = body.text.split(' ');

	// Handle rally commands
	rally.handleCommands(body, commands);

};

// Send Slack notification
module.exports.sendNotification = function(body, text, attachments){

	logme.info('Sending Slack notification...');

	// Set notify object for slackNotify
	var notify = {
		username: config.username,
		icon_url: config.iconUrl,
		channel: body.channel_id,
		text: text,
		attachments: attachments
	};

	// Send
	slackNotify.send(notify);

};