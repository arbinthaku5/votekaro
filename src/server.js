const app = require('./app');
const { port } = require('./config');

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
app.get("/", (req, res) => {
  res.send("Voting System Backend is running");
});
