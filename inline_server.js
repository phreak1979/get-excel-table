const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const inlineCss = require("inline-css");
require('dotenv').config()
const app = express();
const PORT = 3000;

app.use(basicAuth)
app.use(express.static("public"));

function basicAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).send('Authentication required.');
  }

  // Decode base64
  const [username, password] = Buffer.from(auth.split(' ')[1], 'base64')
    .toString()
    .split(':');

  // Compare to .env
  if (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  ) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Protected"');
  return res.status(401).send('Invalid credentials.');
}

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("htmlfile"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const inputHtml = fs.readFileSync(filePath, "utf8");

    // Inline the CSS from <style> tags into the HTML
    const inlinedHtml = await inlineCss(inputHtml, { url: "/" });

    // Extract the first <table>...</table>
    const tableMatch = inlinedHtml.match(/<table[\s\S]*?<\/table>/i);
    let onlyTable = tableMatch ? tableMatch[0] : "No <table> found.";

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Optional cleanup for Excel exports
    onlyTable = onlyTable
      .replace(/<\/div>\s*<div[^>]*?>/gi, '') // remove inline div chains
      .replace(/<div[^>]*?>/gi, '')           // remove any <div ...>
      .replace(/<\/div>/gi, '')               // remove any </div>
      .replace(/&nbsp;/gi, '')                // clean up space
      .replace(/&amp;nbsp;/gi, '')
      .replace(/\u00A0/g, '');

    res.send(onlyTable);
  } catch (err) {
    res.status(500).send("Error processing file: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Inline CSS processor running at http://localhost:${PORT}`);
});
