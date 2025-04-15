const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const app = express();
const PORT = 3000;
const D_ROOT = path.join(__dirname, "data");

const logPath = path.join(__dirname, "logs.txt");

app.use(express.static(D_ROOT));
app.use(cors());

function getSources() {
  return fs.readdirSync(D_ROOT);
}

function logReq(req, doPrint = true) {
  const message = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
  if (doPrint)
    console.log(message);
  fs.appendFileSync(logPath, message);
}

app.get("/next", (req, res) => {
  const filePath = req.query.path;

  if (!filePath)
    return res.status(200).json({ data: getSources(), for_user: "You probably don't want to see just these. To browser through files, put `?path=` then the filepath you want to investigate. For example, to investigate the `music` path, put `&path=music`. To go deeper, put `/nextfile` after music. To see the contents of music/directory, do `&path=music/directory`." })

  const dir = path.resolve(path.join(D_ROOT, filePath));

  if (!dir.startsWith(path.resolve(D_ROOT)))
    return res.status(400).json({ error: `Path traversal detected. Don't try to access my files.` });

  if (!fs.existsSync(dir))
    return res.status(404).json({ error: `No resource at the given path.`, for_user: `Was there a typo? ` });

  return res.status(200).json({ data: fs.readdirSync(dir) });
});

const MEDIA_EXTENSIONS = [".mp4", ".mp3", ".webm", ".ogg", ".avi", ".mkv", ".flac"];
app.get("/file", (req, res) => {
  const filePath = req.query.path;

  if (!filePath)
    return res.status(400).json({ error: `Expected to see a path, wasn't there` });

  const dir = path.join(D_ROOT, filePath);
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(D_ROOT)))
    return res.status(400).json({ error: `Path traversal detected.` });

  if (!fs.existsSync(resolved))
    return res.status(404).json({ error: `No resource at the given path` });

  if (!MEDIA_EXTENSIONS.includes(path.extname(resolved).toLowerCase()))
    return res.status(200).sendFile(resolved);

  const fileStats = fs.statSync(resolved);
  const fileSize = fileStats.size;

  const range = req.headers.range;
  if (!range)
    return res.status(200).sendFile(resolved);

  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end)
    return res.status(416).json({ error: "Requested range not satisfiable" });

  const type = mime.lookup(path.extname(resolved)) || "application/octet-stream";
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Length", end - start + 1);
  res.setHeader("Content-Type", type);
  res.status(200).sendFile(resolved, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error sending the file " });
    }
  });
});

app.use((req, res, next) => {
  logReq(req);
  next();
});

app.get("/", (req, res) => {
  return res.status(200).json({
    info: "You shouldn't be looking at the '/' of this. This is an API for getting files in a data directory.\nYou'll want to go to /next to find files, and /file to get files."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`App is running at http://localhost:${PORT}`);
});
