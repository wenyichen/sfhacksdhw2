const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const admin = require('firebase-admin');
const Jimp = require("jimp");
const QrCode = require('qrcode-reader');

admin.initializeApp();
const users_database = admin.database().ref("/users");
const urls_database = admin.database().ref("/urls");

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

const getUsersFromDatabase = res => {
    let users = [];

    return users_database.on(
        "value",
        snapshot => {
            snapshot.forEach(user => {
                users.push({
                    id: user.key,
                    user: user.val().user
                });
            });
            res.status(200).json(users);
        },
        error => {
            res.status(error.code).json({
                message: `Something went wrong. ${error.message}`
            });
        }
    );
};

exports.addUser = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "POST") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }
        const user = req.body.user;
        users_database.push({ user });
        getUsersFromDatabase(res);
    });
});

exports.getUsers = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "GET") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }
        getUsersFromDatabase(res);
    });
});

const getUrlsFromDatabase = (user, res) => {
    let urls = [];

    return urls_database.on(
        "value",
        snapshot => {
            snapshot.forEach(url => {
                if (url.val().user === user) {
                    urls.push({
                        id: url.key,
                        url: url.val().url
                    });
                }
            });
            return res.status(200).json(urls);
        },
        error => {
            res.status(error.code).json({
                message: `Something went wrong. ${error.message}`
            });
        }
    );
};

exports.getUrls = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "GET") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }
        const user = req.query.user;
        getUrlsFromDatabase(user, res);
    });
});

exports.addUrl = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "POST") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }
        const user = req.body.user;
        const url = req.body.url;
        urls_database.push({ user, url });
        getUrlsFromDatabase(user, res);
    });
});

exports.getQrImg = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "GET") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }
        const url = req.query.url
        res.status(200).json({
            qrcode: "https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl="+url
        })
    });
});

exports.readQrImg = functions.https.onRequest((req, res) => {
    return cors(req, res, () => {
        if (req.method !== "POST") {
            return res.status(401).json({
                message: "Not allowed"
            });
        }

        const qrcode = req.body.qrcode
        Jimp.read(qrcode, (err, image) => {
            if (err) {
                return res.status(401).json({
                    message: "Not allowed"
                })
            }
            var qr = new QrCode();
            qr.callback = function(err, value) {
                if (err) {
                    return res.status(401).json({
                        message: "Not allowed"
                    })
                }
                return res.status(200).json({
                    url: value.result
                });
            };
            qr.decode(image.bitmap);
        });
    });
});