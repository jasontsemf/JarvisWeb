const express = require('express');
const app = express();
const socketIO = require("socket.io");
const dialogflow = require("@google-cloud/dialogflow");
const fetch = require("node-fetch");
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.KEYFILENAME
});
const projectId = "jarvis-ai-oxwx";


app.use(express.static("public"));

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
const io = socketIO(server);


io.on("connection", (socket) => {
    console.log("new user: ", socket.id);

    // receive what the person said from the browser

    socket.on("send to dialogflow", (data) => {
        console.log(data);
        sessionClient
            .detectIntent({
                session: sessionClient.projectAgentSessionPath(projectId, "1"),
                queryInput: {
                    text: {
                        text: data.query,
                        languageCode: "en-US"
                    }
                },
            })
            .then((response) => {
                const result = response[0].queryResult;
                console.log(result);

                let params = result.parameters.fields;
                let text = result.fulfillmentText;
                let intent = result.intent.displayName;
                socket.emit("stuff from df", {
                    params,
                    text,
                    intent
                });

            });
    });
});

app.get("/image/:phrase", async (req, res) => {

    let phrase = req.params.phrase;
    phrase = phrase.replace(/\s+/g, '+').toLowerCase();
    console.log(phrase);
    let url = `https://pixabay.com/api/?key=${process.env.PIXABAYKEY}&q=${phrase}&image_type=photo&pretty=true`;
    fetch(url, {
            mode: "cors"
        })
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            let imgUrl = result.hits[randomNumber(0,3)].webformatURL;
            res.send(imgUrl);
        });
});

function randomNumber(min, max) {  
    return Math.floor(Math.random() * (max - min) + min); 
}  