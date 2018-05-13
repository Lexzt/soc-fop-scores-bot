/**
 * Firebase auth'
 */
var firebase = require("firebase");

// Initalize the details needed for firebase account
firebase.initializeApp({
  serviceAccount: "SOC FOP Score bot-64daed28285e.json",
  databaseURL: "https://soc-fop-score-bot.firebaseio.com/"
});

var db = firebase.database(),
  ref = db.ref('Houses');

var FirebaseManager = function () { };

/**
 * Function to create a new house on firebase.
 *
 * @param  {[String]} house_name  [House name]
 * @param  {[String]} house_head  [House Head name]
 * @param  {[String]} house_color [House Color, Type]
 */
FirebaseManager.prototype.createHouse = function (house_name, house_head, house_color) {
  // Holds format for houses and child of that house, s_listReference. 
  var s_list = "Houses",
    s_listReference = house_color + ' House';

  // Reference of the house, based on the database.
  var listsRef = ref.child(s_listReference);

  // Create a new child with original value.
  listsRef.set({
    houseHead: house_head.first_name + " " + house_head.last_name,
    houseColor: house_color,
    houseName: house_name,
    totalScore: 0
  });
};

/**
 * Function to create a new og on firebase.
 *
 * @param  {[Telegram Bot]} house_name  [House name]
 * @param  {[String]} house_head  [House Head name]
 * @param  {[String]} house_color [House Color, Type]
 */
FirebaseManager.prototype.createOG = function (bot, listId, house_color, og_name, action) {
  ref.once('value', function (snapshot) {
    var listObj = snapshot.val();
    console.log("test: " + listObj);
    if (action === 'add') {
      addOrientationGroupToHouse(bot, listId, listObj, house_color, og_name);
    } else {
      //removeItemOnArray(bot, listId, house_name, og_name, listObj);
    }
  });
};

FirebaseManager.prototype.addScoreGroups = function (bot, listId, house_color) {
  var funcKeyboard = {
    reply_markup: {
      inline_keyboard:
      [
        [
        ]
      ],
    }
  }

  ref.once("value", function (data) {
    data.forEach(function (data) {
      if (data.hasChild('houseColor')) {
        if (data.child('houseColor').val() === house_color) {
          data.child('orientationGroups').forEach(function (ogData) {
            funcKeyboard.reply_markup.inline_keyboard[0].push(
              {
                text: ogData.val().ogName,
                callback_data: JSON.stringify
                  ({
                    type: 'as,og',
                    color: house_color,
                    og: ogData.val().ogName,
                    id: listId
                  })
              }
            )
          });
          bot.sendMessage(listId, "Add Score, Choose OG", funcKeyboard)
            .then(function () {
              console.log('(as,og) ' + funcKeyboard);
            }).catch(console.error);
        }
      }
    });
  });
}

FirebaseManager.prototype.updateScores = function (color, name, tscore) {
  var house_scoreRef = ref.child(color + ' House/totalScore');
  house_scoreRef.transaction(function (current_value) {
    return (current_value || 0) + tscore;
  });

  var house_ogscoreRef = ref.child(color + ' House/orientationGroups');
  house_ogscoreRef.orderByChild("ogName").equalTo(name).once("value", function (snapshot) {
    snapshot.forEach(function (ogChild) {
      console.log(ogChild.ref.toString());
      ogChild.ref.child('Score').transaction(function (current_value) {
        return (current_value || 0) + tscore;
      });
    })
  });
}

FirebaseManager.prototype.listScores = function (bot, msgId) {
  var str = "";
  ref.once('value', function (snapshot) {
    // console.log("snapshot: " + snapshot);
    snapshot.forEach(function (snap) {
      // console.log("snap: " +snap.val().totalScore);
      str += jsUcfirst(snap.val().houseColor) + " house has " + snap.val().totalScore + " points!\n";
      snap.child('orientationGroups').forEach(function (indivOg) {
        // console.log(indivOg.val());
        str += "OG " + indivOg.val().ogName + " scored " + indivOg.val().Score + " points!\n"
      });
    })
    bot.sendMessage(msgId, str);
    // console.log(str);
  });
}

function jsUcfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function objectExistsCallback(userId, exists, house_color, og_name) {
  if (exists) {
    // Add it into the list
    var ogsRef = ref.child(house_color + ' House').child('orientationGroups');
    ogsRef.push({ "ogName": og_name, "Score": 0 });
  } else {
    // Create it
    var s_ogsReference = 'orientationGroups',
      ogsRef = ref.child(house_color + ' House').child(s_ogsReference);

    ogsRef.push({ "ogName": og_name, "Score": 0 });
  }
}

function addOrientationGroupToHouse(bot, listId, participantsList, house_color, og_name) {
  var list = "Houses";
  var listReference = house_color + ' House';
  var listsRef = ref.child(listReference);
  var ogsRef = listsRef.child('orientationGroups');

  ref.child(listReference).child('orientationGroups').once('value', function (snapshot) {
    var exists = (snapshot.val() !== null);
    objectExistsCallback('orientationGroups', exists, house_color, og_name);
  });
};

function removeItemOnArray(bot, listId, participantsList, fullname) {
  var list = listId.toString(),
    listReference = 'list_' + list.replace(/-|\s/g, ''),
    listsRef = ref.child(listReference),
    arrParticipants = participantsList[listReference].participants || [],
    index = arrParticipants.indexOf(fullname);

  if (index > -1) {
    arrParticipants.splice(index, 1);
    bot.sendMessage(listId, 'Name was removed!');
  } else {
    bot.sendMessage(listId, 'This name not exists in the list');
    return;
  }

  //Set datas to list
  listsRef.update({
    participants: arrParticipants
  });
};

FirebaseManager.prototype.managerParticipants = function (bot, listId, firstName, lastName, action) {
  ref.once('value', function (snapshot) {
    var listObj = snapshot.val(),
      fullname = firstName + ' ' + lastName;

    if (action === 'add') {
      addItemOnArray(bot, listId, listObj, fullname);
    } else {
      removeItemOnArray(bot, listId, listObj, fullname);
    }

  });
};

FirebaseManager.prototype.managerGuests = function (bot, listId, guestName, action) {
  ref.once('value', function (snapshot) {
    var listObj = snapshot.val(),
      fullname = guestName;

    if (action === 'add') {
      addItemOnArray(bot, listId, listObj, fullname);
    } else {
      removeItemOnArray(bot, listId, listObj, fullname);
    }

  });
};

FirebaseManager.prototype.showList = function (bot, listId) {
  ref.once("value", function (snapshot) {

    var listObj = snapshot.val(),
      list = listId.toString(),
      listReference = 'list_' + list.replace(/-|\s/g, ''),
      listsRef = ref.child(listReference),
      participantsList = listObj[listReference].participants || [],
      listName = listObj[listReference].listName,
      output = listName + '\n';

    //output
    for (var i = 0; i < participantsList.length; i += 1) {
      output += '' + (i + 1) + '. ' + participantsList[i] + '\n';
    }

    bot.sendMessage(listId, output);
  });
};

// FirebaseManager.prototype.checkIfApproved = function (userId) {
//   console.log(userId);
//   db.ref("Users").child(userId).once("value", function (snapshot) {
//     console.log(snapshot.val());
//     console.log("approved: " + snapshot.val() !== null);
//     return (snapshot.val() !== null)
//   });
// };

FirebaseManager.prototype.checkIfApproved = function (userId) {
  console.log(userId);
  return new Promise ((resolve, reject) => {
    db.ref("Users").
      child(userId).
      once("value", function (snapshot) {
        console.log(snapshot.val());
        console.log("approved: " + snapshot.val() !== null);
        resolve(snapshot.val() !== null);
      });
    });
  };

module.exports = new FirebaseManager();
