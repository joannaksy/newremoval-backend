var express = require("express");
var nodemailer = require('nodemailer');
var inlineBase64 = require('nodemailer-plugin-inline-base64');

require("dotenv").config();

var router = express.Router();


let transporter = nodemailer.createTransport({
    service: "Hotmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.WORD,
    },
});

transporter.use('compile', inlineBase64({cidPrefix: 'somePrefix_'}));

const emailSubject=(e)=>{
    let subject = "";
    if(e.QuoteType){
        subject = `[${e.Language}] 網上報價`
    }else{
        subject = `[${e.Language}] 上門報價`
    }
    return subject;
}

const emailMessage=(e)=>{
    let message = '';
    let serviceType = '';
    let itemMsg = '';
    let enddate ='';
    let moveto ='';
    

    if(e.ServiceType){
        serviceType = '搬運';
        moveto =`<p>至${e.DropPoint}</p> <p>${dropDes}</p>`;

        if(e.Storage)
            serviceType += '+ 存倉';
            enddate = ` (如存倉, 至日期: ${e.EndDate} )`;
    }else{
        serviceType='存倉';
        enddate = ` (如存倉, 至日期: ${e.EndDate} )`;
    }
    let movingType = '';
    if(e.MovingType){
        movingType='搬屋';
    }else{
        movingType='搬寫字樓';
    }

    let pickDes = '';
    if (e.PickStair)
        pickDes += '* 沒有電梯 ';
    if (e.PickPlatform)
        pickDes += '* 需經平台或樓梯轉電梯 ';
    if (e.PickFar)
        pickDes += '* 停車位置距離太遠(50米) ';

    let dropDes = '';
    if (e.DropStair)
        dropDes += '* 沒有電梯 ';
    if (e.DropPlatform)
        dropDes += '* 需經平台或樓梯轉電梯 ';
    if (e.DropFar)
        dropDes += '* 停車位置距離太遠(50米) ';

    message = 
    `<p>稱謂: ${e.Title} </p>
    <p>姓氏: ${e.Name} </p>
    <p>電話:${e.Phone} </p>
    <P>電郵: ${e.Email}</p>
    <p>服務種類: ${serviceType}</p> 
    <p>搬運類型: ${movingType}</p>
    <p>搬運日期: ${e.StartDate}  ${enddate}</p> 
    <p>時間: ${e.TimeSlot}</p>
    <p>搬運地區:</p>
    <p>由${e.PickPoint}</p> <p>${pickDes}</p>
    ${moveto}`;

    if(e.QuoteType)
    {
        
        let kitchens = e.Kitchens.filter(function (f){
            return f.amount > 0;
        })
        let offices = e.Offices.filter(function (f){
            return f.amount > 0;
        })
        let bedrooms = e.Bedrooms.filter(function (f){
            return f.amount > 0;
        })
        let livingrooms = e.Livingrooms.filter(function (f){
            return f.amount > 0;
        })
        if (livingrooms.length>0){
            itemMsg += '<p>客廳</p>'
            for(n in livingrooms){
                itemMsg += `<li><p> ${n.item} : ${n.amount}<p> </li>`
            }
        }
        if (bedrooms.length>0){
            itemMsg += '<p>臥房</p>'
            for(n in bedrooms){
                itemMsg += `<li><p> ${n.item} : ${n.amount}<p> </li>`
            }
        }

        if (kitchens.length>0){
            itemMsg += '<p>廚房</p>'
            for(n in kitchens){
                itemMsg += `<li><p> ${n.item} : ${n.amount}<p> </li>`
            }
        }
        if (offices.length>0){
            itemMsg += '<p>辦公室</p>'
            for(n in offices){
                itemMsg += `<li><p> ${n.item} : ${n.amount}<p> </li>`
            }
        }
       
        
        itemMsg = ``;
    }
        
    
    if(e.Files.length > 0){
        itemMsg += '<strong>相片附件 : </strong><br>'
        e.Files.map(f => {
            itemMsg += `<img src=${f.path} width='200px'/>`;
        })
    }

    message += itemMsg;
    return message;
}

router.post("/", function(req, res, next) {
    console.log(req.body);

    let mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: emailSubject(req.body),
        html: emailMessage(req.body)
    };

    transporter.verify((err, success) => {
        err
          ? res.send(err)
          : transporter.sendMail(mailOptions, function (err, data) {
            if (err) {
              res.send(err);
            } else {
                res.send("Email sent successfully");
            }
           });
       });
});


router.get('/send', function(req, res, next) {
    res.send('respond with a resource');
  });

module.exports = router;