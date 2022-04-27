const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var ethSignUtil = require('eth-sig-util');
var ethereumjsUtil = require('ethereumjs-util');

const BaseController = require('./BaseController');
const User = require("../models/user.model");


module.exports = BaseController.extend({
    name: 'UserController',

    login: async function(req, res, next) {
        let {address, signature } = req.body;
        if (!address || !signature) {
            return res.status(400).send({ error: 'invalid params'})
        }

        address = address.toLowerCase().trim();

        var user = await User.findOne({ address: address });
        if (!user) {
            return res
                .status(401)
                .send({ error: 'Signature verification failed' });
        }

        const msg = `I am signing my one-time nonce: ${user.nonce}`;

        const msgBufferHex = ethereumjsUtil.bufferToHex(Buffer.from(msg, 'utf8'));
        const publicAddress = ethSignUtil.recoverPersonalSignature({
            data: msgBufferHex,
            sig: signature,
        });

        // The signature verification is successful if the address found with
        // ecrecover matches the initial publicAddress
        if (address.toLowerCase() === publicAddress.toLowerCase()) {
            user.nonce = Math.floor(Math.random() * 1000000);
            user.last_login = new Date();
            await user.save();

            var token = jwt.sign({ data: user.address }, '!@#456QWErty', { expiresIn: '43200m' }); // expireIn 1month
            return res
                .status(200)
                .send({token: token});
        } else {
            return res
                .status(401)
                .send({ error: 'Signature verification failed' });
        }

    },

    check: async function(req, res, next) {
        const {address} = req.query;
        if (!address) {
            return res.status(400).send({ error: 'invalid address'})
        }

        let user = await UserModel.findOne({address: address.toLowerCase().trim()}).lean();
        if(!user || user.status !== 'active') {
            return res.sendStatus(404);
        }

        return res.status(200).send(user)
    },

    get: async function(req, res, next) {
        User.findOne({address: req.params.address}, {_id: 0, __v: 0},async (err, user) => {
            if (err) return res.status(500).send({message: err.message});

            if (!user){
              const newUser = new User({
                address: req.params.address,
                name: "NoName",
                role: "NoRole",
                profilePic: "https://ipfs.io/ipfs/QmaxQGhY772ffG7dZpGsVoUWcdSpEV1APru95icXKmii67",
                coverImg: "https://ipfs.io/ipfs/QmcCpXu1pNf8HAtMAmoSzppmznRAGAL3u5oT1MXcAVEDnH",
                isApproved: false,
                nonce: Math.floor(Math.random() * 1000000)
              })
              await newUser.save();
              return res.status(200).send({user: newUser})
            }
            res.status(200).send({user: user})
          })
    },

    update: async function(req, res, next) {
        if (!req.body.address) return res.status(400).send("No address")
        const name = req.body.name || "NoName"
        const role = req.body.role || "NoName"
        const bio = req.body.bio || ""
        const profilePic = req.body.profilePic || ""
        const coverImg = req.body.coverImg || ""

        User.findOne({address: req.body.address}, async (err, user) => {
            if (err) return res.status(500).send({message: err.message});
            if (!user) return res.status(400).send({message: "User not found"});

            User.find({name: name}, async (err, docs) => {
            if (err) return res.status(500).send({message: err.message});
            if (docs.length != 0 && name && name != user.name) return res.status(400).send({message: "Username taken"})

            if (name && name != undefined || name === "") user.name = name
            if (role && role != undefined || role === "") user.role = role
            if (bio && bio != undefined || bio === "") user.bio = bio
            if (profilePic && profilePic != undefined || profilePic === "") user.profilePic = profilePic
            if (coverImg && coverImg != undefined || coverImg === "") user.coverImg = coverImg

            await user.save();
            return res.sendStatus(200);

            })
        })
    },
});
