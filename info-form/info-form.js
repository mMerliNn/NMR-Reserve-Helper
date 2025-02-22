document.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.querySelector(".clear-btn");
  const saveButton = document.querySelector(".save-btn");

  clearButton.addEventListener("click", () => {
    document.querySelectorAll("input").forEach(input => {
      input.value = "";
    });
    document.getElementById("rsv_labuid").value = "0";
  });

  saveButton.onclick = () => {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const lab = document.getElementById("rsv_labuid").value;
    const facility = document.getElementById("rsv_facuid").value;

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !phone || lab === "0" || facility === "0") {
      alert("Please fill all fields and select a lab.");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const userInfo = {
      userName: name,
      userEmail: email,
      userPhone: phone,
      userLab: lab,
      userPassword: password,
      resFacility: facility,
    };

    chrome.storage.local.set({
      userInfo
    }, () => {
      console.log("User data saved:", userInfo);
    });
    // Return to main page after submitting valid user info
    const customInputBox = document.getElementById("custom-input-box");
    if (customInputBox) {
      window.location.href = "../popup.html";
    }
  };
});

document.addEventListener("DOMContentLoaded", () => {
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const phoneField = document.getElementById("phone");
  const labField = document.getElementById("rsv_labuid");
  const passwordField = document.getElementById("password");
  const faciltyField = document.getElementById("rsv_facuid");

  chrome.storage.local.get(["userInfo"], (data) => {
    if (data.userInfo) {
      if (data.userInfo.userName) nameField.value = data.userInfo.userName;
      if (data.userInfo.userEmail) emailField.value = data.userInfo.userEmail;
      if (data.userInfo.userPhone) phoneField.value = data.userInfo.userPhone;
      if (data.userInfo.userPassword) passwordField.value = data.userInfo.userPassword;
      if (data.userInfo.userLab) labField.value = data.userInfo.userLab;
      if (data.userInfo.resFacility) faciltyField.value = data.userInfo.resFacility;
    }
  });
});