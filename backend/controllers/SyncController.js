const ethers = require('ethers');
const axios = require('axios');
const SettingModel = require('../models/setting.model');
const Item = require('../models/item.model');
const Pair = require('../models/pair.model');
const Auction = require('../models/auction.model');
const Bid = require('../models/bid.model');
const Event = require('../models/event.model');
const ItemCollection = require('../models/collection.model');
const Sold = require('../models/sold.model');

const BaseController = require('./BaseController');

module.exports = BaseController.extend({
    name: 'SyncController',

    sync_block: async function (req, res, next) {
        try {
            const setting = await SettingModel.findOne({});                
            const lastTimeStamp = setting?.timestamp || 0;            
            
            console.log(`------- Called from frontend , lastTimeStamp: ${lastTimeStamp} -------`);                    
            
            var data = JSON.stringify({
                query: `{
                            collections(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                address
                                owner
                                name
                                uri
                                isPublic
                            }
                            items(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                collection
                                tokenId
                                uri
                                creator
                                owner
                                royalty
                            }
                            pairs(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                collection
                                tokenId
                                creator
                                owner                                    
                                price
                                creatorFee
                                bValid
                            }
                            auctions(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                collection
                                tokenId
                                startTime
                                endTime
                                startPrice
                                creator
                                owner
                                active
                            }
                            bids(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                collection
                                tokenId
                                auctionId
                                from
                                bidPrice                                   
                            }
                            events(first: 1000, where:{timestamp_gt:${lastTimeStamp}}, orderBy:timestamp, orderDirection:desc) {
                                id
                                timestamp
                                txhash
                                logIndex
                                collection
                                tokenId
                                name
                                from
                                to
                                price
                            }
                        }`,
                variables: {}
            });

            var config = {
                method: 'post',
                url: 'http://194.147.58.11:8000/subgraphs/name/bsc/qubismnft',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data
            };

            const result = await axios(config);
            
            const collections = this.sortByTimeStamp(result.data.data.collections);
            const items = this.sortByTimeStamp(result.data.data.items);
            const pairs = this.sortByTimeStamp(result.data.data.pairs);
            const auctions = this.sortByTimeStamp(result.data.data.auctions);
            const bids = this.sortByTimeStamp(result.data.data.bids);
            const events = this.sortByTimeStamp(result.data.data.events);

            // Collection node
            for (var index = 0; index < collections.length; index++) {
                const node = collections[index];
                const address = node.address.toLowerCase();
                const owner = node.owner.toLowerCase();
                const name = node.name;
                const uri = node.uri;
                const isPublic = node.isPublic;
                const timestamp = node.timestamp;
                
                await ItemCollection.findOneAndUpdate({address: address},{
                    address: address,
                    owner: owner,
                    name: name,
                    uri: uri,
                    isPublic: isPublic,
                    timestamp: timestamp
                }, {new: true, upsert: true})
            }

            // Item node
            for (var index = 0; index < items.length; index++) {
                const node = items[index];
                const id = node.id;
                const timestamp = node.timestamp;
                const collection = node.collection.toLowerCase();
                const tokenId = node.tokenId;
                const creator = node.creator.toLowerCase();
                const owner = node.owner.toLowerCase();
                const royalty = node.royalty;

                const uri = node.uri;
                const uriResult = await axios(uri);
                const assetType = uriResult.data.assetType;
                const category = uriResult.data.category;
                const name = uriResult.data.name;
                const description = uriResult.data.description;                        
                const mainData = uriResult.data.mainData;
                const coverImage = uriResult.data.coverImage;

                var item = await Item.findOne({tokenId: tokenId, itemCollection: collection});        
                if (!item) {          
                    const newItem = new Item({
                        timestamp: timestamp,
                        itemCollection: collection,
                        tokenId: tokenId,
                        creator: creator,
                        owner: owner,
                        itemOwner: owner,
                        royalty: royalty,
                        assetType: assetType,
                        category: category,
                        name: name,
                        description: description,
                        mainData: mainData,
                        coverImage: coverImage,
                        itemStatus: true,
                        likeCount: 0,
                        likes: [],
                        price: 0
                    })
                    await newItem.save();        
                } else {
                    item.timestamp = timestamp;
                    item.owner = owner;
                    item.itemOwner = owner;
                    await item.save();
                }       
            }

            // Pair node
            for (var index = 0; index < pairs.length; index++) {
                const node = pairs[index];
                const id = node.id;
                const timestamp = node.timestamp;
                const collection = node.collection.toLowerCase();
                const tokenId = node.tokenId;
                const creator = node.creator.toLowerCase();
                const owner = node.owner.toLowerCase();
                const price = node.price;
                const creatorFee = node.creatorFee;
                const bValid = node.bValid;                          
                
                if (bValid) {
                    await Pair.findOneAndUpdate({id: id},{
                        id: id,
                        timestamp: timestamp,
                        itemCollection: collection,
                        tokenId: tokenId,
                        creator: creator,
                        owner: owner,
                        price: ethers.utils.formatEther(price),
                        creatorFee: creatorFee,
                        bValid: bValid
                    }, {new: true, upsert: true})
                    var item = await Item.findOne({tokenId: tokenId, itemCollection: collection});        
                    if (item) {          
                        item.timestamp = timestamp;
                        item.itemOwner = owner;
                        await item.save();     
                    }
                } else {
                    await Pair.findOneAndDelete({id: id})
                }
            }

            // Bid node
            for (var index = 0; index < bids.length; index++) {
                const node = bids[index];
                const id = node.id;
                const timestamp = node.timestamp;
                const collection = node.collection.toLowerCase();
                const tokenId = node.tokenId;
                const auctionId = node.auctionId;
                const from = node.from.toLowerCase();
                const bidPrice = node.bidPrice;                        
                
                await Bid.findOneAndUpdate({id: id},{
                    id: id,
                    timestamp: timestamp,
                    itemCollection: collection,
                    tokenId: tokenId,
                    auctionId: auctionId,
                    from: from,
                    bidPrice: ethers.utils.formatEther(bidPrice)
                }, {new: true, upsert: true})
            }

            // Auction node
            for (var index = 0; index < auctions.length; index++) {
                const node = auctions[index];
                const id = node.id;
                const timestamp = node.timestamp;
                const collection = node.collection.toLowerCase();
                const tokenId = node.tokenId;
                const startTime = node.startTime;
                const endTime = node.endTime;
                const startPrice = node.startPrice;
                const creator = node.creator.toLowerCase();
                const owner = node.owner.toLowerCase();
                const active = node.active;                        
                
                if (active) {
                    await Auction.findOneAndUpdate({id: id},{
                        id: id,
                        timestamp: timestamp,
                        itemCollection: collection,
                        tokenId: tokenId,
                        startTime: startTime,
                        endTime: endTime,
                        creator: creator,
                        owner: owner,
                        startPrice: ethers.utils.formatEther(startPrice),
                        active: active
                    }, {new: true, upsert: true})
                    var item = await Item.findOne({tokenId: tokenId, itemCollection: collection});        
                    if (item) {          
                        item.timestamp = timestamp;
                        item.itemOwner = owner;
                        await item.save();     
                    }
                } else {
                    await Auction.findOneAndDelete({id: id})
                    // delete all bids for this auction
                    await Bid.deleteMany({auctionId: id})                            
                }
            }

            // Event node
            for (var index = 0; index < events.length; index++) {
                const node = events[index];
                const id = node.id;
                const timestamp = node.timestamp;
                const txhash = node.txhash;
                
                const collection = node.collection.toLowerCase();
                const tokenId = node.tokenId;
                const name = node.name;
                const from = node.from?.toLowerCase();  
                const to = node.to?.toLowerCase(); 
                const price = node.price;                                    
                
                await Event.findOneAndUpdate({id: id},{
                    id: id,
                    timestamp: timestamp,
                    txhash: txhash,
                    itemCollection: collection,
                    tokenId: tokenId,
                    name: name,
                    from: from,
                    to: to,
                    price: ethers.utils.formatEther(price)
                }, {new: true, upsert: true})
                var item = await Item.findOne({tokenId: tokenId});        
                if (item) {
                    if (name === 'Sold') {
                        await Sold.findOneAndUpdate({timestamp: timestamp, seller: from},{
                            timestamp: timestamp,
                            itemCollection: collection,
                            tokenId: tokenId,
                            seller: from,
                            amount: ethers.utils.formatEther(price)
                        }, {new: true, upsert: true})
                        item.price = 0;
                    } else {
                        item.price = ethers.utils.formatEther(price);
                    } 
                    await item.save();                          
                }
            }


            return res.status(200).send({ status: 'success' });
        }
        catch (ex) {
            console.log(ex);
            return res.status(500).send({ status: 'failed', exception: ex });
        }
    },
    sortByTimeStamp: function(nodes) {
        return (nodes || []).sort((a, b) => a.timestamp - b.timestamp);
    }
});
