/**
 * Module dependencies.
 */

var express = require('express')
    , fs = require('fs')
    , mongoose = require('mongoose')
    , exec = require('child_process').exec
    , https = require('https');


var app = module.exports = express();

// Configuration

app.configure(function(){
    app.use(express.bodyParser({
        uploadDir: __dirname + '/../app/tmp',
        keepExtensions: true
    }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/../app'));

    // Copy the schemas to somewhere they can be served
    exec('cp '+__dirname+'/../server/models/* '+__dirname+'/../app/code/',
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('Error copying models : ' + error + ' (Code = ' + error.code + '    ' + error.signal + ') : ' + stderr + ' : ' + stdout);
            }
        });
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    mongoose.connect('mongodb://localhost/forms-ng_dev');
});

app.configure('test', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    mongoose.connect('mongodb://localhost/forms-ng_test');

    var data_path = __dirname + '/../test/e2edata';
    var data_files = fs.readdirSync(data_path);
    data_files.forEach(function(file){
        var fname = data_path+'/'+file;
        if (fs.statSync(fname).isFile()) {
            exec('mongoimport --db forms-ng_test --drop --collection '+ file.slice(0,1)+'s --jsonArray < ' + fname,
                function (error, stdout, stderr) {
                    if (error !== null) {
                        console.log('Error importing models : ' + error + ' (Code = ' + error.code + '    ' + error.signal + ') : ' + stderr + ' : ' + stdout);
                    }
                });
        }
    });
});

app.configure('production', function(){
    console.log('Production mode');
    app.use(express.errorHandler());
    mongoose.connect(process.env['DEMODB']);
});

var ensureAuthenticated = function (req, res, next) {
    // Here you can do authentication using things like
    //      req.ip
    //      req.route
    //      req.url
    if (true) { return next(); }
    res.status(401).send('No Authentication Provided');
};

//// Bootstrap models
var DataFormHandler = new (require(__dirname + '/lib/data_form.js'))(app, {urlPrefix : '/api/'});
// Or if you want to do some form of authentication...
// var DataFormHandler = new (require(__dirname + '/lib/data_form.js'))(app, {urlPrefix : '/api/', authentication : ensureAuthenticated});

var models_path = __dirname + '/models';
var models_files = fs.readdirSync(models_path);
models_files.forEach(function(file){
    var fname = models_path+'/'+file;
    if (fs.statSync(fname).isFile()) {
        DataFormHandler.addResource(file.slice(0,-3), require(fname));
    }
});

var port;

port = process.env.PORT || 3001 ;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);
