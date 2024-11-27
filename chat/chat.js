import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
  authDomain: "uchat-d9392.firebaseapp.com",
  databaseURL: "https://uchat-d9392-default-rtdb.firebaseio.com",
  projectId: "uchat-d9392",
  storageBucket: "uchat-d9392.firebasestorage.app",
  messagingSenderId: "397312451749",
  appId: "1:397312451749:web:6128f84f311b045f9d194c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Get the chat ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get("chatId");

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
      const messages = messagesSnapshot.docs.map((doc) => doc.data());

      const messagesContainer = document.getElementById("messages");
      messagesContainer.innerHTML = '';

      messages.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        const senderDiv = document.createElement("strong");
        senderDiv.innerText = `${msg.sender}:`;

        const textDiv = document.createElement("div");
        textDiv.innerText = msg.text || "No text message";

        // Append sender and message text
        messageDiv.appendChild(senderDiv);
        messageDiv.appendChild(textDiv);

        // Check for fileURL (image)
        if (msg.fileURL) {
          const fileExtension = msg.fileURL.split('.').pop().toLowerCase();
          const fileType = fileExtension.slice(0, 3);

          if (['png', 'jpg', 'jpeg'].includes(fileType)) {
            // Check if the file URL is correct
            console.log(msg.fileURL);

            // Create a link element to display the file URL
            const link = document.createElement("a");
            link.href = msg.fileURL;
            link.target = "_blank";
            link.innerText = msg.fileURL;

            // Append the link (URL) to the message text
            textDiv.appendChild(link);
          }
        } else {
          textDiv.innerText = msg.text || "No text message";
        }


        messagesContainer.appendChild(messageDiv);
      });

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };


    // Initial rendering of messages
    await renderMessages();

    // Real-time updates for new messages
    onSnapshot(
      query(messagesCollectionRef, orderBy("timestamp")),
      (snapshot) => {
        const messagesContainer = document.getElementById("messages");
        const messages = snapshot.docs.map((doc) => doc.data());
        messagesContainer.innerHTML = messages
          .map((msg) => {
            let messageHTML = `<div class="message"><strong>${msg.sender}:</strong> ${msg.text}</div>`;
            console.log("days never finished")
            // If the message contains a file URL (image), display the image
            if (msg.fileURL) {
              const fileExtension = msg.fileURL.split('.').pop().toLowerCase();
              console.log("there is a file to display")
              const fileType = fileExtension.slice(0, 3);
              if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
                messageHTML += `<img src="${msg.fileURL}" alt="Attached Image" class="message-image" />`;
                console.log("we are tyring ")
              }
            }

            return messageHTML;
          })
          .join("");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    );

    // Send message functionality
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const fileInput = document.getElementById("fileInput");

    sendButton.addEventListener("click", async () => {
      const messageText = messageInput.value.trim();
      const file = fileInput.files[0];

      if (messageText === "" && !file) return;

      try {
        let messageData = {
          sender: auth.currentUser.email,
          text: messageText,
          timestamp: serverTimestamp(),
        };

        // If a file is attached, upload it to Firebase Storage
        if (file) {
          const storageRef = ref(storage, `chat_files/${file.name}`);
          const fileSnapshot = await uploadBytes(storageRef, file);
          const fileURL = await getDownloadURL(fileSnapshot.ref);
          messageData.fileURL = fileURL;
        }

        // Add the message (with or without file) to the messages collection
        await addDoc(messagesCollectionRef, messageData);

        // Update the chats document with the last message and timestamp
        await updateDoc(chatRef, {
          lastMessage: messageText,
          lastMessageAt: serverTimestamp(),
        });

        messageInput.value = "";
        fileInput.value = "";
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
  } catch (error) {
    console.error("Error loading chat data:", error);
  }
}

loadChatData();
