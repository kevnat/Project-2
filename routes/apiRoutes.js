var db = require("../models");
var bcrypt = require("bcrypt");

module.exports = function(app) {
  app.post("/login", function(req, res) {
    if (req.body.email === "") {
      return res.json({
        success: false,
        message: "Please enter an email address!"
      });
    }
    
    if (req.body.password === "") {
      return res.json({
        success: false,
        message: "Please enter an password!"
      });
    }
    
    db.User.findOne({
      where: {
        email: req.body.email
      }
    }).then(function(user) {
      if (!user) {
        return res.json({
          success: false,
          message: "User not found!"
        });
      }

      bcrypt.compare(req.body.password, user.password, function(err, success) {
        if (success) {
          req.session.userId = user.id;
          return res.json({
            success: true,
            message: "User Found!"
          });
        } else {
          return res.json({
            success: false,
            message: "Invalid Password!"
          });
        }
      });
    });
  });

  app.post("/signup", function(req, res) {
    db.User.findOne({
      where: {
        email: req.body.email
      }
    }).then(function(user) {
      if (user) {
        return res.json({
          success: false,
          message: "Email already used!"
        });
      }

      bcrypt.hash(req.body.password, 10, function(err, hash) {
        db.User.create({
          email: req.body.email,
          password: hash
        }).then(function(user) {
          req.session.userId = user.id;

          return res.json({
            success: true,
            message: "User created!"
          });
        });
      });
    });
  });


  // app.post('http://localhost:3000/result', function (req, res) {
  //     // let input = JSON.stringify(req.body.items)
  //     // input.isbn = (req.body.items[0].volumeInfo.industryIdentifiers[0].identifier);
  //     // input.title = (req.body.items[0].volumeInfo.title);
  //   console.log(req.body)


  

  app.post("/api/newbook", function (req,res){
    console.log("on server");
    
    let currentUser = db.User.findById(req.session.userId);
    
    let newBook = db.Book.create({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.authors,
      purchase_link: req.body.link,
      price: req.body.price,
      average_rating: req.body.rating, 
      description: req.body.description,
      page_count: req.body.page_count,
      image_link: req.body.image
    });


    return Promise.all([
      newBook, 
      currentUser
    ])
    .then(function([book, user]) {
      console.log("--");
      console.log("here");
      
      user.addBook(book).then(function() {
        console.log(book); 
        console.log("======");
        res.send({book, user});
      });
    })
    .catch(function(err){
      console.log(err);
    })
  });



  app.get("/api/books", function(req, res) {

    let currentUser = req.session.userId;

    // console.log(currentUser);

    db.Book.findAll({
      //
      include: [{
        model: db.User, 
        where: {id: currentUser}
      }]
    }).then(function(dbBooks) {
      res.json(dbBooks);
    }).catch(function(err){
      console.log(err); 
      res.json(err);
    })
  });

  


//change '1' parameter to :bookId

app.put("/api/books/:current", function(req,res){
  let book = req.params.current; 
  
    db.Book.update(
      { current_book: "true" },
      { where: {id: book} }
    ).then(function(book){
      res.json(book);
    })
    .catch(function(err){
      console.log(err);
    })
    return book;
  });
  

  app.get("/api/books/regimen", function(req, res) {
    let currentUser = req.session.userId;
    let myBook = db.Book.findOne({
      where: {title: req.body.book.title }
    });
    let regimen = db.Regimen.create({
      page_count: req.body.book.page_count,
      current_page: req.body.book.current_page, 
      start_date: req.body.book.start_date,
      end_date: req.body.book.end_date,
      userId: currentUser,
      bookId: myBook
    });
    
    return Promise.all([
      myBook, 
      regimen
    ])
    .then(function([myBook, regimen]) {
      console.log(myBook);
      console.log(regimen);
      res.send({book, regimen});
    })
    .catch(function(err){
      console.log(err);
    })
  });



  app.delete("/api/books/:id", function(req, res) {
    // We just have to specify which todo we want to destroy with "where"
    db.Book.destroy({
      where: {
        id: req.params.id
      }
    }).then(function(dbBook) {
      res.json(dbBook);
    });
  });
}
