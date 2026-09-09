// ===============================
// ClickFocus Ultimate
// Part 1 - Firebase + Auth
// ===============================

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ===============================
// Firebase Config שלך
// ===============================

const firebaseConfig = {

  apiKey: "AIzaSyBF87jtpyOS6exnNMH3PPc0XND8df2I7TU",

  authDomain: "clickfocusmaster.firebaseapp.com",

  projectId: "clickfocusmaster",

  storageBucket: "clickfocusmaster.firebasestorage.app",

  messagingSenderId: "891874911950",

  appId: "1:891874911950:web:43ac8e66561f6a8e70d29f",

  measurementId: "G-8160YT0X39"

};


// הפעלה

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();


// משתנים כלליים

let currentUser = null;

let timerInterval = null;

let endTime = 0;


// ===============================
// התחברות Google
// ===============================

const loginButton =
document.getElementById("googleLoginButton");


if(loginButton){

loginButton.onclick = async()=>{

try{

const result =
await signInWithPopup(
auth,
googleProvider
);


currentUser = result.user;


// יצירת משתמש אם לא קיים

await setDoc(

doc(db,"users",currentUser.uid),

{

email: currentUser.email,

name: currentUser.displayName || "",

photo: currentUser.photoURL || "",

created:
Date.now()

},

{

merge:true

}

);


console.log(
"Login OK:",
currentUser.uid
);


}

catch(error){


console.error(
"Google Login Error:",
error
);


alert(
error.code + "\n" +
error.message
);


}


};

}



// ===============================
// יציאה
// ===============================

const logoutButton =
document.getElementById("logoutButton");


if(logoutButton){

logoutButton.onclick = async()=>{

await signOut(auth);

currentUser=null;

location.reload();

};

}



// ===============================
// בדיקת משתמש מחובר
// ===============================


onAuthStateChanged(auth,(user)=>{


if(user){

currentUser=user;


console.log(
"Current UID:",
user.uid
);


// מתחילים טעינת נתונים

loadUserData();


}

else{


console.log(
"No user"
);


}


});



// ===============================
// Reference אישי למשתמש
// ===============================

function userRef(){

return doc(
db,
"users",
currentUser.uid
);

}
// ===============================
// Part 2 - Focus Timer
// ===============================


// טעינת נתוני משתמש
async function loadUserData(){

if(!currentUser) return;


const snapshot =
await getDoc(userRef());


if(snapshot.exists()){


const data = snapshot.data();


if(data.endTime && data.active){


endTime = data.endTime;


startTimerDisplay();


}


}


}



// ===============================
// התחלת פוקוס
// ===============================


const startButton =
document.getElementById("startButton");


if(startButton){


startButton.onclick = async()=>{


if(!currentUser){

alert("יש להתחבר קודם");

return;

}


// זמן מותאם אישית

const customInput =
document.getElementById("customMinutes");

const selectTime =
document.getElementById("focusTime");


let minutes = 0;


// אם יש זמן מותאם
if(
customInput &&
Number(customInput.value)>0
){

minutes =
Number(customInput.value);


}

// אחרת מהבחירה

else if(selectTime){


minutes =
Number(selectTime.value);


}


// ברירת מחדל

if(!minutes){

minutes = 25;

}


// חישוב זמן סיום

endTime =
Date.now() + minutes * 60 * 1000;



await setDoc(

userRef(),

{

active:true,

duration:minutes,

startTime:Date.now(),

endTime:endTime

},

{

merge:true

}

);



startTimerDisplay();


};


}




// ===============================
// עצירת טיימר
// ===============================


const stopButton =
document.getElementById("stopButton");


if(stopButton){


stopButton.onclick = async()=>{


if(!currentUser) return;



clearInterval(timerInterval);



await updateDoc(

userRef(),

{

active:false,

endTime:0,

duration:0

}

);



showTime(0);



};


}




// ===============================
// הצגת הטיימר
// ===============================


function startTimerDisplay(){


clearInterval(timerInterval);



timerInterval =
setInterval(()=>{


let remaining =
endTime - Date.now();



if(remaining <= 0){



clearInterval(timerInterval);



showTime(0);



finishFocus();



return;


}



showTime(remaining);



},1000);



}





function showTime(milliseconds){



const timer =
document.getElementById("timer");

if(!timer) return;



let totalSeconds =
Math.floor(milliseconds / 1000);



let hours =
Math.floor(totalSeconds / 3600);



let minutes =
Math.floor(
(totalSeconds % 3600) / 60
);



let seconds =
totalSeconds % 60;



timer.innerText =

String(hours).padStart(2,"0")
+
":"
+
String(minutes).padStart(2,"0")
+
":"
+
String(seconds).padStart(2,"0");



}




// ===============================
// סיום פוקוס
// ===============================


async function finishFocus(){


if(!currentUser) return;



await updateDoc(

userRef(),

{

active:false,

endTime:0,

lastCompleted:Date.now()

}

);



alert(
"🎯 סיימת זמן פוקוס!"
);



}
// ===============================
// Part 3 - Blocked Sites
// ===============================


// טעינת רשימת אתרים

async function loadBlockedSites(){


if(!currentUser) return;



const list =
document.getElementById("sitesList");


if(!list) return;



list.innerHTML = "";



const sitesRef =
collection(
db,
"users",
currentUser.uid,
"blockedSites"
);



onSnapshot(
sitesRef,
(snapshot)=>{


list.innerHTML="";



snapshot.forEach((item)=>{


const data = item.data();



const div =
document.createElement("div");



div.className="site-item";



div.innerHTML = `

<span>${data.domain}</span>

<button data-id="${item.id}">
❌ מחק
</button>

`;



div.querySelector("button")
.onclick = async()=>{


await deleteDoc(

doc(
db,
"users",
currentUser.uid,
"blockedSites",
item.id
)

);


};



list.appendChild(div);



});



}

);



}





// ===============================
// הוספת אתר
// ===============================


const addSiteButton =
document.getElementById("addSiteButton");



if(addSiteButton){


addSiteButton.onclick = async()=>{


if(!currentUser){

alert("יש להתחבר");

return;

}



const input =
document.getElementById("siteInput");



let domain =
input.value
.trim()
.toLowerCase();



if(!domain){

return;

}



// מנקה כתובת אם הדביקו URL

domain =
domain
.replace("https://","")
.replace("http://","")
.replace("www.","")
.split("/")[0];




await addDoc(

collection(
db,
"users",
currentUser.uid,
"blockedSites"
),

{

domain:domain,

created:Date.now()

}

);



input.value="";



};



}




// ===============================
// הפעלת טעינת אתרים אחרי התחברות
// ===============================


function startUserFeatures(){


loadBlockedSites();


}
