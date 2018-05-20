const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

function getUser(userId) {
  return db.get('users').find({ id: userId }).value();
}

function getHouse(houseColor) {
  return db.get('houses').find({ color: houseColor }).value();
}

/**
 * Add score to a house.
 *
 * @param {string} houseColor - Color of the house to add the score.
 * @param {integer} score - Score to be added.
 * @param {integer} userId - ID of the user invoking this request.
 * @returns {integer} - Updated score of the house.
 */
module.exports.addScore = function(houseColor, score, userId) {
  return new Promise((resolve, reject) => {
    const user = getUser(userId);
    const house = getHouse(houseColor);
    
    if (user === undefined) {
      reject('Error adding score: invalid user');
    }
    
    if (user.level > 1) {
      reject('Error adding score: permission denied');
    }
    
    if (house === undefined) {
      reject('Error adding score: invalid house color');
    }
    
    db.get('houses')
      .find({ color: houseColor })
      .set('score', house.score + score)
      .write();
    
    resolve(house.score);
  });
};

/**
 * Edit name and head of a house. The house head would be changed
 * to the invoker of this function.
 *
 * @param {string} houseColor - Color of the house to be changed.
 * @param {string} houseName - New name for the house.
 * @param {integer} userId - ID of the user invoking this request.
 */
module.exports.editHouse = function(houseColor, houseName, userId) {
  return new Promise((resolve, reject) => {
    const user = getUser(userId);
    const house = getHouse(houseColor);
    
    if (user === undefined) {
      reject('Error editing house: invalid user');
    }
    
    if (user.level > 0) {
      reject('Error editing house: permission denied');
    }
    
    if (house === undefined) {
      reject('Error editing house: invalid house color');
    }
    
    db.get('houses')
      .find({ color: houseColor })
      .set('name', houseName)
      .set('head', userId)
      .write();
    
    resolve();
  });
};

/**
 * Get useful contacts.
 *
 * @returns {array} - Array of objects, each indicating the name
 *                    of the useful contact and their contact
 *                    number.
 */
module.exports.getContacts = function() {
  return new Promise((resolve, reject) => {
    resolve([
      { name: 'OSA Student Service', number: '6516 1177' },
      { name: 'Relationship Hotline', number: '9647 6439' }
    ]);
  });
};

/**
 * Get the overall score of all houses.
 *
 * @returns {array} - Array of objects, each indicating the house
 *                    color and their score.
 */
module.exports.getOverallScore = function() {
  return new Promise((resolve, reject) => {
    resolve(db.get('houses')
              .map(house => ({ color: house.color, score: house.score }))
              .value());
  });
};

/**
 * Create a new OG. The OG head would be changed to the invoker
 * of this function.
 *
 * @param {string} houseColor - Color of the house to add the new OG.
 * @param {string} ogName - Name of the new OG.
 * @param {integer} userId - ID of the user invoking this request.
 */
module.exports.newOG = function(houseColor, ogName, userId) {
  return new Promise((resolve, reject) => {
    const user = getUser(userId);
    const house = getHouse(houseColor);
    
    if (user === undefined) {
      reject('Error adding new OG: invalid user');
    }
    
    if (user.level > 1) {
      reject('Error adding new OG: permission denied');
    }
    
    if (house === undefined) {
      reject('Error adding new OG: invalid house color');
    }
    
    db.get('houses')
      .find({ color: houseColor })
      .get('ogs')
      .push({ name: ogName, head: userId })
      .write();
    
    resolve();
  });
};

/**
 * Promote a user. Let T be the person being promoted and U be the
 * person invoking this function. A promotion is only possible if
 * the level of U is lower (lower means more rights) than the level
 * of T, and the level of U is lower than the new level.
 *
 * @param {integer} targetId - ID of the user who is being promoted.
 * @param {integer} level - The new level that targetId is taking on.
 * @param {integer} userId - ID of the user invoking this request.
 */
module.exports.promote = function(targetId, level, userId) {
  return new Promise((resolve, reject) => {
    const user = getUser(userId);
    const target = getUser(targetId);
    
    if (!Number.isInteger(level) || level < 0) {
      reject('Error promoting: invalid level');
    }
    
    if (user === undefined) {
      reject('Error promoting: invalid user');
    }
    
    if (user.level > level) {
      reject('Error promoting: permission denied');
    }
    
    if (target === undefined) {
      reject('Error promoting: invalid target');
    }
    
    if (target.level <= user.level) {
      reject('Error promoting: permission lower than target');
    }
    
    db.get('users')
      .find({ id: targetId })
      .set('level', level)
      .write();
    
    resolve();
  });
}

module.exports.getDailyInfo = function() {
  return new Promise((resolve, reject) => {
    console.log('getDailyInfo');
    resolve();
  });
};

module.exports.getStationScore = function(station) {
  return new Promise((resolve, reject) => {
    console.log('getStationScore');
    resolve();
  });
};