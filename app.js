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



function showTime(endTime){

clearInterval(timerInterval);


function update(){

let diff = endTime - Date.now();


if(diff <= 0){

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


let minutes = Math.floor(diff / 60000);

let seconds = Math.floor((diff % 60000) / 1000);


document.getElementById("timer").innerHTML =
String(minutes).padStart(2,"0")
+
":"
+
String(seconds).padStart(2,"0");


}


update();

timerInterval=setInterval(update,1000);

}




window.startFocus = async ()=>{


let minutes =
Number(document.getElementById("time").value);


let endTime =
Date.now() + minutes * 60000;



await setDoc(focusRef,{

active:true,

duration:minutes,

startedAt:Date.now(),

endTime:endTime,

remainingTime:minutes*60


},{merge:true});



document.getElementById("status").innerHTML="פעיל 🟢";


showTime(endTime);


};





window.stopFocus = async ()=>{


clearInterval(timerInterval);



await setDoc(focusRef,{

active:false,

remainingTime:0,

endTime:0


},{merge:true});



document.getElementById("status").innerHTML="כבוי";

document.getElementById("timer").innerHTML="00:00";


};






// סנכרון חי עם Firebase

onSnapshot(focusRef,(snap)=>{


if(!snap.exists()) return;


let data=snap.data();



if(data.active && data.endTime){


document.getElementById("status").innerHTML="פעיל 🟢";


showTime(data.endTime);


}

else{


document.getElementById("status").innerHTML="כבוי";

document.getElementById("timer").innerHTML="00:00";


}


});
