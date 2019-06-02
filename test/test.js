var cc,
	bc = "black",
	sc = "black",
	bigbox,
	smallbox;

window.onload = function load() {
	if (CanvasControls.CanvasControls.ControllableCanvas.isMobile) {
		window.onerror = function error(e) {
			alert(e);
		};
	}
	cc = new CanvasControls.CanvasControls.ControllableCanvas({
		dragEnabled: true,
		wheelEnabled: true,
		pinchEnabled: true,
		scaleMode: 2,
		useRight: 3
	});
	bigbox = cc.addWidget({
		x: 200,
		y: 110,
		dx: 50,
		dy: 60
	}),
		smallbox = cc.addWidget({
			x: 50,
			y: 50,
			dx: 30,
			dy: 30,
			isDraggable: true
		});
	bigbox.focus = () => bc = "purple";
	bigbox.blur = () => bc = "black";
	bigbox.click = () => bc = "red";
	smallbox.focus = () => sc = "purple";
	smallbox.blur = () => sc = "black";
	smallbox.click = () => sc = "red";
	smallbox.drag = by => {
		smallbox.x += by[0];
		smallbox.y += by[1];
		smallbox._dragIgnited = true;

		return true;
	};
	cc.handle();
	resize();
	frame();
};

function resize() {
	cc.target.width = innerWidth;
	cc.target.height = innerHeight;
} //resize

window.onresize = resize.bind(window);

function reset() {
	cc.scale(1, 1, true);
	cc.translate(0, 0, true);
} //reset

function frame() {
	cc.context.setTransform(1, 0, 0, 1, 0, 0);
	cc.context.clearRect(0, 0, cc.target.width, cc.target.height);
	cc.retransform();
	cc.context.fillStyle = sc;
	cc.context.fillRect(smallbox.x, smallbox.y, smallbox.dx, smallbox.dy);
	cc.context.fillStyle = bc;
	cc.context.fillRect(bigbox.x, bigbox.y, bigbox.dx, bigbox.dy);
	cc.context.fillStyle = "blue";
	cc.context.fillRect(0, 0, 5, 5);
	cc.context.fillStyle = "rgba(250,5,5,.5)";
	cc.context.beginPath();
	cc.context.arc(...cc._coordinates.map((crd, idx) => (crd - cc.trans[idx]) / cc.scl[idx] ), 5, 0, Math.PI * 2);
	cc.context.fill();
	cc.context.closePath();
	cc.context.fillStyle = "black";
	requestAnimationFrame(frame);
} //frame
