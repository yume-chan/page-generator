;(function initScroller($,IScroll) {
	setTimeout(function(){
		var myScroll = new IScroll('#wrapper',{
			probeType:1,
			preventDefault:false,
			//scrollbars:true,
			updateFlag:false, //自定义属性， false 不刷新，true 刷新全部
			pageIndex:1,	//1开始
			pageSize:10
		});

		myScroll.on('scrollStart', function () {
			//console.log('scroll start');
		});
		
		myScroll.on('scroll', function () {
			//console.log('scroll');
			if(this.y>40){
				//console.log(this.y);
				this.options.updateFlag = true;
				$("#scroller > .pullDown").hide();
				$("#scroller > .msg").html("加载中...").show();
			} else {
				this.options.updateFlag = false;
			}
		});

		myScroll.on('scrollEnd', function () {
			//console.log("scroll ended");
			var _that=this;
			$("#scroller > .pullDown").show();
			$("#scroller > .msg").html("加载中...").hide();
			//如果下拉超过40px且位于页面顶部则刷新内容
			if(this.options.updateFlag==true&&this.y==0){
				initList();
				this.options.pageIndex=0;// 重置页数
				$("#scroller > .pullUp").html("上拉加载更多");
				this.refresh();
			}
			//如果已经到达底部则加载下一页
			if(this.y==this.maxScrollY){
				getPageList(++_that.options.pageIndex,_that.options.pageSize);
				this.refresh();
			}
		});
		initList();
	},100);
})($,IScroll);
// /*@auth fwh 2016.6*/
// ;setTimeout(function(){
// 	var myScroll = (function($,IScroll){
// 		var MyScroll = function(options) {
// 			options = options || {};
// 			this.initialize(options);
// 		};
// 		//MyScroll.prototype = IScroll;

// 		$.extend(MyScroll.prototype, {
// 			initialize: function(options) {
// 				var _options=$.extend({
// 					probeType:1,
// 					preventDefault:false,
// 					//scrollbars:true,
// 					updateFlag:false, //自定义属性， false 不刷新，true 刷新全部
// 					pageIndex:1,	//1开始
// 					pageSize:10
// 				},options);
// 				IScroll.call(this,'#wrapper',_options);
// 				// this.prototype = new IScroll('#wrapper',{
// 				// 	probeType:1,
// 				// 	preventDefault:false,
// 				// 	//scrollbars:true,
// 				// 	updateFlag:false, //自定义属性， false 不刷新，true 刷新全部
// 				// 	pageIndex:1,	//1开始
// 				// 	pageSize:10
// 				// });
// 				this.on('scrollStart', function () {
// 					console.log('scroll start');
// 				});
				
// 				this.on('scroll', function () {
// 					console.log('scroll');
// 					if(this.y>40){
// 						console.log(this.y);
// 						this.options.updateFlag = true;
// 						$("#scroller > .pullDown").hide();
// 						$("#scroller > .msg").html("加载中...").show();
// 					} else {
// 						this.options.updateFlag = false;
// 					}
// 				});

// 				this.on('scrollEnd', function () {
// 					console.log("scroll ended");
// 					var _that=this;
// 					$("#scroller > .pullDown").show();
// 					$("#scroller > .msg").html("加载中...").hide();
// 					//如果下拉超过40px且位于页面顶部则刷新内容
// 					if(this.options.updateFlag==true&&this.y==0){
// 						this.initList();
// 						this.options.pageIndex=0;// 重置页数
// 						$("#scroller > .pullUp").html("上拉加载更多");
// 						this.refresh();
// 					}
// 					//如果已经到达底部则加载下一页
// 					if(this.y==this.maxScrollY){
// 						this.getPageList(++_that.options.pageIndex,_that.options.pageSize);
// 						this.refresh();
// 					}
// 				});
// 				this.initList();
// 			},

// 			initList: function() {
// 				alert("initList");
// 			},
// 			getPageList: function(pageIndex,pageSize) {
// 				alert("getPageList");
// 			}
// 		});

// 		var myScroll = new MyScroll();
// 		return myScroll;
// 	})($,IScroll);

// },100);
