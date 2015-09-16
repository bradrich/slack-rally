'use strict';

// Require all necessities
var config = require('../../config'),
	logme = require('logme'),
	slack = require('../../slack');

// Run command request
module.exports.run = function(body, artifact, commands){

	logme.info('got here!');

	// Build notification
	var text = '<' + artifact.rallyURL + '|' + artifact.typeFormatted + ' ' + artifact.dataFull.FormattedID + '> - *' + artifact.dataFull._refObjectName + '*';
	var attachments = [{
		title: config.rallySecondaryCommands.description.name,
		color: '#D00000',
		text artifact.dataFull.Description,
		mrkdwn_in: ['text']
	}];
	slack.sendNotification(body, text, attachments);

};