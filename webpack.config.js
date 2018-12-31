module.exports = {
	entry: "./dist/babel/CanvasControls.js",
	optimization: {
		minimize: true
	},
	output: {
		path: require("path").resolve(__dirname, "./dist/"),
		filename: "CanvasControls.bundle.js",
		library: "CanvasControls",
		libraryTarget: "umd"
	},
	devtool: "inline-source-map",
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},
	mode: "development",
	target: "web",
	watch: true,
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: "awesome-typescript-loader"
			},
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader"
			}
		]
	},
};
