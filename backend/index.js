const express = require('express');
const router = express.Router();
const path = require("path");
const multer = require('multer')

const user_controller = require('./controllers/UserController');
const api_controller = require('./controllers/ApiController');
const collection_controller = require('./controllers/CollectionController');
const sync_controller = require('./controllers/SyncController');


const storage = multer.memoryStorage({
    destination: function (req, file, callback){
        callback(null, '')
    }
})

const upload = multer({storage}).single('image')

/**
 *  User Management
 */
router.post('/api/login', (req, res, next) => {
    user_controller.login(req, res, next);
});

router.get('/api/user/check', (req, res, next) => {
    user_controller.check(req, res, next);
});


router.get("/api/user/:address", (req, res, next) => {
    user_controller.get(req, res, next);
});

router.post("/api/user/update", [upload, user_controller.authenticateToken], (req, res, next) => {    
    user_controller.update(req, res, next)
})


/**
 *  Item Management
 */

router.get("/api/item", (req, res, next) => {
    api_controller.get(req, res, next);
});

router.get("/api/topSellers", (req, res, next) => {
  api_controller.getTopSellers(req, res, next);
});

router.get("/api/topCollections", (req, res, next) => {
  api_controller.getTopCollections(req, res, next);
});
router.get("/api/activities", (req, res, next) => {
  api_controller.getActivities(req, res, next);
}); 

router.get("/api/item/:collection/:tokenId", async (req, res, next) => {
    api_controller.detail(req, res, next)
})

router.post("/api/item/like", [user_controller.authenticateToken], async (req, res, next) => {
  api_controller.like(req, res, next)
})

router.get("/api/categories", async (req, res, next) => {
  api_controller.categories(req, res, next)
})

/**
 *  Send Message
 */
 router.post("/api/contact/sendmessage", async (req, res, next) => {
  api_controller.sendMessage(req, res, next);
});

/**
 *  Subscribe
 */
router.post("/api/contact/subscribe", async (req, res, next) => {
  api_controller.registerEmail(req, res, next);
});


/**
 *  Collection Management
 */


router.get("/api/collection", async (req, res, next) => {
    collection_controller.get(req, res, next)
});

router.get("/api/collection/exist", async (req, res, next) => {
    collection_controller.isExist(req, res, next)
});

router.get("/api/collection/detail/:name", async (req, res, next) => {
    collection_controller.detail(req, res, next)
});


/**
 *  Sync  Management
 */

 router.get("/api/sync_block", async (req, res, next) => {
    sync_controller.sync_block(req, res, next)
  })




router.get('*', function(req, res, next) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});





module.exports = router;
