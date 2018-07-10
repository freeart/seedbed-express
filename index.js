const assert = require('assert'),
	express = require('express'),
	cors = require('cors'),
	expressDomainMiddleware = require('express-domain-middleware'),
	http = require('http'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport')

module.exports = function () {
	assert(!this.express, "field exists")
	assert(!this.passport, "field exists")
	assert(!this.server, "field exists")

	this.express = express();
	this.passport = passport;
	this.express.use(cors());
	this.express.use(expressDomainMiddleware);
	this.express.use(bodyParser.urlencoded({ extended: true, parameterLimit: 5000 }));
	this.express.use(bodyParser.json({ limit: '1mb' }));
	this.express.use(methodOverride());
	this.express.engine('html', require('ejs').renderFile);

	this.express.set('view engine', 'ejs');
	this.express.set('views', this.config.get("project.www"));

	this.server = http.createServer(this.express);

	this.on("ready", () => {
		this.express.use((error, req, res, next) => {
			if (error.name === 'UnauthorizedError') {
				res.status(error.status).send({ message: error.message });
				return;
			}
			next();
		});

		this.express.use(this.config.get("project.basepath"), express.static(this.config.get("project.www")));

		this.server.listen(this.config.get("project.express"), (err) => {
			if (err) {
				return console.error("server", err)
			}
			console.info("listening", this.config.get("project.express"));
		});
	});

	return Promise.resolve();
}
