import bodyParser from "body-parser";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from 'dotenv';
import axios from "axios";
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({path: `${__dirname}/.env`});

const supabaseUrl = 'https://huhgmqnydeprtsqqwvfn.supabase.co'
const supabaseKey = process.env.DB_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)


app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_KEY, // A secret key to sign the session ID cookie
    resave: false,              // Don't resave session if it hasn't changed
    saveUninitialized: true,    // Save session even if it's uninitialized
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60
    }   // Set secure: true if using https SET TRUE when production
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/home", async (req, res) => {
  if(req.session.currentUser){
    const [readbooks, toReadBooks] = await getBooks(req.session.currentUser);
    res.render("index.ejs", {
      readBooks: readbooks || [],
      toReadBooks: toReadBooks || [],
      name: req.session.username
    }); 
  } else {
    res.redirect("/");
  }
});

app.delete("/delete-book", async(req, res) => {
  const bookId = req.body.bookId;
  console.log(bookId + "The delete route was triggered.");
  await supabase
    .from('read_books')
    .delete()
    .eq('bookid', bookId);
  res.status(200).json({ message: "Book deleted successfully" });
});

app.post("/mark-read", async(req, res) => {
  console.log("mark-read route was triggered");
  const bookId = req.body.bookId;
  const result = await supabase
    .from('books_to_read')
    .select('name, url')
    .eq('bookid', bookId);
  const name = result.data[0].name;
  const url = result.data[0].url; 
  await supabase
    .from('read_books')
    .insert([{userid: req.session.currentUser, name: name, url: url}]);
  await supabase
    .from('books_to_read')
    .delete()
    .eq('bookid', bookId);
  res.status(200).json({message: "Successfully marked as read!"});
});

app.post("/login", async (req, res) => { 
  console.log("this route was successfully hit");
  const username = req.body.username;
  const password = req.body.password;
  try{
    const result = await supabase
      .from('users')
      .select('id, username, user_credentials(password)')
      .eq('username', username);
    if(!result.data || result.data.length === 0){
      return res.status(400).json({error: "The username and password didn't match our records!"});
    }
    if (result.data[0].username === username && result.data[0].user_credentials.password === password){
      console.log("Username from database: " + result.data[0].username );
      console.log("UserId from database: " + result.data[0].id );
      console.log("Session current User: " + req.session.currentUser);
      console.log("Session username: " + req.session.username);
      req.session.currentUser = result.data[0].id;
      req.session.username = username;
      return res.redirect("/home");
    }
  } catch(error){
    return res.status(400).json({error: "Something else went wrong!"});
  } 
  
});

app.post("/logout", (req,res) => {
  req.session.destroy((err) => {
    if(err) {
      console.log(err);
      return res.status(500).send("logout failed!");
    }
    res.clearCookie('connect.sid');
    res.redirect("/");
  })
})

app.post("/signup", async(req, res) => {
  const username = req.body.username;
  const password1 = req.body.password1;
  const password2 = req.body.password2;
  try{
    if(password1 === password2) {
      const result = await supabase
        .from('users')
        .insert([{ username: username }])
        .select('id');
      const user_id = result.data[0].id;
      await supabase
        .from('user_credentials')
        .insert([{id: user_id, password: password1}]);
      res.redirect("/");
    } else {
      res.status(400).json({message: "The password didn't match"});
    }
  } catch(error){
    console.error("Error with database", error);
    res.redirect("/");
  }   
});

app.post("/addBTR", async(req,res) => {
  const name = req.body.bookToRead;
  const URL = req.body.URL;
  const {data, error} = await supabase
    .from('books_to_read')
    .insert([{userid: req.session.currentUser,name:name, url: URL}]);
  if(error){
    console.error(error);
  }
  res.redirect("/home");  
});

app.post("/addBIR", async(req,res) => {
  const name = req.body.bookIveRead;
  const URL = req.body.URL;
  await supabase
    .from('read_books')
    .insert([{userid: req.session.currentUser, name: name, url: URL}]);
  res.redirect("/home");  
});

app.listen(port, () =>  {
  console.log(`Your app is running on port ${port}`);
});

async function getBooks(userId){
  
  const readbooks = await supabase
    .from('read_books')
    .select('bookid, name, url')
    .eq('userid', userId);
  const toreadbooks = await supabase
    .from('books_to_read')
    .select('bookid, name, url') 
    .eq('userid', userId);
  return [readbooks.data, toreadbooks.data];
}

app.post("/search", async(req, res) => {
  if(req.session.currentUser){
    const searchText = req.body.search;
    const result = await axios.get(`https://openlibrary.org/search?q=${searchText}&sorts="rating"`, {
      timeout: 10000,
    });
    const booknames = [];
    for(let i=0; i<12;i++){
      if(result.data.docs[i]){
        booknames.push(result.data.docs[i]);
      }
    }
    res.render("search.ejs", {books: booknames, search: searchText});
  } else {
    res.redirect("/");
  }
  
});