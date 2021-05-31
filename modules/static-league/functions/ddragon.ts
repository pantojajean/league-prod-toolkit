import fs from 'fs';
import path from 'path';
import tar from 'tar';
import https from 'https';

export default function getDDragon(version: string, ctx: any, cb: () => void) {
  const fileName = `dragontail-${version}.tgz`
  const filePath = path.join(__dirname, '../..', 'data', fileName)
  const zipURI = `https://ddragon.leagueoflegends.com/cdn/${fileName}`
  const dataPath = path.join(__dirname, '../..', 'data')

  if (fs.existsSync(path.join(dataPath, version))) return cb()

  const paths = [
    `${version}/img/champion`,
    `${version}/img/item`,
    `${version}/img/profileicon`,
    `${version}/data/de_DE/map.json`,
    `${version}/data/de_DE/runesReforged.json`,
    `${version}/data/de_DE/champion.json`,
    `img/champion`,
    `img/perk-images/Styles`,
  ]

  const file = fs.createWriteStream(filePath);
  ctx.log.info('start downloading')
  https.get(zipURI, function(response) {
    response.pipe(file);

    if (response.headers['content-length']) {
      var len = parseInt(response.headers['content-length'], 10);
      var cur = 0;
      var total = len / 1048576;

      response.on("data", function(chunk: any) {
        cur += chunk.length;
        ctx.log.debug("Downloading " + (100.0 * cur / len).toFixed(2) + "% " + (cur / 1048576).toFixed(2) + " mb\r" + ".<br/> Total size: " + total.toFixed(2) + " mb");
      });
    }

    file.on("finish", function () {
      ctx.log.info('finish downloading')
      file.close();
      unpack()
    })
  }).on('error', function(err) { // Handle errors
    fs.unlink(filePath, () => {
      ctx.log.debug(filePath + 'file unlinked')
    });
    ctx.log.error(err.message)
  });

  function unpack () {
    ctx.log.info('start unpacking')
    fs.createReadStream(filePath)
    .on('error', ctx.log.debug)
    .pipe(
      tar.x({ cwd: dataPath, newer: true }, paths)
      .on('finish', function() {
        ctx.log.info('finish unpacking')
        fs.unlink(filePath, cb);
      })
    )
  }
}