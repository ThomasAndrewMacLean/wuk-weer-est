import fs from "fs";
import request from "request";
import { getAverageColor } from "fast-average-color-node";
import sharp from "sharp";
import fetch from "node-fetch";
import express from "express";
import { tmpdir } from "os";
import { join } from "path";

let html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wuk weer est?</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌤</text></svg>">
    <style>
      body{
        background: #111;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 75vh;
        font-family: monospace;
        font-size: clamp(1rem, 56px, 5vw);
      }
    </style>
  </head>
  <body>
    <h1>Wuk weer est?</h1>
    <p>
       De lucht ziet er zo uit:
       <div style="height: 100px; width: 100px; background-color: AVG_LUCHT;"></div>
   
       <br><br>
       Kan een korte broek? => KORTEBROEK
      </p>
    </p>

    <footer>
    <span>made with ❤️ by</span> 
    <a rel="noopener noreferrer" target="_blank" href="https://thomasmaclean.be">thomasmaclean</a>
     <span>YEAR</span></footer>
  </body>

</html>
`;
const app = express();
const port = process.env.PORT || 1234;
const download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

let originalImage = join(tmpdir(), "temp.jpg");
let outputImage = join(tmpdir(), "temp_cropped.jpg");

app.get("/", (req, res) => {
  try {
    console.log("starting");
    download(
      "https://observatory.ugent.be/incoming/vsap_wolken.jpg",
      originalImage,
      function () {
        sharp(originalImage)
          .extract({ width: 200, height: 150, left: 280, top: 320 })
          .toFile(outputImage)
          .then(function (new_file_info) {
            console.log("Image cropped and saved");
            getAverageColor(outputImage).then((color) => {
              console.log(color);
              fetch("https://www.kanikeenkortebroekaan.nl/")
                .then((x) => x.text())
                .then((x) => {
                  const korteBroek = x
                    .split("<title>Kan ik een korte broek aan? - ")[1]
                    .split(" </title>")[0];

                  html = html.replace("KORTEBROEK", korteBroek);
                  html = html.replace("AVG_LUCHT", color.hex);
                  res.send(html);
                });
            });
          })
          .catch(function (err) {
            console.log("An error occured");
          });
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
export default app;
