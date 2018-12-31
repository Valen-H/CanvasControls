const http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs");

http.createServer((req, res) => {
	let ur = url.parse(req.url);
	fs.readFile(path.normalize('.' + ur.pathname), (err, data) => {
		if (err) {
			res.end(err.toString());
		} else {
			let end = path.extname(ur.pathname);

			switch (end) {
				case ".html":
				case ".htm":
					end = "text/html";
					break;
				case ".js":
					end = "text/javascript";
					break;
				case ".css":
					end = "text/css";
			}

			res.setHeader("Content-Type", end);
			res.end(data);
		}
	});
}).listen(1234, () => console.info("\nListening on port 1234.\n"));
