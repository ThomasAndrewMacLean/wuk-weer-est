import fs from "fs";
import request from "request";
import { getAverageColor } from "fast-average-color-node";
import sharp from "sharp";
import fetch from "node-fetch";
import express from "express";
import { tmpdir } from "os";
import { join } from "path";

const app = express();
const port = process.env.PORT || 1234;
const download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};
let originalImage = join(tmpdir, "temp.jpg");
let outputImage = join(tmpdir, "temp_cropped.jpg");

app.get("/api", (req, res) => {
  try {
    console.log("starting");
    download(
      "https://observatory.ugent.be/incoming/vsap_wolken.jpg",
      originalImage,
      function () {
        let outputImage = "temp_cropped.jpg";

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

                  let template = fs.readFileSync("./index.html", "utf8");
                  template = template.replace("KORTEBROEK", korteBroek);
                  template = template.replace("AVG_LUCHT", color.hex);
                  res.send(template);
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
