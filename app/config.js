'use strict';

module.exports = {

	// Server parameters
	'port': '1337',

	// The slash comand shown in the help text, e.g., /rally
	'slashCommand': 'rally',

	// The Bot Persona
	'username': 'Rallybot',
	'iconUrl': 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2015-08-06/8770462645_91d5850fb01b590799dc_48.jpg',
	'iconEmoji': null,

	// The Slack host
	'slackHost': 'https://hooks.slack.com/services/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',
	'slackToken': 'AYSdw036OoTydHtpQOkG9Pm0',

	// Rally parameters
	'rallyURL': 'https://rally1.rallydev.com/',
	'rallyAPIEndpoint': 'slm/webservice/v2.0/',
	'rallyArtifactEndpoint': '#/',
	'rallyAuth': 'Basic YnJpY2hhcmRzb25AYWR2YW5jZWFtZXJpY2EubmV0OlU4dkxAQlVrYld4WTRURWd1dGlaR3lUcHc=',
	'rallySecondaryCommands': {
		'owner': {
			'active': false,
			'name': 'Owner',
			'hook': './commands/owner'
		},
		'parent': {
			'active': false,
			'name': 'Parent',
			'hook': './commands/parent'
		},
		'project': {
			'active': false,
			'name': 'Project',
			'hook': './commands/project'
		},
		'creationDate': {
			'active': false,
			'name': 'Creation Date',
			'hook': './commands/creationDate'
		},
		'lastUpdateDate': {
			'active': false,
			'name': 'Last Update Date',
			'hook': './commands/lastUpdateDate'
		},
		'dates': {
			'active': false,
			'name': 'Dates',
			'hook': './commands/dates'
		},
		'scheduleState': {
			'active': false,
			'name': 'Schedule State',
			'hook': './commands/scheduleState'
		},
		'blocked': {
			'active': false,
			'name': 'Blocked',
			'hook': './commands/blocked'
		},
		'ready': {
			'active': false,
			'name': 'Ready',
			'hook': './commands/ready'
		},
		'description': {
			'active': true,
			'name': 'Description',
			'hook': './commands/description'
		},
		'schedule': {
			'active': false,
			'name': 'Schedule',
			'hook': './commands/schedule'
		},
		'attachments': {
			'active': false,
			'name': 'Attachments',
			'hook': './commands/attachments'
		},
		'notes': {
			'active': false,
			'name': 'Notes',
			'hook': './commands/notes'
		},
		'tasks': {
			'active': false,
			'name': 'Tasks',
			'hook': './commands/tasks'
		},
		'children': {
			'active': false,
			'name': 'Children',
			'hook': './commands/children'
		},
		'defects': {
			'active': false,
			'name': 'Defects',
			'hook': './commands/defects'
		},
		'discussion': {
			'active': false,
			'name': 'Discussion',
			'hook': './commands/discussion'
		},
		'testCases': {
			'active': false,
			'name': 'Test Cases',
			'hook': './commands/testCases'
		}
	}

};