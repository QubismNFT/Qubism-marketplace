const _ = require("underscore");
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');


module.exports = {
	name: "BaseController",

	extend: function(child) {
		return _.extend({}, this, child);
	},

	authenticateToken: function(req, res, next) {
		// Gather the jwt access token from the request header
		const authHeader = req.headers['authorization']
		const token = authHeader && authHeader.split(' ')[1]
		if (token == null) return res.sendStatus(401) // if there isn't any token
	  
		jwt.verify(token, '!@#456QWErty', (err, payload) => {
			if(err) {
				return res.sendStatus(403)
			}

			let address = payload.data;

			UserModel.findOne({address: address})
				.then(user => {
					if(!user) return res.sendStatus(404);

					req.user = user
					next()
				});

		})
	},
}