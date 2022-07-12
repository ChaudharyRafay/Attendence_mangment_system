const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://rafay:rafay@cluster0.5hwa406.mongodb.net/hospitaldb?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true

    })
    .then(() => {
        console.log("connection successful");
    })
    .catch((err) => {
        console.log("connection unsuccessful", err);
    })


//mongodb+srv://rafay:<password>@cluster0.5hwa406.mongodb.net/?retryWrites=true&w=majority


// mongodb://localhost:27017/hospitaldb