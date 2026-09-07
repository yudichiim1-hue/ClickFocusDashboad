import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// --------------------------------------------------
// Firebase configuration
// --------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyD8Gm8qM9vV7Y7Z9q9uY8u9uY8u9uY8uY",
  authDomain: "clickfocusmaster.firebaseapp.com",
  projectId: "clickfocusmaster",
  storageBucket: "clickfocusmaster.firebasestorage.app",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:1234567890abcdef123456"
};


// --------------------------------------------------
// Firebase initialization
// --------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();


// --------------------------------------------------
// DOM elements
// --------------------------------------------------

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");

const googleLoginButton = document.getElementById("googleLoginButton");
const logoutButton = document.getElementById("logoutButton");

const loginStatus = document.getElementById("loginStatus");
const timerStatus = document.getElementById("timerStatus");
const sitesStatus = document.getElementById("sitesStatus");

const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const timerDisplay = document.getElementById("timerDisplay");
const durationSelect = document.getElementById("durationSelect");
const customTimeContainer = document.getElementById("customTimeContainer");
const customDurationInput = document.getElementById("customDurationInput");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");

const siteForm = document.getElementById("siteForm");
const siteInput = document.getElementById("siteInput");
const sitesList = document.getElementById("sitesList");


// --------------------------------------------------
// Application state
// --------------------------------------------------

let currentUser = null;
let currentTimerData = null;

let timerInterval = null;
let unsubscribeTimer = null;
let unsubscribeSites = null;


// --------------------------------------------------
// Utility functions
// --------------------------------------------------

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `status ${type}`;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");
}

function normalizeWebsite(value) {
  let website = value.trim().toLowerCase();

  if (!website) {
    return "";
  }

  website = website.replace(/^https?:\/\//, "");
  website = website.replace(/^www\./, "");
  website = website.split("/")[0];
  website = website.split("?")[0];
  website = website.split("#")[0];

  return website;
}

function getUserDocument() {
  if (!currentUser) {
    throw new Error("לא נמצא משתמש מחובר.");
  }

  return doc(db, "users", currentUser.uid);
}

function getSitesCollection() {
  if (!currentUser) {
    throw new Error("לא נמצא משתמש מחובר.");
  }

  return collection(db, "users", currentUser.uid, "blockedSites");
}


// --------------------------------------------------
// Google login
// --------------------------------------------------

googleLoginButton.addEventListener("click", async () => {
  try {
    googleLoginButton.disabled = true;
    setStatus(loginStatus, "מתחבר...", "");

    await signInWithPopup(auth, googleProvider);

    setStatus(loginStatus, "ההתחברות הצליחה.", "success");
  } catch (error) {
    console.error("Login error:", error);

    setStatus(
      loginStatus,
      "אירעה שגיאה בהתחברות. נסה שוב.",
      "error"
    );
  } finally {
    googleLoginButton.disabled = false;
  }
});


// --------------------------------------------------
// Logout
// --------------------------------------------------

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);

    setStatus(
      timerStatus,
      "אירעה שגיאה בהתנתקות.",
      "error"
    );
  }
});


// --------------------------------------------------
// Authentication state
// --------------------------------------------------

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    showLoggedInState(user);
    subscribeToTimer();
    subscribeToBlockedSites();
  } else {
    showLoggedOutState();
    clearTimerSubscription();
    clearSitesSubscription();
  }
});

function showLoggedInState(user) {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");

  userName.textContent = user.displayName || "משתמש";
  userEmail.textContent = user.email || "";

  if (user.photoURL) {
    userPhoto.src = user.photoURL;
    userPhoto.classList.remove("hidden");
  } else {
    userPhoto.classList.add("hidden");
  }

  setStatus(loginStatus, "");
}

function showLoggedOutState() {
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");

  userName.textContent = "";
  userEmail.textContent = "";

  stopLocalTimer();
  resetTimerDisplay();

  currentTimerData = null;
  sitesList.innerHTML = "";
}


// --------------------------------------------------
// Timer: Firestore subscription
// --------------------------------------------------

function subscribeToTimer() {
  clearTimerSubscription();

  const timerDocument = getUserDocument();

  unsubscribeTimer = onSnapshot(
    timerDocument,
    (snapshot) => {
      if (snapshot.exists()) {
        currentTimerData = snapshot.data();
        updateTimerFromFirestore();
      } else {
        currentTimerData = {
          active: false,
          duration: 0,
          startedAt: 0,
          endTime: 0
        };

        resetTimerDisplay();
      }
    },
    (error) => {
      console.error("Timer subscription error:", error);

      setStatus(
        timerStatus,
        "לא ניתן לטעון את נתוני הטיימר.",
        "error"
      );
    }
  );
}

function clearTimerSubscription() {
  if (unsubscribeTimer) {
    unsubscribeTimer();
    unsubscribeTimer = null;
  }
}

function updateTimerFromFirestore() {
  if (!currentTimerData) {
    resetTimerDisplay();
    return;
  }

  if (
    currentTimerData.active === true &&
    Number(currentTimerData.endTime) > Date.now()
  ) {
    startLocalTimer();
  } else {
    stopLocalTimer();

    if (currentTimerData.active === true) {
      finishTimerInFirestore();
    } else {
      resetTimerDisplay();
    }
  }
}


// --------------------------------------------------
// Timer: local display
// --------------------------------------------------

function startLocalTimer() {
  stopLocalTimer();

  timerDisplay.classList.add("active");
  timerDisplay.classList.remove("finished");

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    updateTimerDisplay();
  }, 1000);
}

function stopLocalTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  if (
    !currentTimerData ||
    currentTimerData.active !== true ||
    !currentTimerData.endTime
  ) {
    resetTimerDisplay();
    return;
  }

  const remainingMilliseconds =
    Number(currentTimerData.endTime) - Date.now();

  const remainingSeconds =
    Math.max(0, Math.ceil(remainingMilliseconds / 1000));

  timerDisplay.textContent = formatTime(remainingSeconds);

  if (remainingSeconds <= 0) {
    stopLocalTimer();
    timerDisplay.classList.remove("active");
    timerDisplay.classList.add("finished");

    setStatus(
      timerStatus,
      "הטיימר הסתיים.",
      "success"
    );

    finishTimerInFirestore();
  }
}

function resetTimerDisplay() {
  stopLocalTimer();

  timerDisplay.textContent = "00:00:00";
  timerDisplay.classList.remove("active");
  timerDisplay.classList.remove("finished");
}

async function finishTimerInFirestore() {
  if (!currentUser) {
    return;
  }

  try {
    await setDoc(
      getUserDocument(),
      {
        active: false,
        duration: 0,
        startedAt: 0,
        endTime: 0
      },
      {
        merge: true
      }
    );
  } catch (error) {
    console.error("Finish timer error:", error);
  }
}


// --------------------------------------------------
// Timer: duration selection
// --------------------------------------------------

durationSelect.addEventListener("change", () => {
  if (durationSelect.value === "custom") {
    customTimeContainer.classList.remove("hidden");
    customDurationInput.focus();
  } else {
    customTimeContainer.classList.add("hidden");
  }
});

function getSelectedDurationInMinutes() {
  if (durationSelect.value === "custom") {
    const customMinutes = Number(customDurationInput.value);

    if (
      !Number.isInteger(customMinutes) ||
      customMinutes < 1 ||
      customMinutes > 1440
    ) {
      throw new Error(
        "יש להזין זמן מותאם אישית בין דקה אחת ל־1440 דקות."
      );
    }

    return customMinutes;
  }

  const selectedMinutes = Number(durationSelect.value);

  if (
    !Number.isInteger(selectedMinutes) ||
    selectedMinutes <= 0
  ) {
    throw new Error("בחירת הזמן אינה תקינה.");
  }

  return selectedMinutes;
}


// --------------------------------------------------
// Timer: start
// --------------------------------------------------

startButton.addEventListener("click", async () => {
  if (!currentUser) {
    setStatus(
      timerStatus,
      "יש להתחבר לפני הפעלת הטיימר.",
      "error"
    );
    return;
  }

  try {
    const durationMinutes = getSelectedDurationInMinutes();

    const now = Date.now();
    const endTime = now + durationMinutes * 60 * 1000;

    startButton.disabled = true;

    await setDoc(
      getUserDocument(),
      {
        active: true,
        duration: durationMinutes,
        startedAt: now,
        endTime: endTime
      },
      {
        merge: true
      }
    );

    setStatus(
      timerStatus,
      `הטיימר הופעל למשך ${durationMinutes} דקות.`,
      "success"
    );
  } catch (error) {
    console.error("Start timer error:", error);

    setStatus(
      timerStatus,
      error.message || "אירעה שגיאה בהפעלת הטיימר.",
      "error"
    );
  } finally {
    startButton.disabled = false;
  }
});


// --------------------------------------------------
// Timer: stop
// --------------------------------------------------

stopButton.addEventListener("click", async () => {
  if (!currentUser) {
    return;
  }

  try {
    stopButton.disabled = true;

    await setDoc(
      getUserDocument(),
      {
        active: false,
        duration: 0,
        startedAt: 0,
        endTime: 0
      },
      {
        merge: true
      }
    );

    setStatus(
      timerStatus,
      "הטיימר נעצר.",
      "success"
    );
  } catch (error) {
    console.error("Stop timer error:", error);

    setStatus(
      timerStatus,
      "אירעה שגיאה בעצירת הטיימר.",
      "error"
    );
  } finally {
    stopButton.disabled = false;
  }
});


// --------------------------------------------------
// Blocked sites: Firestore subscription
// --------------------------------------------------

function subscribeToBlockedSites() {
  clearSitesSubscription();

  const sitesCollection = getSitesCollection();

  const sitesQuery = query(
    sitesCollection,
    orderBy("createdAt", "desc")
  );

  unsubscribeSites = onSnapshot(
    sitesQuery,
    (snapshot) => {
      const sites = [];

      snapshot.forEach((siteDocument) => {
        sites.push({
          id: siteDocument.id,
          ...siteDocument.data()
        });
      });

      renderBlockedSites(sites);
    },
    (error) => {
      console.error("Blocked sites subscription error:", error);

      setStatus(
        sitesStatus,
        "לא ניתן לטעון את רשימת האתרים.",
        "error"
      );

      sitesList.innerHTML = `
        <div class="empty-state">
          לא ניתן לטעון את הרשימה כרגע.
        </div>
      `;
    }
  );
}

function clearSitesSubscription() {
  if (unsubscribeSites) {
    unsubscribeSites();
    unsubscribeSites = null;
  }
}


// --------------------------------------------------
// Blocked sites: render
// --------------------------------------------------

function renderBlockedSites(sites) {
  sitesList.innerHTML = "";

  if (sites.length === 0) {
    sitesList.innerHTML = `
      <div class="empty-state">
        עדיין לא הוספת אתרים לרשימת החסימה.
      </div>
    `;

    return;
  }

  sites.forEach((site) => {
    const item = document.createElement("div");
    item.className = "site-item";

    const name = document.createElement("div");
    name.className = "site-name";
    name.textContent = site.domain;

    const deleteButton = document.createElement("button");
    deleteButton.className = "site-delete-button";
    deleteButton.textContent = "מחק";

    deleteButton.addEventListener("click", () => {
      deleteBlockedSite(site.id);
    });

    item.appendChild(name);
    item.appendChild(deleteButton);

    sitesList.appendChild(item);
  });
}


// --------------------------------------------------
// Blocked sites: add
// --------------------------------------------------

siteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    setStatus(
      sitesStatus,
      "יש להתחבר לפני הוספת אתר.",
      "error"
    );
    return;
  }

  const domain = normalizeWebsite(siteInput.value);

  if (!domain) {
    setStatus(
      sitesStatus,
      "יש להזין כתובת אתר.",
      "error"
    );
    return;
  }

  if (!domain.includes(".")) {
    setStatus(
      sitesStatus,
      "יש להזין כתובת אתר תקינה, לדוגמה youtube.com.",
      "error"
    );
    return;
  }

  try {
    const addButton = siteForm.querySelector("button");

    addButton.disabled = true;

    await addDoc(
      getSitesCollection(),
      {
        domain: domain,
        createdAt: serverTimestamp()
      }
    );

    siteInput.value = "";

    setStatus(
      sitesStatus,
      "האתר נוסף לרשימת החסימה.",
      "success"
    );
  } catch (error) {
    console.error("Add blocked site error:", error);

    setStatus(
      sitesStatus,
      "אירעה שגיאה בהוספת האתר.",
      "error"
    );
  } finally {
    const addButton = siteForm.querySelector("button");
    addButton.disabled = false;
  }
});


// --------------------------------------------------
// Blocked sites: delete
// --------------------------------------------------

async function deleteBlockedSite(siteId) {
  if (!currentUser || !siteId) {
    return;
  }

  try {
    await deleteDoc(
      doc(
        db,
        "users",
        currentUser.uid,
        "blockedSites",
        siteId
      )
    );

    setStatus(
      sitesStatus,
      "האתר נמחק מהרשימה.",
      "success"
    );
  } catch (error) {
    console.error("Delete blocked site error:", error);

    setStatus(
      sitesStatus,
      "אירעה שגיאה במחיקת האתר.",
      "error"
    );
  }
}
