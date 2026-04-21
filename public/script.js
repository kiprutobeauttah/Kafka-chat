let currentUser = null;
let token = null;
let selectedUser = null;

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      token = data.token;
      currentUser = username;
      document.getElementById("login").style.display = "none";
      document.getElementById("container").style.display = "flex";
      
      // Set user profile
      const profileIcon = document.querySelector("#user-profile .profile-icon");
      const profileName = document.querySelector("#user-profile .profile-name");
      profileIcon.textContent = username.charAt(0).toUpperCase();
      profileName.textContent = username;
      
      await loadUsers();
      connectWebSocket();
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Error: " + error.message);
  }
}

async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Registered successfully. Please login.");
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Register error:", error);
    alert("Error: " + error.message);
  }
}

function connectWebSocket() {
  const ws = new WebSocket("ws://localhost:3000");
  const chat = document.getElementById("chat");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "history") {
      data.data.forEach((msg) => renderMessage(msg, chat));
    }

    if (data.type === "message") {
      renderMessage(data.data, chat);
    }
  };

  window.sendMsg = function() {
    const message = document.getElementById("msg").value;

    ws.send(JSON.stringify({
      user: currentUser,
      message: message
    }));

    document.getElementById("msg").value = "";
  };
}

function renderMessage(msg, chat) {
  const div = document.createElement("div");
  div.className = `message ${msg.user === currentUser ? "sent" : "received"}`;
  div.textContent = `${msg.user}: ${msg.message}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function loadUsers() {
  try {
    const response = await fetch("/users");
    const users = await response.json();
    
    const contactsDiv = document.getElementById("contacts");
    contactsDiv.innerHTML = "";
    
    users.forEach(user => {
      // Don't show current user in contacts
      if (user.username === currentUser) return;
      
      const contactDiv = document.createElement("div");
      contactDiv.className = "contact";
      
      const icon = document.createElement("div");
      icon.className = "contact-icon";
      icon.textContent = user.username.charAt(0).toUpperCase();
      
      const span = document.createElement("span");
      span.textContent = user.username;
      
      contactDiv.appendChild(icon);
      contactDiv.appendChild(span);
      
      // Add click handler for selecting user
      contactDiv.addEventListener("click", () => {
        selectedUser = user.username;
        
        // Update active state
        document.querySelectorAll(".contact").forEach(c => c.classList.remove("active"));
        contactDiv.classList.add("active");
        
        // Update chat header
        document.querySelector("#chat-header h3").textContent = `Secure Chat with ${user.username}`;
        
        // Clear chat and show info message
        const chatDiv = document.getElementById("chat");
        chatDiv.innerHTML = '<div class="info-message"><p>Chat history will appear here</p></div>';
      });
      
      contactsDiv.appendChild(contactDiv);
    });
  } catch (error) {
    console.error("Error loading users:", error);
  }
}
