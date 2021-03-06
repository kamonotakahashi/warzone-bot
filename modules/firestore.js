const firebase = require("firebase");
const date = require("./date.js");

require('dotenv').config();
require("firebase/firestore");


/* Firebase */
const firebaseConfig = {
  apiKey: `${process.env.FIREBASE_API_KEY}`,
  authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
  databaseURL: `${process.env.FIREBASE_DATABASE_URL}`,
  projectId: `${process.env.FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.FIREBASE_STORAGE_BUCKET}`,
  messagingSenderId: `${process.env.FIREBASE_MESSAGING_SENDER_ID}`,
  appId: `${process.env.FIREBASE_APPID}`,
  measurementId: `${process.env.FIREBASE_MEASUREMENT_ID}`
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

module.exports = {
  getVote(id) {
    return db.collection("votes").get().then((snapShot) => {
      let item = {};

      snapShot.forEach((res) => {
        if(res.data().id == id) {
          item[res.id] = res.data();
        }
      });

      return item;
    });
  },
  setVote(id, voteItem, action = '+') {

    let result = this.getVote(id).then( item => {
      return item;
    });

    result.then( res => {

      let objName = Object.keys(res)[0];
      // データがFireStoreにない時
      if(typeof objName == "undefined") {
        db.collection("votes").add({
          id: voteItem.id,
          author: `${voteItem.author}`,
          authorId: voteItem.authorId,
          beginDate: `${voteItem.beginDate}`,
          endDate: `${voteItem.endDate}`,
          player: {
            id: voteItem.player.id,
            name: `${voteItem.player.name}`,
            beforeRate: voteItem.player.beforeRate,
            afterRate: voteItem.player.afterRate
          },
          voteMemory: [],
          agreeCount: voteItem.agreeCount,
          opposition: voteItem.opposition,
          keep: voteItem.keep
        });
      }
    });
  },
  updateVote(id, action, value, history) {
    let result = this.getVote(id).then( item => {
      return item;
    });

    result.then( res => {
      let objName = Object.keys(res)[0];
      let updateObject = {};

      // データがFireStoreにある時
      if(typeof objName != "undefined") {
        if(action == '+') {
          updateObject = {
            agreeCount: value
          };
        } else if(action == '-') {
          updateObject = {
            opposition: value
          };
        } else {
          updateObject = {
            keep: value
          };
        }

        //有期間内だけ
        if(
          res[objName].beginDate <= date.now("YYYY-MM-DD HH:mm:ss")
          && date.now("YYYY-MM-DD HH:mm:ss") <= res[objName].endDate
        ) {
          updateObject["voteMemory"] = [...res[objName].voteMemory, history];
          db.collection("votes").doc(objName).update(updateObject);
        } else {
          return false;
        }

        return true;
      }

    });
  }
};