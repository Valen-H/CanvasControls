
# CanvasControls  
A web module that adds controls to the canvas object  
  
## Usage  
```javascript
var cc = new CanvasControls.CanvasControls.ControllableCanvas({  //Lib.Namespace.Class
	dragEnabled: true,
	target: canvas  //grabs first occurence if not passed
});

cc.handle();  //attach handles, can only be called once, to attach handles afterwards, use: cc._pcAdapt() or cc.mobileAdapt() after enabling them.

/**
 * Voila! Try dragging the canvas!! You can add drag bounds by setting the transBounds[x, y, X, Y] array
 */
```  
> Note: In your projects you should use the heavy but minified `dist/CanvasControls.bundle.js` which is packed with polyfills of the raw but not minified `dist/babel/CanvasControls.js`  
  
## Features  
* Scrolling - click 'n' drag  
* Zooming - mouse wheel, 2-finger pinch  
* Clickable buttons/widgets  
