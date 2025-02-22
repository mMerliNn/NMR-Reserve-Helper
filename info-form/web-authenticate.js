document.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.querySelector(".clear-btn");
  const saveButton = document.querySelector(".save-btn");

  clearButton.addEventListener("click", () => {
      document.querySelectorAll("input").forEach(input => {
          input.value = "";
      });
  });

  saveButton.onclick = () => {

    // Store website username and password in base64
      const webUsername = btoa(document.getElementById("web-username").value);
      const webPassword = btoa(document.getElementById("web-password").value);

      const webAuthentication = {
          webUsername: webUsername,
          webPassword: webPassword
      };

      // Save website authentication information to Chrome storage
      chrome.storage.local.set({ webAuthentication }, () => {
          console.log("User data saved:", webAuthentication);
      });

      // Remove the form after submission
      const customInputBox = document.getElementById("custom-input-box");
      if (customInputBox) {
          // document.body.removeChild(customInputBox);
          // Navigate to the previous page (popup.html)
          window.location.href = "../popup.html";
      }
  };
});

document.addEventListener("DOMContentLoaded", () => {
  // Get Popup elements
  const webUsername = document.getElementById("web-username");
  const webPassword = document.getElementById("web-password");

  chrome.storage.local.get(["webAuthentication"] , (data) => {
    if (data.webAuthentication) {
      if (data.webAuthentication.webUsername) webUsername.placeholder = `Something Saved`;
      if (data.webAuthentication.webPassword) webPassword.placeholder = `Something Saved`;
    }
  });
});


