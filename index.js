var express = require("express");
require('dotenv').config();
const port = 84;
const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
	res.set({
		"Allow-access-Allow-Origin": "*",
	});

	return res.redirect("/html/index.html");
});

app.listen(port, () => {
	console.log(`The application started successfully on port ${port}`);
});

// todo: POST command to save credential template