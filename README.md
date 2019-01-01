
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
