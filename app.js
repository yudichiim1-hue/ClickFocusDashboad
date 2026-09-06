import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
// ייבוא ספריות התחברות
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let focusRef = null;
let timerInterval = null;
let unsubscribeSnapshot = null; // כדי שנוכל לבטל את ההאזנה כשמתנתקים

// פונקציות התחברות והתנתקות
window.loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("שגיאה בהתחברות:", error);
        alert("ההתחברות נכשלה. נסה שוב.");
    }
};

window.logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("שגיאה בהתנתקות:", error);
    }
};

// מאזין למצב ההתחברות של המשתמש
onAuthStateChanged(auth, (user) => {
    if (user) {
        // משתמש מחובר
        document.getElementById("login-section").style.display = "none";
        document.getElementById("app-section").style.display = "block";
        
        // הגדרת הרפרנס למסמך הספציפי של המשתמש
        focusRef = doc(db, "users", user.uid);
        
        // התחלת האזנה לשינויים ב-Firestore
        startListening();
    } else {
        // משתמש מנותק
        document.getElementById("login-section").style.display = "block";
        document.getElementById("app-section").style.display = "none";
        
        // עצירת טיימרים והאזנות קודמות
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        clearInterval(timerInterval);
    }
});

function startTimerUI(endTime) {
    clearInterval(timerInterval);

    timerInterval = setInterval(async () => {
        const diff = endTime - Date.now();

        if (diff <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timer").innerHTML = "00:00";
            document.getElementById("status").innerHTML = "נגמר";

            try {
                await setDoc(focusRef, {
                    active: false,
                    duration: 0,
                    startedAt: 0,
                    endTime: 0
                }, { merge: true });
            } catch (error) {
                console.error("שגיאה בעדכון Firestore:", error);
            }
            return;
        }

        const secondsLeft = Math.floor(diff / 1000);
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;

        document.getElementById("timer").innerHTML = 
            String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }, 1000);
}

window.startFocus = async () => {
    if (!focusRef) return;
    
    const minutes = Number(document.getElementById("time").value);
    const start = Date.now();
    const end = start + minutes * 60 * 1000;

    try {
        await setDoc(focusRef, {
            active: true,
            duration: minutes,
            startedAt: start,
            endTime: end
        }, { merge: true });
    } catch (error) {
        console.error("שגיאה בהפעלת פוקוס:", error);
        alert("לא הצלחנו להפעיל את הפוקוס, בדוק את החיבור לרשת.");
    }
};

window.stopFocus = async () => {
    if (!focusRef) return;
    
    clearInterval(timerInterval);
    document.getElementById("status").innerHTML = "מכבה...";

    try {
        await setDoc(focusRef, {
            active: false,
            duration: 0,
            startedAt: 0,
            endTime: 0
        }, { merge: true });

        document.getElementById("status").innerHTML = "כבוי";
        document.getElementById("timer").innerHTML = "00:00";
    } catch (error) {
        console.error("שגיאה בכיבוי פוקוס:", error);
        alert("לא הצלחנו לכבות, בדוק את החיבור לרשת.");
    }
};

function startListening() {
    if (unsubscribeSnapshot) unsubscribeSnapshot(); // ניקוי האזנה ישנה אם קיימת

    unsubscribeSnapshot = onSnapshot(focusRef, async (snap) => {
        if (!snap.exists()) return;

        const data = snap.data();

        if (data.active) {
            if (data.endTime > Date.now()) {
                document.getElementById("status").innerHTML = "פעיל 🟢";
                startTimerUI(data.endTime);
            } else {
                clearInterval(timerInterval);
                document.getElementById("status").innerHTML = "כבוי";
                document.getElementById("timer").innerHTML = "00:00";

                try {
                    await setDoc(focusRef, {
                        active: false,
                        duration: 0,
                        startedAt: 0,
                        endTime: 0
                    }, { merge: true });
                } catch (error) {
                    console.error("שגיאה באיפוס פוקוס:", error);
                }
            }
        } else {
            clearInterval(timerInterval);
            document.getElementById("status").innerHTML = "כבוי";
            document.getElementById("timer").innerHTML = "00:00";
        }
    }, (error) => {
        console.error("שגיאה בהאזנה ל-Firestore:", error);
    });
}
