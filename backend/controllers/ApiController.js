const mongoose = require("mongoose");
const BaseController = require("./BaseController");
const User = require("../models/user.model");
const Item = require("../models/item.model");
const Pair = require("../models/pair.model");
const Collection = require("../models/collection.model");
const Auction = require("../models/auction.model");
const Bid = require("../models/bid.model");
const Event = require("../models/event.model");
const Category = require("../models/category.model");
const Sold = require("../models/sold.model");
const ItemCollection = require('../models/collection.model');
const Message = require("../models/message.model");

const marketAddr = '0xa05002fe1452b04cfca23775b63c909a8cb1310f';
const auctionAddr = '0x00552135b815761cde9f5b1b995a69b26cf8a3f3';
    
module.exports = BaseController.extend({
  name: "ApiController",

  get: async function (req, res, next) {   
    const that = this; 
    let limitNum = req.query.limit ? parseInt(req.query.limit) : 8;
    let data = this.handleGetRequest(req, limitNum);
    Item.find(data.query, { __v: 0, _id: 0 })
      .sort(data.sort)
      .limit(limitNum)
      .skip(data.skip)
      .lean()
      .exec(async function (err, items) {
        if (err) return res.status(500).send({ message: err.message });
        if (!items) return res.status(404).send({ message: "No items found" });
        
        let ret = [];
        for (let i = 0; i < items.length; i++) {
          let item = items[i];
          const itemNode = await that.getItemDetail(item.tokenId, item.itemCollection)
          ret.push(itemNode)
        }

        Item.countDocuments(data.query, function (err2, count) {
          if (err2) return res.status(500).send({ message: err2.message });
          res.status(200).send({ items: ret, count: count });
        });
      });
  }, 
  getTopSellers: async function (req, res, next) {
    let ret = []    
    let limitNum = req.query.limit ? parseInt(req.query.limit) : 12;
    const currentTimeStamp = Math.floor(Date.now() / 1000);
    const startTimeStamp = currentTimeStamp - 2592000 // 1 month timestamp
    const soldQuery = [
      {'$match': { 'timestamp': {$gt: startTimeStamp} }}
      , {'$group': { '_id': '$seller',
           'totalSold': { $sum: '$amount' }}}
      , {'$sort': { 'totalSold': -1 }}
      , { '$limit': limitNum }      
    ];
    const topUsers = await Sold.aggregate(soldQuery);
    if (topUsers && topUsers?.length > 0) {
      for (let index = 0; index < topUsers.length; index++) {
        let topUserData = topUsers[index];

        var user = await User.findOne({address: topUserData._id},{_id: 0, __v: 0}).lean();        
        if (!user) {          
          const newUser = new User({
            address: topUserData._id,
            name: "NoName",
            role: "NoRole",
            profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
            coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
            isApproved: false,
            nonce: Math.floor(Math.random() * 1000000)
          })
          await newUser.save();
          topUserData.userInfo = newUser;
        } else {
          topUserData.userInfo = user;
        }
        ret.push(topUserData)  
      }
    }

    if (ret && ret?.length > 0) {
      res.status(200).send({ users: ret, count: ret?.length });
    } else {
      return res.status(404).send({ message: "No Top Users found" });
    }
  },

  getTopCollections: async function (req, res, next) {
    let ret = [];
    let limitNum = req.query.limit ? parseInt(req.query.limit) : 4;    
    const itemQuery = [
      {'$group': { '_id': '$itemCollection',
           'totalItems': { $sum: 1 }}}
      , {'$sort': { 'totalItems': -1 }}
      , { '$limit': limitNum }      
    ];
    const collectionIds = await Item.aggregate(itemQuery);
    if (collectionIds && collectionIds?.length > 0) {
      for (let index = 0; index < collectionIds.length; index++) {
        const collectionAddress = collectionIds[index]._id
        let collection = await ItemCollection.findOne({ address: collectionAddress },{_id: 0, __v: 0}).lean(); 
        var owner = await User.findOne({address: collection.owner},{_id: 0, __v: 0}).lean();        
        if (!owner) {          
          const newUser = new User({
            address: collection.owner.toLowerCase(),
            name: "NoName",
            role: "NoRole",
            profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
            coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
            isApproved: false,
            nonce: Math.floor(Math.random() * 1000000)
          })
          await newUser.save();         
          collection.ownerUser = newUser;
        } else {
          collection.ownerUser = owner;
        }
        ret.push(collection)          
      }      
    }
    if (ret && ret?.length > 0) {
      res.status(200).send({ collections: ret, count: ret?.length });
    } else {
      return res.status(404).send({ message: "No Hot Collections found" });
    }  
  },

  getActivities: async function(req, res, next) {
    const that = this;
    let limitNum = req.query.limit ? parseInt(req.query.limit) : 10;
    let data = this.handleEventGetRequest(req, limitNum);
    Event.find(data.query, { __v: 0, _id: 0 })
      .sort({ timestamp: -1 })
      .limit(limitNum)
      .skip(data.skip)
      .lean()
      .exec(async function (err, events) {
        if (err) return res.status(500).send({ message: err.message });
        if (!events) return res.status(404).send({ message: "No events found" });
        let ret = [];

        for (let i = 0; i < events.length; i++) {
          let event = events[i];
          if (event.from) {
            var user = await User.findOne({address: event.from},{_id: 0, __v: 0}).lean();        
            if (!user) {          
              var newUser = new User({
                address: event.from.toLowerCase(),
                name: "NoName",
                role: "NoRole",
                profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                isApproved: false,
                nonce: Math.floor(Math.random() * 1000000)
              })
              await newUser.save();         
              event.fromUser = newUser;
            } else {
              event.fromUser = user;
            }   
          }  
          if (event.to) {
            var user = await User.findOne({address: event.to},{_id: 0, __v: 0}).lean();        
            if (!user) {          
              var newUser = new User({
                address: event.to.toLowerCase(),
                name: "NoName",
                role: "NoRole",
                profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                isApproved: false,
                nonce: Math.floor(Math.random() * 1000000)
              })
              await newUser.save();         
              event.toUser = newUser;
            } else {
              event.toUser = user;
            }   
          }
          var item = await Item.findOne({tokenId: event.tokenId, itemCollection: event.itemCollection},{_id: 0, __v: 0}).lean();  
          event.itemInfo = item;                   
        }

        Event.countDocuments(data.query, function (err2, count) {
          if (err2) return res.status(500).send({ message: err2.message });
          res.status(200).send({ events: events, count: count });
        });
      });    
  },

  detail: async function (req, res) {
    Item.findOne(
      { tokenId: req.params.tokenId, itemCollection: req.params.collection },
      { __v: 0, _id: 0 }
    )
      .lean()
      .exec(async function (err, item) {
        if (err) return res.status(500).send({ message: err.message });
        if (!item) return res.status(404).send({ message: "No item found" });
        
        // set pair data
        let pair = await Pair.findOne({ tokenId: req.params.tokenId, itemCollection: req.params.collection, bValid: true },{_id: 0, __v: 0}).lean();
        if (pair) {             
          item.pair = pair;
        }  
        
        // set auction data
        let auction = await Auction.findOne({ tokenId: req.params.tokenId, itemCollection: req.params.collection, active: true },{_id: 0, __v: 0}).lean();
        if (auction) {
          auction.price = auction.startPrice
          let bids = await Bid.find({ auctionId: auction.id },{_id: 0, __v: 0}).sort({ bidPrice: -1 }).lean();          
          
          if (bids.length > 0) {
            for (let index = 0; index < bids.length; index++) {
              const bid = bids[index];
              var fromUser = await User.findOne({address: bid.from},{_id: 0, __v: 0}).lean();        
              if (!fromUser) {          
                const newUser = new User({
                  address: bid.from.toLowerCase(),
                  name: "NoName",
                  role: "NoRole",
                  profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                  coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                  isApproved: false,
                  nonce: Math.floor(Math.random() * 1000000)
                })
                await newUser.save();         
                bid.fromUser = newUser;
              } else {
                bid.fromUser = fromUser;
              }
            }
            auction.price = bids[0].bidPrice
            auction.bids = bids
          }        
          item.auction = auction;
        }

        // set transaction history data
        let events = await Event.find({ tokenId: req.params.tokenId, itemCollection: req.params.collection },{_id: 0, __v: 0}).sort({ timestamp: -1 }).lean();
        if (events.length > 0) {
          for (let index = 0; index < events.length; index++) {
            let event = events[index];
            if (event.from) {
              var user = await User.findOne({address: event.from},{_id: 0, __v: 0}).lean();        
              if (!user) {          
                var newUser = new User({
                  address: event.from.toLowerCase(),
                  name: "NoName",
                  role: "NoRole",
                  profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                  coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                  isApproved: false,
                  nonce: Math.floor(Math.random() * 1000000)
                })
                await newUser.save();         
                event.fromUser = newUser;
              } else {
                event.fromUser = user;
              }   
            }  
            if (event.to) {
              var user = await User.findOne({address: event.to},{_id: 0, __v: 0}).lean();        
              if (!user) {          
                var newUser = new User({
                  address: event.to.toLowerCase(),
                  name: "NoName",
                  role: "NoRole",
                  profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                  coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                  isApproved: false,
                  nonce: Math.floor(Math.random() * 1000000)
                })
                await newUser.save();         
                event.toUser = newUser;
              } else {
                event.toUser = user;
              }   
            }             
          }
        }
        item.events = events

        // set collection
        let collection = await Collection.findOne({ address: req.params.collection },{_id: 0, __v: 0}).lean();
        item.collection = collection
        
        // set item creator
        var creator = await User.findOne({address: item.creator},{_id: 0, __v: 0}).lean();        
        if (!creator) {          
          const newUser = new User({
            address: item.creator.toLowerCase(),
            name: "NoName",
            role: "NoRole",
            profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
            coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
            isApproved: false,
            nonce: Math.floor(Math.random() * 1000000)
          })
          await newUser.save();         
          item.creatorUser = newUser;
        } else {
          item.creatorUser = creator;
        }  
        
        var owner = await User.findOne({address: item.itemOwner},{_id: 0, __v: 0}).lean();        
        if (!owner) {          
          const newUser = new User({
            address: item.itemOwner,
            name: "NoName",
            role: "NoRole",
            profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
            coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
            isApproved: false,
            nonce: Math.floor(Math.random() * 1000000)
          })
          await newUser.save();         
          item.ownerUser = newUser;
        } else {
          item.ownerUser = owner;
        }

        res.status(200).send({ item: item });
      });
  },

  like: async function (req, res, next) {
    if (!req.body.address || !req.body.tokenId || !req.body.collection)
      return res.status(400).send("missing params");

    Item.findOne(
      { tokenId: req.body.tokenId, itemCollection: req.body.collection },
      async (err, item) => {
        if (err) return res.status(500).send({ message: err.message });
        if (!item) return res.status(404).send({ message: "No item found" });

        const likeCount = item.likeCount;
        if (item.likes.includes(req.body.address.toLowerCase())) {
          item.likes.splice(
            item.likes.indexOf(req.body.address.toLowerCase()),
            1
          );
          item.likeCount = likeCount - 1;
        } else {
          item.likes.push(req.body.address);
          item.likeCount = likeCount + 1;
        }

        await item.save();

        res.status(200).send({ item: item });
      }
    );
  },

  categories: async function(req, res, next) {
    Category.find({}, {_id: 0, __v: 0}, async (err, items) => {
      if (err) return res.status(500).send({message: err.message});
      if (!items) return res.status(404).send({message: "No item found"})

      res.status(200).send({categories: items})
    })
  },

  registerEmail: async function (req, res, next) {
    if (!req.body.address || !req.body.email)
    return res.status(400).send("missing params");
    
    var user = await User.findOne({address: req.body.address.toLowerCase()});        
    if (!user) {          
      const newUser = new User({
        address: req.body.address.toLowerCase(),
        name: "NoName",
        role: "NoRole",
        profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
        coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
        isApproved: false,
        email: req.body.email,
        nonce: Math.floor(Math.random() * 1000000)
      })
      await newUser.save();      
    } else {
      user.email = req.body.email;      
      await user.save();
    }       
    res.status(200).send({ status: 'success' });
  },
  sendMessage: async function (req, res, next) {
    const currentTimeStamp = Math.floor(Date.now() / 1000)
    if (!req.body.name || !req.body.email || !req.body.subject || !req.body.message)
    return res.status(400).send("missing params");
    const message = new Message({
      timestamp: currentTimeStamp,
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,                                 
    })
    await message.save();
    res.status(200).send({ status: 'success' });
  },

  handleGetRequest: function (req, limit) {
    const page =
      req.query.page && parseInt(req.query.page) ? parseInt(req.query.page) : 1;
    let skip = (page - 1) * limit;

    let sortDir =
      req.query.sortDir === "asc" || req.query.sortDir === "desc"
        ? req.query.sortDir
        : "desc";

    const sortBy =
      req.query.sortBy === "name" ||
      req.query.sortBy === "likeCount" ||
      req.query.sortBy === "timestamp"
        ? req.query.sortBy
        : "timestamp";

    delete req.query.page;
    delete req.query.sortBy;
    delete req.query.sortDir;

    if (sortDir === "asc") sortDir = 1;
    else if (sortDir === "desc") sortDir = -1;

    if (sortDir === "asc") sortDir = 1;
    else if (sortDir === "desc") sortDir = -1;

    let sort;
    if (sortBy === "name") {
      sort = { name: sortDir };
    } else if (sortBy === "likeCount") {
      sort = { likeCount: sortDir };
    } else {
      sort = { timestamp: sortDir };
    }

    if (req.query.likes) {
      req.query.likes = req.query.likes.toLowerCase();
    }

    if (req.query.creator) {
      req.query.creator = req.query.creator.toLowerCase();
    }

    if (req.query.owner) {
      req.query.owner = req.query.owner.toLowerCase();
    }

    if (req.query.itemOwner) {
      req.query.itemOwner = req.query.itemOwner.toLowerCase();
    }

    const saleType = req.query.saleType;      
    delete req.query.saleType;

    if (saleType == 'fixed') {
      req.query.owner = marketAddr.toLowerCase();
    } else if (saleType == 'auction') {
      req.query.owner = auctionAddr.toLowerCase();
    } else if (saleType == 'all'){
      req.query['$or'] = [{owner: marketAddr.toLowerCase()}, {owner: auctionAddr.toLowerCase()}];
    }

    const searchTxt = req.query.searchTxt;      
    delete req.query.searchTxt;
    if (searchTxt) {
      console.log(searchTxt)
      const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
      const searchRgx = rgx(searchTxt);
      req.query.name = { $regex: searchRgx, $options: "i" };
    }

    req.query.itemStatus = true

    return { query: req.query, sort: sort, skip: skip };
  },

  handleEventGetRequest: function (req, limit) {     
    delete req.query.limit   
    const page =
      req.query.page && parseInt(req.query.page) ? parseInt(req.query.page) : 1;
    let skip = (page - 1) * limit;   
    delete req.query.page;      

    var address = req.query.address;
    delete req.query.address;
    if (address) {
        const rgx = (pattern) => new RegExp(`.*${pattern}.*`);
        const addressRgx = rgx(address.toLowerCase());
        req.query['$or'] = [
            {from: address.toLowerCase()}, 
            {to: address.toLowerCase()}
        ];
    }
   
    var filter = req.query.filter;
    delete req.query.filter;
    if (filter) {
        var filters = filter.split("_"); 
        req.query.name = { $in: filters};
    }                 

    return { query: req.query, skip: skip };
  },

  getItemDetail: async function (tokenId, itemCollection) {
    // tokenId: Number, itemCollection: String
    const item = await Item.findOne({tokenId: tokenId, itemCollection: itemCollection}, {__v:0, _id:0}).lean();
    if (!item) return null

    if (item.owner.toLowerCase() == marketAddr.toLowerCase()) {
      // marketplace item
      let pair = await Pair.findOne({ tokenId: item.tokenId, itemCollection: item.itemCollection, bValid: true },{_id: 0, __v: 0}).lean();
      if (pair) {             
        item.pair = pair;
      }
    } else if (item.owner.toLowerCase() == auctionAddr.toLowerCase()){           
      // auction item            
      let auction = await Auction.findOne({ tokenId: item.tokenId, itemCollection: item.itemCollection, active: true },{_id: 0, __v: 0}).lean();
      if (auction) {
        auction.price = auction.startPrice
        let bids = await Bid.find({ auctionId: auction.id },{_id: 0, __v: 0}).sort({ bidPrice: -1 }).lean();
        auction.bids = bids
        if (bids.length > 0) {
          auction.price = bids[0].bidPrice
        }        
        item.auction = auction;
      }
    }

    // set item creator
    var creator = await User.findOne({address: item.creator},{_id: 0, __v: 0}).lean();        
    if (!creator) {          
      const newUser = new User({
        address: item.creator.toLowerCase(),
        name: "NoName",
        role: "NoRole",
        profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
        coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
        isApproved: false,
        nonce: Math.floor(Math.random() * 1000000)
      })
      await newUser.save();         
      item.creatorUser = newUser;
    } else {
      item.creatorUser = creator;
    }   

    // set item owner
    var owner = await User.findOne({address: item.itemOwner},{_id: 0, __v: 0}).lean();        
    if (!owner) {          
      const newUser = new User({
        address: item.itemOwner,
        name: "NoName",
        role: "NoRole",
        profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
        coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
        isApproved: false,
        nonce: Math.floor(Math.random() * 1000000)
      })
      await newUser.save();         
      item.ownerUser = newUser;
    } else {
      item.ownerUser = owner;
    } 
    
    return item
  },


});

