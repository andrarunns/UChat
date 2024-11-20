import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, collection, query, where, orderBy, getDocs, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Get the chat ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get('chatId'); // e.g., /chat/?chatId=40408

async function loadChatData() {
    if (!chatId) {
        console.error("No chat ID found in URL");
        return;
    }

    try {
        const chatRef = doc(db, "chats", chatId);
        const messagesCollectionRef = collection(chatRef, "messages");

        const renderMessages = async () => {
            const messagesQuery = query(messagesCollectionRef, orderBy("timestamp"));
            const messagesSnapshot = await getDocs(messagesQuery);
            const messages = messagesSnapshot.docs.map(doc => doc.data());

            const messagesContainer = document.getElementById("messages");
            messagesContainer.innerHTML = messages
                .map(msg => `<div class="message"><strong>${msg.sender}:</strong> ${msg.text}</div>`)
                .join('');
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll to the bottom
        };

        // Initial rendering of messages
        await renderMessages();

        // Real-time updates for new messages
        onSnapshot(query(messagesCollectionRef, orderBy("timestamp")), (snapshot) => {
            const messagesContainer = document.getElementById("messages");
            const messages = snapshot.docs.map(doc => doc.data());
            messagesContainer.innerHTML = messages
                .map(msg => `<div class="message"><strong>${msg.sender}:</strong> ${msg.text}</div>`)
                .join('');
            messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
        });

        // Send message functionality
        const messageInput = document.getElementById("messageInput");
        const sendButton = document.getElementById("sendButton");

        sendButton.addEventListener("click", async () => {
            const messageText = messageInput.value.trim();
            if (messageText === "") return;

            try {
                await addDoc(messagesCollectionRef, {
                    sender: auth.currentUser.email,
                    text: messageText,
                    timestamp: serverTimestamp(),
                });
                messageInput.value = ""; // Clear input after sending
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });
    } catch (error) {
        console.error("Error loading chat data:", error);
    }
}

loadChatData();
