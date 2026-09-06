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



const app = initializeApp(firebaseConfig);


const db = getFirestore(app);



const focusRef =
doc(
db,
"focusSettings",
"test-user"
);



let countdownInterval = null;




// הפעלה רגילה

window.startFocus = async function(){


await updateDoc(
focusRef,
{
active:true
}
);


document.getElementById("status").innerHTML =
"🟢 פוקוס פעיל";


};





// כיבוי

window.stopFocus = async function(){


await updateDoc(
focusRef,
{

active:false,

duration:0,

endTime:0,

startedAt:0

}
);



if(countdownInterval){

clearInterval(countdownInterval);

}



document.getElementById("status").innerHTML =
"⚪ פוקוס כבוי";


document.getElementById("timer").innerHTML =
"";


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



document.getElementById("status").innerHTML =
"🟢 פוקוס פעיל";


startCountdown(endTime);


});







// טעינת מצב מהשרת

async function loadStatus(){


const snap =
await getDoc(focusRef);



if(!snap.exists())
return;



const data =
snap.data();



if(data.active){


document.getElementById("status").innerHTML =
"🟢 פוקוס פעיל";



if(data.endTime){

startCountdown(data.endTime);

}



}else{


document.getElementById("status").innerHTML =
"⚪ פוקוס כבוי";


document.getElementById("timer").innerHTML =
"";


}


}







// טיימר

function startCountdown(endTime){



if(countdownInterval){

clearInterval(countdownInterval);

}



countdownInterval =
setInterval(()=>{


const diff =
endTime - Date.now();



if(diff <= 0){


document.getElementById("timer").innerHTML =
"⏰ הסתיים";


clearInterval(countdownInterval);



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



document.getElementById("timer").innerHTML =

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
