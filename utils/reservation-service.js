export async function makeReservation() {
  const dynamicTxt = document.getElementById("dynamic-text");
  const refreshButton = document.getElementById("fetch");
  // JEOL JNM-ECS400. TODO: include all facilities
  // const FACILITY_UID = "7"; 
  let FACILITY_UID;
  const API_ENDPOINT = "https://www.chem.s.u-tokyo.ac.jp/users/facility/home/system/index.cgi";

  try {
    // Single storage fetch for all required data
    const storageData = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["timeData", "userInfo", "webAuthentication", "ymd"], (data) => {
        const missing = [];
        if (!data.timeData) missing.push("timeData");
        if (!data.userInfo) missing.push("userInfo");
        if (!data.webAuthentication) missing.push("webAuthentication");
        if (!data.ymd) missing.push("ymd");
        if (!data.userInfo.resFacility) missing.push("facilityUid");

        if (missing.length) {
          dynamicTxt.textContent = `Missing: ${missing.join(", ")}`;
          reject(new Error(`Missing: ${missing.join(", ")}`));
        } else {
          resolve(data);
        }
      });
    });

    const { timeData, userInfo, webAuthentication, ymd: ymdFull } = storageData;

    FACILITY_UID = userInfo.resFacility;

    // Password as authentication header
    const authHeader = `Basic ${btoa(
      `${atob(webAuthentication.webUsername)}:${atob(webAuthentication.webPassword)}`
    )}`;

    // Identify cross-day reservations
    const startDate = dayjs(ymdFull.replace(/,/g, '-'));
    const startTimeMinutes = Number(timeData.startHour) * 60 + Number(timeData.startMinute);
    const endTimeMinutes = Number(timeData.endHour) * 60 + Number(timeData.endMinute);
    
    let endDate = dayjs(startDate);
    if (endTimeMinutes <= startTimeMinutes) {
      endDate = endDate.add(1, 'day');
    }

    const formatDatePart = (date, format) => date.format(format);
    const [year, month, day] = startDate.format('YYYY,M,D').split(',');
    const [year2, month2, day2] = endDate.format('YYYY,M,D').split(',');

    // First POST request
    const postParams1 = new URLSearchParams({
      p: "rqcf",
      fac_uid: FACILITY_UID,
      ymd: ymdFull,
      year, month, day,
      rsv_sth: timeData.startHour,
      rsv_stm: timeData.startMinute,
      year2, month2, day2,
      rsv_edh: timeData.endHour,
      rsv_edm: timeData.endMinute,
      rsv_inilec: "0",
      rsv_name: userInfo.userName,
      rsv_email: userInfo.userEmail,
      rsv_labuid: userInfo.userLab,
      rsv_labname: "",
      rsv_telext: userInfo.userPhone,
      rsv_user: "",
      rsv_delpass: userInfo.userPassword,
      rsv_det: "",
      rsv_cont: ""
    });

    const response1 = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authHeader,
      },
      body: postParams1
    });

    const html1 = await response1.text();
    const doc = new DOMParser().parseFromString(html1, "text/html");
    const sid = doc.querySelector("input[name='sid']")?.value;
    const ymd = doc.querySelector("input[name='ymd']")?.value || ymdFull;

    // Likely caused by missing selection
    if (!sid) throw new Error("Reservation missing");

    // Second POST request
    const postParams2 = new URLSearchParams({
      p: "reqs",
      cof: "1",
      sid,
      ymd
    });

    const response2 = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authHeader,
      },
      body: postParams2
    });

    // Handle final result
    const finalHtml = await response2.text();
    const resultDoc = new DOMParser().parseFromString(finalHtml, "text/html");
    const resultTitle = resultDoc.querySelector("title")?.textContent.trim();

    if (resultTitle === "Reserved") {
      dynamicTxt.textContent = "Reservation Complete!";
      refreshButton?.click();
      
      const existingSelection = document.querySelector(".selection-rectangle");
      existingSelection?.remove();
      chrome.storage.local.set({ timeData: {} });
    } else {
      throw new Error("Unexpected result");
    }

  } catch (error) {
    console.info("Reservation failed:", error);
    dynamicTxt.textContent = `${error}`;
    // refreshButton?.click();
  }
}