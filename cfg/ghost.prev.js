var log4js = require('log4js');

log4js.loadAppender("dateFile");
log4js.addAppender(log4js.appenderMakers['dateFile']({  
    filename:"/home/u1/logs/wechatjr/wechatjr.log",  
    pattern: '.yyyy-MM-dd',alwaysIncludePattern: true,  
    layout: {
        type: 'pattern',
        pattern: '[%d %p %c] %m%n'
    }  
}), 'wechatjr');

module.exports = {
    getLogger:function() {
        return log4js.getLogger('wechatjr');
    },
    dscm:{
        loanbusiness:{
            addr:'192.168.100.52',
            port:5526
        },
        mcapp:{
            addr:'192.168.100.56',
            port:5519
        }
    },
    uploadHost: {
        url: "http://adtp.cnaidai.com"
    },
    html:{
        
    }
}