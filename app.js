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
    authDomain: "clickfocusmaster.firebaseapp.com",
    projectId: "clickfocusmaster",
    storageBucket: "clickfocusmaster.firebasestorage.app",
    messagingSenderId: "891874911950",
    appId: "1:891874911950:web:43ac8e66561f6a8e70d29f"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


const focusRef = doc(
    db,
    "focusSettings",
    "test-user"
);


// הפעלת פוקוס
window.startFocus = async function(){

await updateDoc(
    focusRef,
    {
        active:true
    }
);

alert("🟢 Focus הופעל");

};


// כיבוי פוקוס
window.stopFocus = async function(){

await updateDoc(
    focusRef,
    {
        active:false
    }
);

alert("🔴 Focus כובה");

};


// בדיקת מצב
async function checkStatus(){

const snap = await getDoc(focusRef);

if(snap.exists()){

let data=snap.data();

document.getElementById("status").innerHTML =
data.active
?
"🟢 פעיל"
:
"⚪ כבוי";

}

}


checkStatus();