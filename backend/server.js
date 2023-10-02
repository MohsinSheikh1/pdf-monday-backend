const app = require("./app");
const port = process.env.PORT || 5000;
const db = require("./db");

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
