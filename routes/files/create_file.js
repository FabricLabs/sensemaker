module.exports = function (req, res, next) {
  console.log(req.body);
  console.log(req.files);
  res.json({ message: "Successfully uploaded file" });
}
