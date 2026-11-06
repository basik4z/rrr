
const $ = id => document.getElementById(id);

let logs = ["NEBULA initialized"];

function log(message){
  logs.unshift(new Date().toLocaleTimeString()+" — "+message);
  $("log-list").innerHTML = logs.map(x=>`<div>${x}</div>`).join("");
}

function showPage(name){
  document.querySelectorAll(".page").forEach(p=>{
    p.classList.toggle("active",p.id===name);
  });

  document.querySelectorAll("[data-page]").forEach(b=>{
    b.classList.toggle("active",b.dataset.page===name);
  });

  const titles={
    dashboard:"Dashboard",
    cloud:"Cloud PC",
    roblox:"Roblox Agent",
    accounts:"Accounts",
    logs:"Activity Logs",
    settings:"Settings"
  };

  $("page-title").textContent=titles[name]||name;
  log("Opened "+name);
}

document.querySelectorAll("[data-page]").forEach(button=>{
  button.addEventListener("click",()=>{
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button=>{
  button.addEventListener("click",()=>{
    showPage(button.dataset.go);
  });
});

$("create").onclick=()=>{
  $("cloud-message").textContent=
    "Cloud provider not connected. Cannot create VM.";
  log("VM creation requested — cloud unavailable");
};

document.querySelectorAll('[data-action="start"]').forEach(button=>{
  button.onclick=()=>{
    alert("Cloud PC is not connected.");
    log("Start requested");
  };
});

document.querySelectorAll('[data-action="stop"]').forEach(button=>{
  button.onclick=()=>{
    alert("Cloud PC is not connected.");
    log("Stop requested");
  };
});

$("install").onclick=()=>{
  $("agent-message").textContent=
    "Connect a Windows cloud PC first.";
};

$("launch").onclick=()=>{
  $("agent-message").textContent=
    "Roblox cannot launch: cloud PC offline.";
};

$("save-account").onclick=()=>{
  $("account-message").textContent="Saved locally in this session.";
  log("Account note saved");
};

$("clear-logs").onclick=()=>{
  logs=[];
  $("log-list").innerHTML="Logs cleared.";
};

$("refresh").onclick=()=>{
  log("Dashboard refreshed");
};

$("notifications").onclick=()=>{
  alert("No new notifications.");
};

$("test").onclick=()=>{
  $("settings-message").textContent=
    "Cloud provider is not configured.";
};

log("Interface ready");
