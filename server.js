import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => console.log(`App is listening to port ${PORT}`))