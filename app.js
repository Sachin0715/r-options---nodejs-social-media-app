
const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", function (req, res) {
    res.render("index");
});
app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/login", (req, res) => {
    
    res.render("login");
});

app.get("/profile", isLoggedIn, async(req, res) => {
    let user = await userModel.findOne({email:req.user.email});
  await user.populate("posts");
    res.render("profile",{user});
});

app.get("/like/:id", isLoggedIn, async(req, res) => {
    let post = await postModel.findOne({_id: req.params.id});
  await post.populate("user");

  if(post.likes.indexOf(req.user.userid)=== -1){
     post.likes.push(req.user.userid);
  }
  else{
  post.likes.splice(post.likes.indexOf(req.user.userid),1);
}
 await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn, async(req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user"); 
 
    res.render("edit",{post});
});


app.post("/update/:id", isLoggedIn, async(req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content}); 
 
    res.redirect("/profile");
});

app.post("/post", isLoggedIn, async(req, res) => {
    let user = await userModel.findOne({email:req.user.email});
    let {content}= req.body;
     let  post = await postModel.create({
        user: user._id,
        content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

});

app.post("/register", async (req, res) => {
    let { email, password, username, age, name } = req.body;

    let user = await userModel.findOne({ email });

    if (user) {
        return res.status(500).send("user already register");
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log("Register password:", password);
console.log("Register hash:", hash);

            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign(
                {
                    email: email,
                    userid: user._id
                },
                "sachin"
            );

            res.cookie("token", token);
            res.send("register");
        });
    });
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;

    console.log("Email:", email);
    console.log("Password:", password);

    let user = await userModel.findOne({ email });
    console.log("User:",user);
    

    if (!user) {
        return res.send("something went wrong");
    }

    bcrypt.compare(password, user.password, function (err, result) {

        console.log("Password Match:", result);

        if (result) {

            let token = jwt.sign(
                {
                    email: email,
                    userid: user._id
                },
                "sachin"
            );

            res.cookie("token", token);
            res.redirect("/profile");

        } else {
            res.send("wrong password");
        }
    });
});

app.get("/logout", async (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    console.log("Cookie:",req.cookies.token)

    if (!req.cookies.token) {
        return res.redirect("/login");
    }
try{
    let data = jwt.verify(req.cookies.token, "sachin");
console.log("Token data:",data);
    req.user = data;

    next();
}
catch (err){
    console.log("JWT ERROR:",err);
    return res.send("JWT error");
}
}

app.listen(3000, function () {
    console.log("sachin");
});

