import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
getFirestore,
doc,
setDoc,
getDoc
}
from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
apiKey:"AIzaSyBF87jtpyOS6exnNMH3PPc0XND8df2I7TU",
authDomain:"clickfocusmaster.firebaseapp.com",
projectId:"clickfocusmaster",
storageBucket:"clickfocusmaster.firebasestorage.app",
messagingSenderId:"891874911950",
appId:"1:891874911950:web:43ac8e66561f6a8e70d29f"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const focusRef = doc(db,"users","test-user");

let timerInterval = null;


function showTime(end){

clearInterval(timerInterval);

function tick(){

let diff=end-Date.now();

if(diff<=0){

document.getElementById("timer").innerHTML="00:00";
document.getElementById("status").innerHTML="נגמר";

clearInterval(timerInterval);

setDoc(focusRef,{
active:false,
remainingTime:0,
endTime:0
},{merge:true});

return;
}


let min=Math.floor(diff/60000);
let sec=Math.floor((diff%60000)/1000);

document.getElementById("timer").innerHTML =
String(min).padStart(2,"0")+":"+
String(sec).padStart(2,"0");

}


tick();

timerInterval=setInterval(tick,1000);

}



window.startFocus = async ()=>{


let minutes =
Number(document.getElementById("time").value);


let end =
Date.now()+minutes*60000;


document.getElementById("status").innerHTML="פעיל 🟢";


showTime(end);


await setDoc(focusRef,{
active:true,
duration:minutes,
startedAt:Date.now(),
endTime:end,
remainingTime:minutes*60
},{merge:true});


};



window.stopFocus = async ()=>{


clearInterval(timerInterval);


document.getElementById("status").innerHTML="כבוי";

document.getElementById("timer").innerHTML="00:00";


await setDoc(focusRef,{
active:false,
remainingTime:0,
endTime:0
},{merge:true});


};



async function load(){

let snap=await getDoc(focusRef);


if(snap.exists()){

let data=snap.data();


if(data.active && data.endTime){

document.getElementById("status").innerHTML="פעיל 🟢";

showTime(data.endTime);

}

}

}


load();
