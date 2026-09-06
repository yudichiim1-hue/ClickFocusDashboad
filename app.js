import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
getFirestore,
doc,
updateDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";



const firebaseConfig = {

apiKey: "AIzaSyBF87jtpyOS6exnNMH3PPc0XND8df2I7TU",

authDomain:
"clickfocusmaster.firebaseapp.com",

projectId:
"clickfocusmaster",

storageBucket:
"clickfocusmaster.firebasestorage.app",

messagingSenderId:
"891874911950",

appId:
"1:891874911950:web:43ac8e66561f6a8e70d29f"

};



const app =
initializeApp(firebaseConfig);



const db =
getFirestore(app);



const focusRef =
doc(
db,
"focusSettings",
"test-user"
);




// הפעלה רגילה

window.startFocus =
async function(){


await updateDoc(
focusRef,
{
active:true
}
);


loadStatus();


};




// כיבוי

window.stopFocus =
async function(){


await updateDoc(
focusRef,
{

active:false,

duration:0,

endTime:0

}
);


loadStatus();


};




// הפעלה לפי זמן

document
.getElementById("startTimer")
.addEventListener(
"click",
async()=>{


const minutes =
Number(
document.getElementById("focusTime").value
);



const endTime =
Date.now()
+
minutes * 60 * 1000;



await updateDoc(
focusRef,
{

active:true,

duration:minutes,

startedAt:Date.now(),

endTime:endTime

}
);



loadStatus();


});




// טעינת מצב

async function loadStatus(){


const snap =
await getDoc(focusRef);



if(!snap.exists())
return;



const data =
snap.data();



const status =
document.getElementById("status");


const timer =
document.getElementById("timer");



if(data.active){


status.innerHTML =
"🟢 פוקוס פעיל";


if(data.endTime){

startCountdown(
data.endTime
);

}



}else{


status.innerHTML =
"⚪ פוקוס כבוי";


timer.innerHTML="";


}



}




// ספירה לאחור

function startCountdown(endTime){


const timer =
document.getElementById("timer");



const interval =
setInterval(()=>{


const diff =
endTime - Date.now();



if(diff <= 0){


timer.innerHTML =
"⏰ הסתיים";


clearInterval(interval);


return;


}



const minutes =
Math.floor(
diff / 60000
);



const seconds =
Math.floor(
(diff / 1000) % 60
);



timer.innerHTML =
"⏱️ נשארו "
+
minutes
+
":"
+
seconds
.toString()
.padStart(2,"0");



},1000);



}




loadStatus();
