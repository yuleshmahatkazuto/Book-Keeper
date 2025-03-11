import bodyParser from "body-parser";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from 'dotenv';
import axios from "axios";
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({path: `${__dirname}/.env`});
const {Pool} = pkg;
const pool = new Pool({
  host: 'db.huhgmqnydeprtsqqwvfn.supabase.co',
  port: 5432,
  database: 'BookKeeper',
  user: 'postgres',
  password: 'Yulrubis@58',
  ssl: { rejectUnauthorized: false }
});
const supabaseUrl = 'https://huhgmqnydeprtsqqwvfn.supabase.co'
const supabaseKey = process.env.DB_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)


app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


let currentUser = 1;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/home", async (req, res) => {
  const [readbooks, toReadBooks] = await getBooks();
  res.render("index.ejs", {
    readBooks: readbooks,
    toReadBooks: toReadBooks
  }); 
});

app.delete("/delete-book", async(req, res) => {
  const bookId = req.body.bookId;
  console.log(bookId);
  await supabase
    .from('read_books')
    .delete()
    .eq('bookid', bookId);
  res.status(200).json({ message: "Book deleted successfully" });
});

app.post("/mark-read", async(req, res) => {
  console.log("mark-read route was triggered");
  const bookId = req.body.bookId;
  console.log(bookId);
  const result = await pool.query("SELECT from books_to_read(name, url WHERE bookid=$1", [bookId]);
  const name = result.rows[0].name;
  const url = result.rows[0].url; 
  console.log(name, url);
  await pool.query("INSERT INTO read_books(userid, name, url) VALUES($1, $2, $3)", [currentUser, name, url]);
  await pool.query("DELETE FROM books_to_read WHERE bookid=$1", [bookId]);
  res.status(200).json({ message: "Book marked as read!"});  
})

app.post("/login", async (req, res) => {  
  const username = req.body.username;
  const password = req.body.password;
  const result = await pool.query(`SELECT id, username, password FROM users u JOIN user_credentials uc ON u.id = uc.id 
    WHERE username = $1
  `, [username]
  );
  if (result.rows[0].username === username && result.rows[0].password === password){
    currentUser = result.rows[0].id;
    console.log(currentUser);
    res.redirect("/home");
  } else{
    res.status(400).json({error: "The username and password didn't match our records!"});
  }
  
});

app.post("/signup", async(req, res) => {
  const username = req.body.username;
  const password1 = req.body.password1;
  const password2 = req.body.password2;
  try{
    if(password1 === password2) {
      const result = await pool.query("INSERT INTO users (username) VALUES ($1) RETURNING id", [username]);
      const user_id = result.rows[0].id;
      await pool.query("INSERT INTO user_credentials (id, password) VALUES ($1, $2)", [user_id, password1]);
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
  await pool.query(`
    INSERT INTO books_to_read (userid, name, URL) VALUES ($1, $2, $3) 
    `, [currentUser, name, URL]);
  res.redirect("/home");  
});

app.post("/addBIR", async(req,res) => {
  const name = req.body.bookIveRead;
  const URL = req.body.URL;
  await pool.query(`
    INSERT INTO read_books (userid, name, URL) VALUES ($1, $2, $3) 
    `, [currentUser, name, URL]);
  res.redirect("/home");  
});

app.listen(port, () =>  {
  console.log(`Your app is running on port ${port}`);
});

async function getBooks(){
  const readbooks = await pool.query("SELECT bookid, name, URL FROM read_books WHERE userid = $1", [currentUser]);
  const toreadbooks = await pool.query("SELECT bookid, name, URL FROM books_to_read WHERE userid = $1", [currentUser]);
  return [readbooks.rows, toreadbooks.rows];
}

app.post("/search", async(req, res) => {
  const searchText = req.body.search;
  const result = await axios.get(`https://openlibrary.org/search?q=${searchText}&sorts="rating"`, {
    timeout: 10000,
  });
  const booknames = [];
  for(let i=0; i<12;i++){
    booknames.push(result.data.docs[i]);
  } 
  res.render("search.ejs", {books: booknames, search: searchText});
});