import app from "./app";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log(`App is listening to port ${PORT}`))