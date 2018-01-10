var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var moment = require('moment');

var jwt = require('jsonwebtoken');
var app = express();

var config = require('./helpers/config');

var Driver = require('./models/driver');
var sendMail = require('./helpers/send-mail');

var mongoose = require('mongoose');

mongoose.connect(config.database, {useMongoClient: true});

app.set('port', (process.env.PORT || 5000));

app.use(cors({credentials: true, origin: true, preflightContinue: true}));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(morgan('dev'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('superSecret', config.superSecret);

var apiRouters = express.Router();
var openApiRouters = express.Router();

apiRouters.post('/login', (req, res) => {
  var body = req.body;
  var username = body.username;
  var password = body.password;

  if (username === 'admin' && password === 'admin') {
    var expiredTime = 60*60*24*3;  // seconds
    var user = {
      username,
      password
    }

    var generatedTime = moment().valueOf();

    var token = jwt.sign(user, app.get('superSecret'), { expiresIn: expiredTime });
    res.json({
      success: 1,
      message: 'Đăng nhập thành công',
      user,
      token: {token, generatedTime, expiredTime}
    });
  } else {
    res.json({success: 0, message: 'Sai mật khẩu'});
  }
});

// apiRouters.use((req, res, next) => {
//     if (req.method === 'OPTIONS') {
//         console.log('!OPTIONS');
//         var headers = {};
//         // IE8 does not allow domains to be specified, just the *
//         // headers["Access-Control-Allow-Origin"] = req.headers.origin;
//         headers["Access-Control-Allow-Origin"] = "*";
//         headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
//         headers["Access-Control-Allow-Credentials"] = false;
//         headers["Access-Control-Max-Age"] = '86400'; // 24 hours
//         headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, x-access-token";
//         res.writeHead(200, headers);
//         res.end();
//   } else {
//     const token = req.body.token || req.query.token || req.headers['x-access-token'];
//     if (!token) {
//       res.json({success: 0, message: "Token not provided"})
//     } else {
//       jwt.verify(token, app.get('superSecret'), (err, decoded) => {
//         if (err) {
//           res.json({success: 0, message: "Couldnt understand token. ", err: err});
//         } else {
//           req.user = decoded._doc;
//           next();
//         }
//       });
//     }
//   }
// });

openApiRouters.get('/driver', (req, res) => {
  Driver.find({}, (err, drivers) => {
    if (err) {
      res.json({success: 0, message: 'unable to fetch drivers data'});
    } else {
      res.json({success: 1, message: 'Get data ok', results: drivers});
    }
  })
});

openApiRouters.get('/approve/:driverId', (req, res) => {
  var driverId = req.params.driverId;
  Driver.findOne({"_id": driverId}, (err, foundDriver) => {
    if (err) {
      res.json({success: 0, message: "Unable to find drive"});
    } else if (!foundDriver) {
      res.json({success: 0, message: "Driver not found"});
    } else {
      /////////////////////////////////////////
      // get admin mail infos

      adminInfos = {
        email: 'vietcabteam@gmail.com',
        password: 'vietcabteam2018'
      };

      // send instructor payroll via gmail
      sendMail.send(adminInfos, foundDriver, (err, info) => {
        if (err) {
          res.json({success: 0, message: 'Unable to send email'});
        } else {
          Driver.update({
             _id: driverId
           }, {
             $set: { 'approval': true }
           }, (err) => {
             if (err) {
               console.log('Unable to update driver info');
             } else {
               console.log('Update driver info successfully');
             }
           });
          res.json({success: 1, message: 'Mail sent successfully', driver: foundDriver});
        }
      });
      /////////////////////////////////////////
    }
  });
});

openApiRouters.post('/driver', (req, res) => {
  var body = req.body;
  var name = body.name;
  var phoneNumber = body.phoneNumber;
  var email = body.email;
  var city = body.city;
  var recommender = body.recommender;
  var code = body.code;
  var approval = false;

  var searchName = name;
  searchName= searchName.toLowerCase();
  searchName= searchName.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
  searchName= searchName.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
  searchName= searchName.replace(/ì|í|ị|ỉ|ĩ/g,"i");
  searchName= searchName.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
  searchName= searchName.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
  searchName= searchName.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
  searchName= searchName.replace(/đ/g,"d");
  searchName= searchName.replace(/!|@|\$|%|\^|\*|∣|\+|\=|\<|\>|\?|\/|,|\.|\:|\'|\"|\&|\#|\[|\]|~/g,"-");
  searchName= searchName.replace(/-+-/g,"-"); //thay thế 2- thành 1-
  searchName= searchName.replace(/^\-+|\-+$/g,"");//cắt bỏ ký tự - ở đầu và cuối chuỗi
  var image = body.image;

  var driver = new Driver({
    name,
    searchName,
    phoneNumber,
    email,
    city,
    recommender,
    code,
    approval
  });

  driver.save((err, savedDriver) => {
    if (err) {
      res.json({success: 0, message:" Unable to save data " + err});
    } else {
      res.json({success: 1, message:"Save ok", results: savedDriver});
    }
  });
});

app.use('/api', apiRouters);
app.use('/openapi', openApiRouters);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
