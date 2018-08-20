const assert = require('assert'),
	express = require('express'),
	cors = require('cors'),
	expressDomainMiddleware = require('express-domain-middleware'),
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	passport = require('passport')

module.exports = function () {
	assert(!this.express, "field exists")
	assert(!this.passport, "field exists")
	assert(!this.server, "field exists")
	assert(!this.serverSSL, "field exists")

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
	this.express.use(this.config.get("project.basepath"), express.static(this.config.get("project.www")));

	if (this.config.get("project.ssl")) {
		const privateKey = fs.readFileSync(this.config.get("project.ssl.privkey"), 'utf8');
		const certificate = fs.readFileSync(this.config.get("project.ssl.cert"), 'utf8');
		const ca = fs.readFileSync(this.config.get("project.ssl.chain"), 'utf8');

		const credentials = {
			key: privateKey,
			cert: certificate,
			ca: ca
		};
		this.serverSSL = https.createServer(credentials, this.express);
	}

	this.server = http.createServer(this.express);

	this.on("ready", () => {
		this.express.use((error, req, res, next) => {
			if (error.name === 'UnauthorizedError') {
				res.status(error.status).send({ message: error.message });
				return;
			}
			next();
		});

		this.server.listen(this.config.get("project.express"), (err) => {
			if (err) {
				return console.error("server", err)
			}
			console.info("listening", this.config.get("project.express"));
		});

		if (this.serverSSL) {
			this.serverSSL.listen(this.config.get("project.expressSSL"), (err) => {
				if (err) {
					return console.error("server ssl", err)
				}
				console.info("listening", this.config.get("project.expressSSL"));
			});
		}
	});

	return Promise.resolve();
}
