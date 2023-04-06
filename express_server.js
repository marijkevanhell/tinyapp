//DEPENDENCIES
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

//CONFIGURATIONS
const PORT = 8080; // default port 8080
const app = express();
app.set("view engine", "ejs");

//DATABASE
const urlDatabase = {
  b6UTxQ: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
};
const users = {};

//MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['secretkey'],
  //expires after 24 hrs
  maxAge: 24 * 60 * 60 * 1000
}));

//ROUTES
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  //checks if user is logged in
  if (userId) {
    return res.redirect('/urls');
  }
  return res.redirect('/login');
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//Register
//fetches registration page
app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user: users[userId],
  };
  res.render('urls_register', templateVars);
});
//Login
//fetches login page
app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect('/urls');
  }
  const templateVars = {
    user: users[userId]
  };
  res.render('urls_login', templateVars);
});
//Urls
//fetches main URL page
app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");
  }
  const templateVars = {
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase)
  };
  res.render('urls_index', templateVars);
});
//fetches page to create new URL
app.get('/urls/new', (req, res) => {
  //get user's cookie
  const userId = req.session.user_id;
  //check if user is logged in
  if (!userId) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[userId],
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  console.log(userId)
  console.log(shortURL)
  console.log(urlDatabase)
  console.log(userId !== urlDatabase[shortURL].userID)
  //check if id exists
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("URL with provided id doesn't exist in our database.");
  }
  if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");
  } if (userId !== urlDatabase[shortURL].userID) {
    return res.status(401).send("Access denied. This URL belongs to another user.");
  }
  const templateVars = {
    user: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("URL with provided id doesn't exist in our database.");
  }
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});
//Post
//registers new user
app.post('/register', (req, res) => {
  const id = generateRandomString();
  //take email & password from body object
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Invalid email or password');
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("Can't register with an email address that has already been used.");
  } else {
    //makes new user object
    const user = {
      id,
      email,
      password: hashedPassword
    };
    //adds new user to user object
    users[id] = user;
    req.session.user_id = id;
    res.redirect('/urls');
  }
});
//allows user to login if email and password match database
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = getUserByEmail(email, users);
  if (!foundUser) {
    res.status(403).send("Email cannot be found. Please register.");
  } else if (!bcrypt.compareSync(password, foundUser.password)) {
    res.status(403).send("Password doesn't match email address provided.");
  } else {
    req.session.user_id = foundUser.id;
    res.redirect('/urls');
  }
});
//allows user to logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});
//adds new short url to database
app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(401).send("Only users who are logged in can shorten URLs. Please Login or Register.");
  }
  const newLongURL = req.body.longURL;
  const newShortURL = generateRandomString();
  //add new url to database
  urlDatabase[newShortURL] = {
    longURL: newLongURL,
    userID: userId
  };
  res.redirect(`/urls/${newShortURL}`);
});
//edits and updates long URL in database
app.post('/urls/:id/', (req, res) => {
  const userId = req.session.user_id;
  const userURLs = urlsForUser(userId, urlDatabase);
  const shortURL = req.params.id;
  console.log(userURLs)
  //if id doesn't exist
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("URL with provided id doesn't exist in our database.");
  //if the user is not logged in
  } if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");
  //if the user doesn't own URL
  } if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(401).send("Access denied. This URL belongs to another user.");
  } else {
    const editLongURL = req.body.type;
    //update long URL in database
    urlDatabase[req.params.id].longURL = editLongURL;
    return res.redirect('/urls');
  }
});
//Delete
//allows user to delete urls
app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session.user_id;
  const userURLs = urlsForUser(userId, urlDatabase);
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("URL with provided id doesn't exist in our database.");
  } if (!userId) {
    return res.status(401).send("Access denied. Please Login or Register.");
  } if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(401).send("Access denied. This URL belongs to another user.");
  } else {
    const urlID = req.params.id;
    //removes URL from database object
    delete urlDatabase[urlID];
    //redirects to urls_index ('/urls')
    return res.redirect('/urls');
  }
});

//LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});