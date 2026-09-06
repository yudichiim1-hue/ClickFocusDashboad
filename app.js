import { initializeApp } from 
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
getFirestore,
doc,
setDoc,
onSnapshot
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



function startTimer(endTime){


clearInterval(timerInterval);



timerInterval = setInterval(async()=>{


let diff = endTime - Date.now();



if(diff <= 0){


clearInterval(timerInterval);


document.getElementById("timer").innerHTML="00:00";

document.getElementById("status").innerHTML="נגמר";



await setDoc(focusRef,{

active:false,

remainingTime:0,

endTime:0

},{merge:true});



return;

}



let secondsLeft = Math.floor(diff / 1000);


let minutes =
Math.floor(secondsLeft / 60);


let seconds =
secondsLeft % 60;



document.getElementById("timer").innerHTML =
String(minutes).padStart(2,"0")
+
":"
+
String(seconds).padStart(2,"0");



// עדכון הזמן שנשאר ב-Firebase

await setDoc(focusRef,{

remainingTime:secondsLeft

},{merge:true});



},1000);



}





window.startFocus = async ()=>{


let minutes =
Number(document.getElementById("time").value);



let start =
Date.now();


let end =
start + minutes * 60 * 1000;



await setDoc(focusRef,{

active:true,

duration:minutes,

startedAt:start,

endTime:end,

remainingTime:minutes*60

},{merge:true});



document.getElementById("status").innerHTML =
"פעיל 🟢";



startTimer(end);



};






window.stopFocus = async ()=>{


clearInterval(timerInterval);



await setDoc(focusRef,{

active:false,

duration:0,

startedAt:0,

endTime:0,

remainingTime:0

},{merge:true});



document.getElementById("status").innerHTML =
"כבוי";


document.getElementById("timer").innerHTML =
"00:00";



};







// סנכרון חי

onSnapshot(focusRef,(snap)=>{


if(!snap.exists()) return;



let data = snap.data();



if(data.active && data.endTime > Date.now()){


document.getElementById("status").innerHTML =
"פעיל 🟢";


startTimer(data.endTime);



}

else{


document.getElementById("status").innerHTML =
"כבוי";


}



});
