var cc;

window.onload = function load() {
	cc = new CanvasControls.CanvasControls.ControllableCanvas();
	cc.target.width = innerWidth;
	cc.target.height = innerHeight;
	cc.handle();
	if (cc._mobile) {
		window.onerror = function error(e) {
			alert(e);
		};
	}
	frame();
};

function frame() {
	cc.context.setTransform(1, 0, 0, 1, 0, 0);
	cc.context.clearRect(0, 0, cc.target.width, cc.target.height);
	cc.retransform();
	cc.context.fillRect(50, 50, 30, 30);
	cc.context.fillRect(200, 110, 50, 60);
	cc.context.beginPath();
	cc.context.arc(...cc._coordinates.map((crd, idx) => crd - cc.trans[idx]), 5, 0, Math.PI * 2);
	cc.context.fill();
	requestAnimationFrame(frame);
} //frame
