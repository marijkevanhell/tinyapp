//checks if email entered already exists
const getUserByEmail = function(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const generateRandomString = function() {
  //random string of characters and cuts off at a length of 6 w/ substr method
  return Math.random().toString(36).substr(6);
};

//returns URLs where userID = id of the currently logged-in user
const urlsForUser = function(userId, urlDatabase) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };