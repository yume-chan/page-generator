var log4js = require('log4js');

log4js.loadAppender("dateFile");
log4js.addAppender(log4js.appenderMakers['dateFile']({  
    filename:"/home/u1/logs/wechatjr.log",  
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
            addr:'192.168.18.197',
            port:5526
        },
        mcapp:{
            addr:'192.168.18.198',
            port:5520
        }
    },
    uploadHost: {
        url: "http://adtp.cnaidai.com:881"
    },
    html:{
        
    }
}