//DEPENDENCIES
const express = require("express");
const cookieParser = require('cookie-parser');

//CONFIGURATIONS
const PORT = 8080; // default port 8080
const app = express();
app.set("view engine", "ejs");

//HELPER FUNCTIONS
const generateRandomString = function() {
  //random string of characters and cuts off at a length of 6 w/ substr method
  return Math.random().toString(36).substr(6);
};
//checks if email entered already exists
const checkIfEmailExists = function(email) {
  let userFound = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      userFound = user;
      return userFound;
    }
  }
  return false;
};

//DATABASE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "catsarecool1",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "catsarecool2",
  },
};

//MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//ROUTES
app.get("/", (req, res) => {
  res.send("Hello!");
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
  //get user's cookie
  const userId = req.cookies['user_id'];
  //check if user is logged in
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
  const userId = req.cookies['user_id'];
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
  const templateVars = {
    user: users[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});
//fetches page to create new URL
app.get('/urls/new', (req, res) => {
  //get user's cookie
  const userId = req.cookies['user_id'];
  //check if user is logged in
  if (!userId) {
   return res.redirect('/login');
  }
  const templateVars = { 
    user: users[req.cookies['user_id']],
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("URL doesn't exist in our database")
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
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Invalid email or password');
  } else if (checkIfEmailExists(email)) {
    res.status(400);
    res.send("Can't register with an email address that has already been used.");
  } else {
    //makes new user object
    const user = {id, email, password};
    //adds new user to user object
    users[id] = user;
    //adds new user id cookie
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});
//allows user to login if email and password match database
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const foundUser = checkIfEmailExists(email);
  if (!foundUser.id) {
    res.status(403);
    res.send("Email cannot be found. Please register.");
  } else if (foundUser.password !== password) {
    res.status(403);
    res.send("Password doesn't match email address provided.");
  } else {
    res.cookie('user_id', foundUser.id);
    res.redirect('/urls');
  }
});
//allows user to logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});
//adds new short url to database
app.post('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  if (!userId) {
   return res.send("Only users who are logged in can shorten URLs. Please Login or Register.");
  }
  const longURL = req.body.longURL;
  const newShortURL = generateRandomString();
  //add new url to database
  urlDatabase[newShortURL] = longURL;
  // Use route to view the new url you made!
  res.redirect(`/urls/${newShortURL}`);
});
//edits and updates long URL in database
app.post('/urls/:id/', (req, res) => {
  const editLongURL = req.body.type;
  urlDatabase[req.params.id] = editLongURL;
  res.redirect('/urls');
});
//Delete
//allows user to delete urls
app.post('/urls/:id/delete', (req, res) => {
  const urlID = req.params.id;
  delete urlDatabase[urlID];
  res.redirect('/urls');
});

//LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});