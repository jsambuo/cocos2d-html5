/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

cc.RESOLUTION_POLICY = {
    // The entire application is visible in the specified area without trying to preserve the original aspect ratio.
    // Distortion can occur, and the application may appear stretched or compressed.
    EXACTFIT:0,
    // The entire application fills the specified area, without distortion but possibly with some cropping,
    // while maintaining the original aspect ratio of the application.
    NOBORDER:1,
    // The entire application is visible in the specified area without distortion while maintaining the original
    // aspect ratio of the application. Borders can appear on two sides of the application.
    SHOW_ALL:2,

    UNKNOWN:3
};

cc.Touches = [];
cc.TouchesIntergerDict = {};

/**
 * @class
 * @extends cc.Class
 */
cc.EGLView = cc.Class.extend(/** @lends cc.EGLView# */{
    _delegate:null,
    // real screen size
    _screenSize:cc.size(0,0),
    // resolution size, it is the size appropriate for the app resources.
    _designResolutionSize:cc.size(0, 0),
    // the view port size
    _viewPortRect:cc.rect(0,0,0,0),
    // the view name
    _viewName:"",
    _scaleX:1,
    _scaleY:1,
    _indexBitsUsed:0,
    _maxTouches:5,
    _resolutionPolicy:cc.RESOLUTION_POLICY.UNKNOWN,
    _initialize:false,

    /**
     * init
     */
    initialize:function () {
        this._initialize = true;
        this._adjustSize();

        var adjustSize = this._adjustSize.bind(this);
        window.addEventListener('resize', adjustSize, false);
    },

    _adjustSize:function () {
        var ele = document.documentElement;
        cc.canvas.width = ele.clientWidth;
        cc.canvas.height = ele.clientHeight;
        cc.renderContext.translate(0, cc.canvas.height);
        var parent = document.querySelector("#" + document['ccConfig']['tag']).parentNode;
        if (parent) {
            parent.style.width = cc.canvas.width + "px";
            parent.style.height = cc.canvas.height + "px";
        }
        var body = document.body;
        if (body) {
            body.style.padding = 0 + "px";
            body.style.border = 0 + "px";
            body.style.margin = 0 + "px";
        }

        this._screenSize = cc.size(cc.canvas.width, cc.canvas.height);
        this.setDesignResolutionSize();
    },

    /**
     * Force destroying EGL view, subclass must implement this method.
     */
    end:function () {
    },

    /**
     * Get whether opengl render system is ready, subclass must implement this method.
     */
    isOpenGLReady:function () {
    },

    /**
     * Exchanges the front and back buffers, subclass must implement this method.
     */
    swapBuffers:function () {
    },

    /**
     * Open or close IME keyboard , subclass must implement this method.
     */
    setIMEKeyboardState:function (isOpen) {
        if (isOpen) {
            // [EAGLView sharedEGLView] becomeFirstResponder
        }
        else {
            //  [EAGLView sharedEGLView] resignFirstResponder
        }
    },

    /**
     * @param {Number} scaleFactor
     * @return {Boolean}
     */
    setContentScaleFactor:function (scaleFactor) {
        cc.Assert(this._resolutionPolicy == cc.RESOLUTION_POLICY.UNKNOWN); // cannot enable retina mode
        this._scaleX = this._scaleY = scaleFactor;
        return true;
    },

    /**
     * Get the frame size of EGL view.
     * In general, it returns the screen size since the EGL view is a fullscreen view.
     */
    getFrameSize:function () {
        return this._screenSize;
    },

    /**
     * Set the frame size of EGL view.
     */
    setFrameSize:function (width, height) {
        this._designResolutionSize = this._screenSize = cc.size(width, height);
    },

    /**
     * Get the visible area size of opengl viewport.
     */
    getVisibleSize:function () {
        if (this._resolutionPolicy == cc.RESOLUTION_POLICY.NOBORDER) {
            return cc.size(this._screenSize.width / this._scaleX, this._screenSize.height / this._scaleY);
        }
        else {
            return this._designResolutionSize;
        }
    },

    /**
     * Get the visible origin povar of opengl viewport.
     */
    getVisibleOrigin:function () {
        if (this._resolutionPolicy == cc.RESOLUTION_POLICY.NOBORDER) {
            return cc.p((this._designResolutionSize.width - this._screenSize.width / this._scaleX) / 2,
                (this._designResolutionSize.height - this._screenSize.height / this._scaleY) / 2);
        }
        else {
            return cc.p(0, 0);
        }
    },

    /**
     * Set the design resolution size.
     * @param {Number} width Design resolution width.
     * @param {Number} height Design resolution height.
     * @param {Number} resolutionPolicy The resolution policy desired, you may choose:
     * [1] ResolutionExactFit Fill screen by stretch-to-fit: if the design resolution ratio of width to height is different from the screen resolution ratio, your game view will be stretched.
     * [2] ResolutionNoBorder Full screen without black border: if the design resolution ratio of width to height is different from the screen resolution ratio, two areas of your game view will be cut.
     * [3] ResolutionShowAll  Full screen with black border: if the design resolution ratio of width to height is different from the screen resolution ratio, two black borders will be shown.
     */
    setDesignResolutionSize:function (width, height, resolutionPolicy) {
        cc.Assert(resolutionPolicy != cc.RESOLUTION_POLICY.UNKNOWN, "should set resolutionPolicy");

        if(!this._initialize){
           this.initialize();
        }

        if (width == 0 || height == 0) {
            return;
        }
        if ((width != null) && (height != null)) {
            this._designResolutionSize = cc.size(width, height);
        }
        if (resolutionPolicy != null) {
            this._resolutionPolicy = resolutionPolicy;
        }


        this._scaleX = this._screenSize.width / this._designResolutionSize.width;
        this._scaleY = this._screenSize.height / this._designResolutionSize.height;

        if (this._resolutionPolicy == cc.RESOLUTION_POLICY.NOBORDER) {
            this._scaleX = this._scaleY = Math.max(this._scaleX, this._scaleY);
        }

        if (this._resolutionPolicy == cc.RESOLUTION_POLICY.SHOW_ALL) {
            this._scaleX = this._scaleY = Math.min(this._scaleX, this._scaleY);
        }

        // calculate the rect of viewport
        var viewPortW = this._designResolutionSize.width * this._scaleX;
        var viewPortH = this._designResolutionSize.height * this._scaleY;

        this._viewPortRect = cc.rect((this._screenSize.width - viewPortW) / 2, (this._screenSize.height - viewPortH) / 2, viewPortW, viewPortH);

        // reset director's member variables to fit visible rect
        var diretor = cc.Director.getInstance();
        diretor._winSizeInPoints = this.getDesignResolutionSize();

        if (cc.renderContextType == cc.CANVAS) {
            var width, height;
            switch (this._resolutionPolicy) {
                case cc.RESOLUTION_POLICY.EXACTFIT:
                    width = 0;
                    height = 0;
                case cc.RESOLUTION_POLICY.NOBORDER:
                    width = 0;
                    height = 0;
                case cc.RESOLUTION_POLICY.SHOW_ALL:
                    width = (this._screenSize.width - viewPortW) / 2;
                    height = -(this._screenSize.height - viewPortH) / 2;
                    var context = cc.renderContext;
                    context.beginPath();
                    context.rect(width, -viewPortH + height, viewPortW, viewPortH);
                    context.clip();
                    context.closePath();
            }
            cc.renderContext.translate(width, height);
            cc.renderContext.scale(this._scaleX, this._scaleY);
        }
        //diretor.setGLDefaultValues();
    },

    /**
     * Get design resolution size.
     * Default resolution size is the same as 'getFrameSize'.
     */
    getDesignResolutionSize:function () {
        return this._designResolutionSize;
    },

    /**
     * set touch delegate
     */
    setTouchDelegate:function (delegate) {
        this._delegate = delegate;
    },

    /**
     * Set opengl view port rectangle with points.
     */
    setViewPortInPoints:function (x, y, w, h) {
        //todo WEBGL
        /*glViewport((GLint)(x * this._scaleX + this._viewPortRect.origin.x),
         (GLint)(y * this._scaleY + this._viewPortRect.origin.y),
         (GLsizei)(w * this._scaleX),
         (GLsizei)(h * this._scaleY));*/

    },

    /**
     * Set Scissor rectangle with points.
     */
    setScissorInPoints:function (x, y, w, h) {
        //todo WEBGL
        /*glScissor((GLint)(x * this._scaleX + this._viewPortRect.origin.x),
         (GLint)(y * this._scaleY + this._viewPortRect.origin.y),
         (GLsizei)(w * this._scaleX),
         (GLsizei)(h * this._scaleY));*/
    },

    /**
     * @param {String} viewName
     */
    setViewName:function (viewName) {
        if (viewName != null && viewName.length > 0) {
            this._viewName = viewName;
        }
    },

    /**
     * @return {String}
     */
    getViewName:function () {
        return this._viewName;
    },

    /**
     * Get the opengl view port rectangle.
     */
    getViewPortRect:function () {
        return this._viewPortRect;
    },

    /**
     * Get scale factor of the horizontal direction.
     */
    getScaleX:function () {
        return this._scaleX;
    },

    /**
     * Get scale factor of the vertical direction.
     */
    getScaleY:function () {
        return this._scaleY;
    },


    /**
     * Touch events are handled by default; if you want to customize your handlers, please override these functions:
     * @param {Number} num
     * @param {Number} ids
     * @param {Number} xs
     * @param {Number} ys
     */
    handleTouchesBegin:function (num, ids, xs, ys) {
        var arr = [];
        for (var i = 0; i < num; ++i) {
            var id = ids[i];
            var x = xs[i];
            var y = ys[i];

            var index = cc.TouchesIntergerDict[id];
            var unusedIndex = 0;

            // it is a new touch
            if (index == null) {
                unusedIndex = this._getUnUsedIndex();

                // The touches is more than MAX_TOUCHES ?
                if (unusedIndex == -1) {
                    cc.log("The touches is more than MAX_TOUCHES, nUnusedIndex = " + unusedIndex);
                    continue;
                }

                var touch = cc.Touches[unusedIndex] = new cc.Touch();
                touch.setTouchInfo(unusedIndex, (x - this._viewPortRect.origin.x) / this._scaleX,
                    (y - this._viewPortRect.origin.y) / this._scaleY);

                //cc.log("x ="+x+" y = "+y, touches[key].getLocation().x, touches[key].getLocation().y);

                var interObj = 0 | unusedIndex;
                cc.TouchesIntergerDict[id] = interObj;
                arr.push(touch);
            }
        }

        if (arr.length == 0) {
            //cc.log("touchesBegan: count = 0");
            return;
        }
        this._delegate.touchesBegan(arr, null);
    },

    /**
     * @param {Number} num
     * @param {Number} ids
     * @param {Number} xs
     * @param {Number} ys
     */
    handleTouchesMove:function (num, ids, xs, ys) {
        var arr = [];
        for (var i = 0; i < num; ++i) {
            var id = ids[i];
            var x = xs[i];
            var y = ys[i];

            var index = cc.TouchesIntergerDict[id];
            if (index == null) {
                //cc.log("if the index doesn't exist, it is an error");
                continue;
            }

            //cc.log("Moving touches with id: " + id + ", x=" + x + ", y=" + y);
            var touch = cc.Touches[index];
            if (touch) {
                touch.setTouchInfo(index, (x - this._viewPortRect.origin.x) / this._scaleX,
                    (y - this._viewPortRect.origin.y) / this._scaleY);
                arr.push(touch);
            }
            else {
                // It is error, should return.
                //cc.log("Moving touches with id: " + id + " error");
                return;
            }
        }

        if (arr.length == 0) {
            //cc.log("touchesMoved: count = 0");
            return;
        }

        this._delegate.touchesMoved(arr, null);
    },

    /**
     * @param {Number} num
     * @param {Number} ids
     * @param {Number} xs
     * @param {Number} ys
     */
    handleTouchesEnd:function (num, ids, xs, ys) {
        var arr = [];
        this.getSetOfTouchesEndOrCancel(arr, num, ids, xs, ys);
        this._delegate.touchesEnded(arr, null);
    },

    /**
     * @param {Number} num
     * @param {Number} ids
     * @param {Number} xs
     * @param {Number} ys
     */
    handleTouchesCancel:function (num, ids, xs, ys) {
        var arr = [];
        this.getSetOfTouchesEndOrCancel(arr, num, ids, xs, ys);
        this._delegate.touchesCancelled(arr, null);
    },

    /**
     * @param {Array} arr
     * @param {Number} num
     * @param {Number} ids
     * @param {Number} xs
     * @param {Number} ys
     */
    getSetOfTouchesEndOrCancel:function (arr, num, ids, xs, ys) {
        for (var i = 0; i < num; ++i) {
            var id = ids[i];
            var x = xs[i];
            var y = ys[i];

            var index = cc.TouchesIntergerDict[id];
            if (index == null) {
                //cc.log("if the index doesn't exist, it is an error");
                continue;
            }
            /* Add to the set to send to the director */
            var touch = cc.Touches[index];
            if (touch) {
                //cc.log("Ending touches with id: " + id + ", x=" + x + ", y=" + y);
                touch.setTouchInfo(index, (x - this._viewPortRect.origin.x) / this._scaleX,
                    (y - this._viewPortRect.origin.y) / this._scaleY);

                arr.push(touch);

                // release the object
                cc.Touches[index] = null;
                this._removeUsedIndexBit(index);

                delete cc.TouchesIntergerDict[id];

            }
            else {
                //cc.log("Ending touches with id: " + id + " error");
                return;
            }
        }

        /*if (arr.length == 0) {
         cc.log("touchesEnded or touchesCancel: count = 0");
         }*/
    },

    _getUnUsedIndex:function () {
        var i;
        var temp = this._indexBitsUsed;

        for (i = 0; i < this._maxTouches; i++) {
            if (!(temp & 0x00000001)) {
                this._indexBitsUsed |= (1 << i);
                return i;
            }

            temp >>= 1;
        }

        // all bits are used
        return -1;
    },

    _removeUsedIndexBit:function (index) {
        if (index < 0 || index >= this._maxTouches) {
            return;
        }

        var temp = 1 << index;
        temp = ~temp;
        this._indexBitsUsed &= temp;
    },

    // Pass the touches to the superview
    touchesBegan:function (touches, event) {
        var ids = [];
        var xs = [];
        var ys = [];

        var i = 0;
        for (var key in touches) {
            ids[i] = key;
            xs[i] = touches[key].getLocation().x;
            ys[i] = touches[key].getLocation().y;
            ++i;
        }
        this.handleTouchesBegin(i, ids, xs, ys);
    },
    touchesMoved:function (touches, event) {
        var ids = [];
        var xs = [];
        var ys = [];

        var i = 0;
        for (var key in touches) {
            ids[i] = key;
            xs[i] = touches[key].getLocation().x;
            ys[i] = touches[key].getLocation().y;
            ++i;
        }
        this.handleTouchesMove(i, ids, xs, ys);
    },

    touchesEnded:function (touches, event) {
        var ids = [];
        var xs = [];
        var ys = [];

        var i = 0;
        for (var key in touches) {
            ids[i] = key;
            xs[i] = touches[key].getLocation().x;
            ys[i] = touches[key].getLocation().y;
            ++i;
        }
        this.handleTouchesEnd(i, ids, xs, ys);
    },

    touchesCancelled:function (touches, event) {
        var ids = [];
        var xs = [];
        var ys = [];

        var i = 0;
        for (var key in touches) {
            ids[i] = key;
            xs[i] = touches[key].getLocation().x;
            ys[i] = touches[key].getLocation().y;
            ++i;
        }
        this.handleTouchesCancel(i, ids, xs, ys);
    }
});


cc.EGLView.getInstance = function () {
    if (!this._instance) {
        this._instance = new cc.EGLView();
    }
    return this._instance;
};