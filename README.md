BOOK-KEEPER 📖
A simple web-app to track book you've read and you want to read.

FEATURES
Feature 1: User Authorization
Feature 2: Search Any Books
Feature 3: Add Books to Read, Add Books As Read
Feature 4: Mark Books as Read
Feature 5: Delete Read Books
Feature 6: Simple and Easy to use UI

Demo
https://book-keeper-pdgh.onrender.com/

🛠️ Tech Stack/Built with
👉 HTML5, CSS3, JavaScript
👉 Postgres - Supabase
👉 EJS
👉 Node.js, Express
👉 OpenLibrary API

🗃️ Project Structure
Project Name/
|
|--public
    |--.jpgs, .css, .html files
|--view
    |-- .ejs files
|--index.js
|--package-lock.json, package.json
|-- .env

Note: .env file should containt DB_KEY (Database key) and SESSION_KEY (Express-session key).

🔧🔧🔧 Installation

1. Clone git repository (git clone https://github.com/yuleshmahatkazuto/Book-Keeper.git)
2. Navigate to project folder (cd project-name)
3. Create .env file with DB_KEY and DB_SESSION in it.
4. Create a database in Supabase
  a. Name database BookKeeper to match with code files.
  b. Create users table with id and username field.
  c. create books_to_read table with bookid, userid, name, url where userid is foreign key referencing id on users table.
  d. create read_books table with bookid, userid, name, url where userid is foreign key referencing id on users table.
  e. create user_credentials table with id, password where id is foreign key referencing id on users table.
6. Install dependencies (npm install) and run index.js (npm run dev)
7. Signup - LogIn.
8. Enjoy the web-app.

💡 Usage
👉 After successful LogIn, use the search bar to search for books
👉 Use the add to read button to add to ToRead field and add as read to add to Read field.
👉 Use the Mark as Read button to mark the ToRead books.
👉 Use the delete button to delete Read books.
👉 Use the LogOut to button to end your user session.

📸 Screenshots
![search](https://github.com/user-attachments/assets/bda26bb0-a233-4255-902f-067063d44701)
![homepage](https://github.com/user-attachments/assets/b922146c-e0aa-4018-b1da-8d6eb0d5d1fb)

👦 Author
Yulesh Mahat - https://github.com/yuleshmahatkazuto
LinkedIn - www.linkedin.com/in/yulesh-mahat-a94621308

📃 License
This project is licensed under the MIT license - feel free to modify, add new features and use.



