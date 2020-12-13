// console.log("hello from script.js");

const SpeechRecognition = webkitSpeechRecognition;
const synth = window.speechSynthesis;
const socket = io.connect();
const conversation = document.querySelector(".conversation");
const mic = document.querySelector(".fa-microphone");

let fileNames = ["jarvis_alarm.mp3", "jarvis_beep.mp3", "jarvis_on.mp3", "jarvis_morning.mp3"];
let baseURL = "./audio/";
let sounds = [];

// speech synthesis
const speak = (text) => {
    let utterThis = new SpeechSynthesisUtterance(text);
    var voices = synth.getVoices();
    // console.log(voices);
    var selectedOption = voices[50];
    utterThis.voice = selectedOption;
    let itemDiv = document.createElement("div");
    itemDiv.className = "item";
    let computerSpeechDiv = document.createElement("div");
    computerSpeechDiv.className = "computer-speech-div";
    computerSpeechDiv.textContent = text;
    itemDiv.appendChild(computerSpeechDiv);
    // document.querySelector(".conversation").appendChild(itemDiv);
    $(itemDiv).hide().appendTo(".conversation").fadeIn(500, () => {
        conversation.scrollTop = conversation.scrollHeight;
    });
    synth.speak(utterThis);
    mic.id = "mic";
};

const speakThenAudio = (text, arr, callBack) => {
    let utterThis = new SpeechSynthesisUtterance(text);
    var voices = synth.getVoices();
    // console.log(voices);
    var selectedOption = voices[50];
    utterThis.voice = selectedOption;
    let itemDiv = document.createElement("div");
    itemDiv.className = "item";
    let computerSpeechDiv = document.createElement("div");
    computerSpeechDiv.className = "computer-speech-div";
    computerSpeechDiv.textContent = text;
    itemDiv.appendChild(computerSpeechDiv);
    // document.querySelector(".conversation").appendChild(itemDiv);
    $(itemDiv).hide().appendTo(".conversation").fadeIn(500, () => {
        conversation.scrollTop = conversation.scrollHeight;
    });
    synth.speak(utterThis);
    mic.id = "mic";
    for (let i = 0; i < arr.length; i++) {
        sounds[i] = baseURL+ fileNames[parseInt(arr[i].numberValue)-1];
    }
    callBack(sounds);
};

// speech recognition
const getSpeech = () => {
    const recognition = new SpeechRecognition();

    recognition.start();

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        // document.querySelector("#my-speech-div").textContent = speechResult;
        let itemDiv = document.createElement("div");
        itemDiv.className = "item";
        let mySpeechDiv = document.createElement("div");
        mySpeechDiv.className = "my-speech-div";
        mySpeechDiv.textContent = speechResult;
        itemDiv.appendChild(mySpeechDiv);
        // document.querySelector(".conversation").appendChild(itemDiv);
        $(itemDiv).hide().appendTo(".conversation").fadeIn(500, () => {
            conversation.scrollTop = conversation.scrollHeight;
        });
        console.log("result: ", speechResult);

        // send what the person said to your server
        socket.emit("send to dialogflow", {
            query: speechResult
        });
    };
}

const getImage = (phrase) => {
    let url = `/image/${phrase}`;
    let result = fetch(url, {
            mode: "no-cors"
        })
        .then((response) => response.text())
        .then((result) => {
            console.log(result);
            let imgUrl = result;
            let computerSpeechDiv = document.querySelector(".conversation").lastChild.lastChild;
            let br = document.createElement("hr");
            let img = document.createElement("img");
            img.src = imgUrl;
            // computerSpeechDiv.appendChild(img);
            $(br).appendTo(computerSpeechDiv);
            $(img).hide().appendTo(computerSpeechDiv).fadeIn(500, () => {
                conversation.scrollTop = conversation.scrollHeight;
            });
        });
}

const playNextSounds = (sounds) => {
    if (sounds.length > 0) {
        const audio = new Audio();
        console.log(sounds);
        audio.src = sounds[0];
        audio.currentTime = 0;
        audio.play();
        sounds.shift();
        audio.addEventListener('ended', function () {
            return playNextSounds(sounds);
        })
    }
}

document.querySelector("#my-button").onclick = () => {
    mic.id = "mic-recording";
    getSpeech();
};

// receive from server
socket.on("stuff from df", (data) => {
    console.log(data.params);
    console.log(data.text);
    console.log(data.intent);
    if (data.intent === "image search") {
        if(data.params.any.stringValue != ""){
            speak(data.text);
            getImage(data.params.any.stringValue);
        }else{
            speak("Sorry! Protocol not available.");
        }
    } else if (data.intent === "selectnumber") {
        if(data.params.number.listValue.values){
            let arr = data.params.number.listValue.values;
            console.log(arr);
            speakThenAudio(data.text, arr, playNextSounds);
        }else{
            speak("Sorry! Protocol not available");
        }
    } else {
        speak(data.text);
    }
    conversation.scrollTop = conversation.scrollHeight;
});

console.log(synth.getVoices());