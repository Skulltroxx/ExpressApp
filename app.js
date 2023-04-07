const express = require('express')
const mongoose = require('mongoose')
const User = require('./models/users')
const session = require('express-session')
const bcrypt = require('bcrypt')
require('dotenv').config()

const dbUser = process.env.DATABASE_USER
const dbPassword = process.env.DATABASE_PASSWORD
const dbCluster = process.env.DATABASE_CLUSTER
const app = express()
const port = 3000

app.use(express.static('sukoon'))
app.use('/css', express.static(__dirname+'/css'))
app.use('/js', express.static(__dirname+'/js'))
app.use('/images', express.static(__dirname+'/images'))
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs')
app.set('views', __dirname + "\\html")

//Connecting to Database
const mongoURL = `mongodb+srv://${dbUser}:${dbPassword}@${dbCluster}.kplaixv.mongodb.net/node-tuts?retryWrites=true&w=majority`
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((result) => {
    app.listen(3000, () => console.log(`Listening on port ${port}`));
}).catch((err) => {
    console.log(err);
});

//Routing
app.get('/', (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\index.html',);
    }else{
        res.render('index');
    }
})

app.post('/', async (req, res) => {
    const { username, password } = req.body;
    // validate user credentials
    try {
        // Find the user in the database
        const user = await User.findOne({ username });
    
        if (!user) {
          return res.redirect('/login?errlog=true');
        }
        
        bcrypt.compare(password, user.password, (err, result) => {
            if(err){
                console.log('Error checking password:', err);
                return res.status(500).redirect('/login?errlog=true');
            }

            if(!result){
                return res.redirect('/login?errlog=true');
            }
        });
    
        // Set the user data in the session and redirect to the home page
        req.session.user = { username: user.username, email: user.email };
        return res.redirect('/');
      } catch (error) {
        console.log('Error finding user:', error);
        return res.status(500).send('Internal server error');
      }
})

app.get('/register', (req, res) => {
    const message = req.query.unregistered ? "Username already exists" : "";
    res.render('register', { message });
});

app.post('/register', (req, res) => {
    const {username} = req.body;

    User.findOne({ username }).then(async (user) => {
        if(user){
            res.redirect('/register?unregistered=true');
        }else{
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const new_user = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword
            });

            new_user.save()
            .then((result) => {
                res.redirect('/login?registered=true');
            })
            .catch((err) => {
                console.log(err);
            });
        }
    });
})

app.get('/login', (req, res) => {
    let message = req.query.registered ? "User registered successfully!" : "";
    if(!message){
        message = req.query.errlog ? "Incorrect Username or Password!" : "";
    }
    res.render('login', { message });
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err){
            console.log(err);
        }else{
            res.redirect('/');
        }
    })
})

app.get('/profile', async (req, res) => {
    try{
        var sesh = req.session.user;
        const user = await User.findOne({username: sesh.username});
    
        res.render('profile', {user});
    }catch(err){
        return res.status(404).render("404", {message: "No User"});
    }
})

app.post('/profile', async(req, res) => {
    var user = {};
    if(req.body.podcast_url){
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $pull: { fav_podcasts: req.body.podcast_url }},
            { new: true},
            );
        
        return res.render('profile', {user: {username: user.username, email: user.email, fav_music_playlist: user.fav_music_playlist, fav_podcasts: user.fav_podcasts, fav_videos: user.fav_videos}});
    }

    if(req.body.playlist_url){
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $pull: { fav_music_playlist: req.body.playlist_url }},
            { new: true},
            );
        return res.render('profile', {user: {username: user.username, email: user.email, fav_music_playlist: user.fav_music_playlist, fav_podcasts: user.fav_podcasts, fav_videos: user.fav_videos}});
    }

    if(req.body.video_url){
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $pull: { fav_videos: req.body.video_url }},
            { new: true},
            );
        return res.render('profile', {user: {username: user.username, email: user.email, fav_music_playlist: user.fav_music_playlist, fav_podcasts: user.fav_podcasts, fav_videos: user.fav_videos}});
    }
    
})

app.get('/contact', (req, res) => {
    res.render('contact');
})

app.get('/audio', async (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\audioTherapy.html',);
    }else{
        const user = await User.findOne({username: req.session.user.username});
        res.render('audioTherapy', {user});
    }
})

app.post('/audio', async (req, res) => {
    var user = {}
    try{
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $push: { fav_music_playlist: req.body.playlist_url }},
            { new: true},
            );
    }catch(err){
    }

    try{
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $push: { fav_podcasts: req.body.podcast_url }},
            { new: true},
            );
    }catch(err){
        
    }
    res.render('audioTherapy', {user: {username: user.username, email: user.email, fav_music_playlist: user.fav_music_playlist, fav_podcasts: user.fav_podcasts, fav_videos: user.fav_videos}});
})

app.get('/yoga', async (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\yogaTherapy.html',);
    }else{
        const user = await User.findOne({username: req.session.user.username});
        res.render('yogaTherapy', {user});
    }
})

app.post('/yoga', async (req, res) => {
    var user = {};
    try{
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $push: { fav_videos: req.body.video_url }},
            { new: true},
            );
        res.render('yogaTherapy', {user})
    }catch(err){
    }
})

app.get('/laugh', async (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\laughTherapy.html',);
    }else{
        const user = await User.findOne({username: req.session.user.username});
        res.render('laughTherapy', {user});
    }
})

app.post('/laugh', async (req, res) => {
    var user = {};
    try{
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $push: { fav_videos: req.body.video_url }},
            { new: true},
            );
        res.render('laughTherapy', {user})
    }catch(err){
    }
})

app.get('/talking', (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\talkingTherapy.html',);
    }else{
        res.render('talkingTherapy');
    }
})

app.get('/spirituality', async (req, res) => {
    if(!req.session.user){
        res.sendFile(__dirname + '\\html\\spirituality.html',);
    }else{
        const user = await User.findOne({username: req.session.user.username});
        res.render('spirituality', {user});
    }
})

app.post('/spirituality', async (req, res) => {
    var user = {};
    try{
        user = await User.findOneAndUpdate(
            {username: req.session.user.username},
            { $push: { fav_videos: req.body.video_url }},
            { new: true},
            );
        res.render('spirituality', {user})
    }catch(err){
    }
})

app.use((req, res) => {
    res.status(404).render('404', {message: ""});
})