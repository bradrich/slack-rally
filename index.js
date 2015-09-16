'use strict';

// Require all necessities
var config = require('./app/config'),
	server = require('./app/server');

// Listen to server on specified configuration port
server.listen(config.port || 1337);