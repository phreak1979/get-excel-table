const express = require("express");
const juice = require("juice");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("htmlfile"), (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const inputHtml = fs.readFileSync(filePath, "utf8");

    const outputHtml = juice(inputHtml);

    // Extract the first <table>...</table> only
    const tableMatch = outputHtml.match(/<table[\s\S]*<\/table>/i); // greedy
    let onlyTable = tableMatch ? tableMatch[0] : "No <table> found.";


    fs.unlinkSync(filePath); // Clean up uploaded file
    // 🔥 Remove all &nbsp; from table cells
    onlyTable = onlyTable
      .replace(/<\/div>\s*<div[^>]*?>/gi, '') // remove inline div chains
      .replace(/<div[^>]*?>/gi, '')           // remove any <div ...>
      .replace(/<\/div>/gi, '')               // remove any </div>
      .replace(/&nbsp;/gi, '')                // clean up space
      .replace(/&amp;nbsp;/gi, '')
      .replace(/\u00A0/g, '');
    // res.send(outputHtml);
    res.send(onlyTable);
  } catch (err) {
    res.status(500).send("Error processing file: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Juice inliner running at http://localhost:${PORT}`);
});
