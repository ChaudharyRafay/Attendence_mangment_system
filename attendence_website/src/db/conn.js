const mongoose = require("mongoose");
//mongodb+srv://rafay:rafay@cluster0.ojnn6dj.mongodb.net/management_system?retryWrites=true&w=majority
mongoose.connect('mongodb://localhost:27017/attendence_management_system1', {
        useNewUrlParser: true,
        useUnifiedTopology: true

    })
    .then(() => {
        console.log("connection successful");
    })
    .catch((err) => {
        console.log("connection unsuccessful", err);
    })
