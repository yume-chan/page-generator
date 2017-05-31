/*@auth fwh 2016.11*/
;var geoLocation = (function($,baseModel,util,BMap){
    var GeoLocation = function(options) {
        options = options || {};
        this.initialize(options);
        // var _that = this;
    };
    $.extend(GeoLocation.prototype, {
        initialize: function() {},
        getLocation: function(){
            if (navigator.geolocation){
                navigator.geolocation.getCurrentPosition(this.showPosition,this.showError);
                //console.log(navigator.geolocation);
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        },
        showPosition: function(position){
            var lat = position.coords.latitude,
                lng = position.coords.longitude;
                var distance = 0;
            if(localStorage.coord_latitude!=undefined&&localStorage.coord_longitude!=undefined){
                distance = geoLocation.getDistance(lat,lng,localStorage.coord_latitude,localStorage.coord_longitude);
                if(true||distance>=10){
                    geoLocation.recordPosition(lat,lng,distance);
                }
            } else {
                geoLocation.recordPosition(lat,lng,distance);
            }
            localStorage.coord_latitude = lat;
            localStorage.coord_longitude = lng;
        },
        showError: function(error){
            switch(error.code) {
                case error.PERMISSION_DENIED:
                //alert("用户拒绝对获取地理位置的请求。");
                break;
                case error.POSITION_UNAVAILABLE:
                //alert("位置信息是不可用的。");
                break;
                case error.TIMEOUT:
                //alert("请求用户地理位置超时。");
                break;
                case error.UNKNOWN_ERROR:
                //alert("未知错误。");
                break;
            }
        },
        /**
        * @desc 根据两点间的经纬度计算距离
        * @param float lat 纬度值
        * @param float lng 经度值
        */
        getDistance: function(lat1, lng1, lat2, lng2){
            var earthRadius = 6367000;//单位米
            lat1 = (lat1 * Math.PI ) / 180;
            lng1 = (lng1 * Math.PI ) / 180;

            lat2 = (lat2 * Math.PI ) / 180;
            lng2 = (lng2 * Math.PI ) / 180;

            var calcLongitude = lng2 - lng1;
            var calcLatitude = lat2 - lat1;
            var stepOne = Math.pow(Math.sin(calcLatitude / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(calcLongitude / 2), 2);
            var stepTwo = 2 * Math.asin(Math.min(1, Math.sqrt(stepOne)));
            var calculatedDistance = earthRadius * stepTwo;

            return Math.round(calculatedDistance);
        },
        recordPosition: function(lat, lng, distance){
            //var str = "GPS Last Location: latitude="+localStorage.coord_latitude+", longitude="+localStorage.coord_longitude+
                "\nCurrent Location: latitude="+lat+", longitude="+lng+",\nDistance:"+distance;  
            //alert(str);

            var ggPoint = new BMap.Point(lng,lat);
            var convertor = new BMap.Convertor();
            var pointArr = [];
            pointArr.push(ggPoint);
            convertor.translate(pointArr, 1, 5, function (data){
                if(data.status === 0) {
                    var latitude = data.points[0].lat,
                        longitude = data.points[0].lng;
                    var ua = util.uaDetect();
                    var deviceSource = ua=="android"?0:ua=="ios"?1:"";
                    //alert("param BAIDU latitude="+latitude+", longitude="+longitude+", deviceSource="+deviceSource);
                    baseModel.get({
                        url:"/wechatjr/datasvr/cmn/locate.cgi",
                        data:{latitude:latitude,longitude:longitude,deviceSource:deviceSource},
                        success:function(rslt){
                            //alert(rslt.message);
                            console.log("success");
                        },
                        error:function(rslt){
                            console.log("error");        
                        }
                    });
                }
            });
        }
    });
    var geoLocation = new GeoLocation();
    window.geoLocation = geoLocation;
    return geoLocation;
})($,baseModel,util,BMap);
