
const BaseController = require('./BaseController');
const ItemCollection = require("../models/collection.model");

module.exports = BaseController.extend({
    name: 'CollectionController',

    get: async function(req, res, next) {
      let query = {$or: [{owner: req.query.owner} , {isPublic: true}]}
        ItemCollection.find(query, async (err, collections) => {
            if (err) return res.status(500).send({message: err.message});
            if (!collections) return res.status(404).send({message: "No collections found"})

            res.status(200).send({collections: collections})
        })
    },

    isExist: async function(req, res, next) {
        ItemCollection.find({name: req.query.name}, async (err, collections) => {
            if (err) return res.status(500).send({message: err.message});
            if (!collections || collections.length == 0) return res.status(404).send({message: "No collections found"})

            res.status(200).send({collections: collections})
        })
    },

    detail: async function(req, res, next) {
      ItemCollection.findOne({name: req.params.name}, async (err, collection) => {
          if (err) return res.status(500).send({message: err.message});
          if (!collection) return res.status(404).send({message: "No collections found"})

          res.status(200).send({collection: collection})
      })
    },
});
