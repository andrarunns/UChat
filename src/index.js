// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, updateDoc, deleteDoc, getDoc, getDocs, query, where, FieldPath } from "firebase/firestore"
import { browserSessionPersistence, createUserWithEmailAndPassword, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
  authDomain: "uchat-d9392.firebaseapp.com",
  projectId: "uchat-d9392",
  storageBucket: "uchat-d9392.appspot.com",
  messagingSenderId: "397312451749",
  appId: "1:397312451749:web:6128f84f311b045f9d194c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firestore initialized:", db);
console.log("Auth initialized:", auth);

// Create a reference variable to the collection
const userCol = collection(db, "users");

// Creating User Form ----------------------------------------
const addAccountForm = document.querySelector("#createAccount");

if (addAccountForm) {
  addAccountForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const firstname = addAccountForm.firstName.value;
    const lastname = addAccountForm.lastName.value;
    const email = addAccountForm.email.value;
    const pass = addAccountForm.password.value;
    const friends = []
    const conversations = []

    // If password is less than 6 characters, show an alert and return to stop further code execution
    if (pass.length < 6) {
      alert('Password must be at least 6 characters long.');
      return; // This will exit the function and prevent further code execution
    }

    // Set session persistence
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        // Create the user with email and password
        return createUserWithEmailAndPassword(auth, email, pass);
      })
      .then((userCredential) => {
        const user = userCredential.user;
        const uid = user.uid;

        // Reference to the new user document
        const userRef = doc(db, "users", uid);

        // New user data to add
        const newUser = {
          firstname: firstname,
          lastname: lastname,
          email: email,
          uid: uid,
          friends: friends,
          conversations: conversations
        };

        // Set new user data in Firestore
        return setDoc(userRef, newUser);
      })
      .then(() => {
        console.log("New user added successfully");
        
        // Redirect to dashboard or other page if needed
        location.href = "../dashboard/dashboard.html";
      })
      .catch((error) => {
        console.log("Error creating user or adding to Firestore:", error);
      });
  });
}



//Log in Form ------------------------------------------------------------------
const loginForm = document.getElementById("login")
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const wrongLogInMessage = document.getElementById('wrongLogIn');
    setPersistence(auth, browserSessionPersistence)
      .then(() => {
        const email = loginForm.email.value
        const pass = loginForm.password.value

        signInWithEmailAndPassword(auth, email, pass)
          .then((userCredential) => {
            console.log("Signed In with Created User")
            console.log(userCredential.user.uid)
            var userRef = doc(userCol, userCredential.user.uid)
            console.log(userRef)
            getDoc(userRef)
              .then((userSnap) => {
                console.log(userSnap.data())
                location.href = "../dashboard/dashboard.html"
              
              }).catch((e) => {
                console.log(e)
              })
          }).catch((e) => {
            console.log(e)
            wrongLogInMessage.style.display = 'block';
          })
      }).catch((e) => {
        console.log("Persistence error 2 "+ e )
      })
  })
}

