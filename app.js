import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {

getFirestore,
doc,
setDoc,
onSnapshot,
collection,
addDoc,
getDocs,
deleteDoc

}
from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";



const firebaseConfig={


apiKey:"AIzaSyBF87jtpyOS6exnNMH3PPc0XND8df2I7TU",

authDomain:"clickfocusmaster.firebaseapp.com",

projectId:"clickfocusmaster",

storageBucket:"clickfocusmaster.firebasestorage.app",

messagingSenderId:"891874911950",

appId:"1:891874911950:web:43ac8e66561f6a8e70d29f"

};



const app=initializeApp(firebaseConfig);

const db=getFirestore(app);



const focusRef=
doc(db,"users","test-user");



const sitesRef=
collection(db,"blockedSites");



let timerInterval=null;




function startTimer(endTime){


clearInterval(timerInterval);


function update(){


let diff=endTime-Date.now();


if(diff<=0){


clearInterval(timerInterval);


document.getElementById("timer").innerHTML="00:00";

document.getElementById("status").innerHTML="נגמר";


setDoc(focusRef,{
active:false
},{
merge:true
});


return;

}



let total=
Math.floor(diff/1000);


let min=
Math.floor(total/60);


let sec=
total%60;



document.getElementById("timer").innerHTML=

String(min).padStart(2,"0")
+
":"
+
String(sec).padStart(2,"0");


}



update();


timerInterval=setInterval(update,1000);


}





async function activate(minutes){


let start=Date.now();

let end=start+minutes*60000;



await setDoc(focusRef,{

active:true,

duration:minutes,

startedAt:start,

endTime:end

},{merge:true});



startTimer(end);


document.getElementById("status").innerHTML=
"פעיל 🟢";


}




window.startFocus=()=>{


activate(
Number(
document.getElementById("time").value
)
);


};



window.startCustomFocus=()=>{


let minutes=
Number(
document.getElementById("customTime").value
);



if(!minutes)return;


activate(minutes);


};




window.stopFocus=async()=>{


clearInterval(timerInterval);



await setDoc(focusRef,{

active:false,

duration:0,

startedAt:0,

endTime:0

},{merge:true});



document.getElementById("status").innerHTML="כבוי";

document.getElementById("timer").innerHTML="00:00";


};






onSnapshot(focusRef,(snap)=>{


if(!snap.exists())return;


let data=snap.data();



if(data.active && data.endTime>Date.now()){


document.getElementById("status").innerHTML=
"פעיל 🟢";


startTimer(data.endTime);


}



});






// =================
// אתרים חסומים
// =================



window.addSite=async()=>{


let site=
document.getElementById("siteInput").value.trim();



if(!site)return;



await addDoc(sitesRef,{

url:site

});



document.getElementById("siteInput").value="";


loadSites();


};





async function loadSites(){


let box=
document.getElementById("sitesList");


box.innerHTML="";


let snap=
await getDocs(sitesRef);



snap.forEach(item=>{


let data=item.data();



box.innerHTML+=`

<div class="site">

${data.url}

<button onclick="removeSite('${item.id}')">
❌
</button>


</div>

`;


});


}



window.removeSite=async(id)=>{


await deleteDoc(
doc(db,"blockedSites",id)
);


loadSites();


};



loadSites();
