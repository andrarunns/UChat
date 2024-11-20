// Import Firebase dependencies
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, orderBy, getDocs } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
    authDomain: "uchat-d9392.firebaseapp.com",
    projectId: "uchat-d9392",
    storageBucket: "uchat-d9392.appspot.com",
    messagingSenderId: "397312451749",
    appId: "1:397312451749:web:6128f84f311b045f9d194c"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Extract chatId from the URL query string (e.g., /chat.html?chatId=40408)
const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get('chatId');

async function loadChatData() {
    if (!chatId) {
        console.error("No chat ID found in URL");
        return;
    }

    try {
        // Reference to the chat document
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
            const chatData = chatDoc.data();

            // Fetch messages ordered by timestamp
            const messagesRef = collection(chatRef, "messages");
            const messagesQuery = query(messagesRef, orderBy("timestamp"));
            const messagesSnapshot = await getDocs(messagesQuery);

            const messages = messagesSnapshot.docs.map(doc => doc.data());

            // Render chat and messages in the UI
            const chatContainer = document.getElementById("chatContainer");
            chatContainer.innerHTML = `
                <h1>Chat with: ${chatData.participants.join(", ")}</h1>
                <div id="messages">
                    ${messages.map(msg => `
                        <p>
                            <strong>${msg.sender}:</strong> ${msg.text}
                        </p>
                    `).join('')}
                </div>
            `;
        } else {
            console.log("Chat not found!");
            document.getElementById("chatContainer").innerHTML = `
                <p>Chat not found. Please check the URL.</p>
            `;
        }
    } catch (error) {
        console.error("Error loading chat data:", error);
    }
}

// Load chat data on page load
document.addEventListener("DOMContentLoaded", loadChatData);
