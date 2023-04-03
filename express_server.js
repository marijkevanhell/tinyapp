//REQUIREMENTS
const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

function generateRandomString() {
  //random string of characters and cuts off at a length of 6 w/ substr method
  return Math.random().toString(36).substr(6);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
//list or index & read all
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
//create new
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});
//create
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const newShortURL = generateRandomString();
  // Add new url to database with generated random string
  urlDatabase[newShortURL] = longURL;
  res.redirect(`/urls/${newShortURL}`);
});
//show 1 URL
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render('urls_show', templateVars);
});
//redirect short to long url
app.get("/urls/:id", (req, res) => {
 
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  res.redirect(longURL);
});
app.post('/urls/:id/', (req, res) => {
  const editLongURL = req.body.type;
  //update long url in  database
  urlDatabase[req.params.id] = editLongURL;

  res.redirect('/urls');
});
//delete
app.post('/urls/:id/delete', (req, res) => {
  const urlID = req.params.id;
  delete urlDatabase[urlID];
  res.redirect('/urls');
});
//register
app.get("/register", (req, res) => {
  const templateVars = {
  username: req.cookies["username"], 
  urls: urlDatabase 
  };
  res.render('urls_register', templateVars);
});
//cookie
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});
app.post('/logout', (req, res) => { 
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});


//LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});