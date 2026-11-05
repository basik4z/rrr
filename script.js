
"use strict";

/* NEBULA ROBLOX FACTORY PRO
   Configuration: Windows 10 / VirtualBox
*/

const NEBULA_CONFIG = {
  vm: {
    name: "NEBULA-WINDOWS-10",
    os: "Windows 10",
    ramMB: 8192,
    cpu: 4,
    diskGB: 80,
    diskPath: "NEBULA-WINDOWS-10.vdi"
  },
  iso: {
    name: "Windows 10 ISO",
    source: "https://www.microsoft.com/software-download/windows10"
  }
};

const state = {
  vmCreated: false,
  vmRunning: false,
  logs: [],
  notes: []
};

const $ = id => document.getElementById(id);

function addLog(message) {
  const time = new Date().toLocaleTimeString();
  state.logs.unshift(`[${time}] ${message}`);

  const output = $("logs-list") || $("log");
  if (output) {
    output.textContent = state.logs.join("\n");
  }

  console.log("[NEBULA]", message);
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  const titles = {
    dashboard: "Dashboard",
    machines: "Virtual Machines",
    browser: "Browser Assistant",
    accounts: "Account Manager",
    logs: "Activity Logs",
    settings: "Settings"
  };

  if ($("page-title")) {
    $("page-title").textContent = titles[page] || "NEBULA";
  }

  addLog("Открыт раздел: " + page);
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* Демонстрация состояния VM.
   Настоящее управление будет подключено
   через отдельный локальный агент VirtualBox.
*/

function demoVM(number, start) {
  const status = $("vm-status-" + number);
  const bar = $("vm-bar-" + number);

  if (status) {
    status.textContent = start
      ? "● ТЕСТОВЫЙ ЗАПУСК"
      : "● НЕ ПОДКЛЮЧЕНА";
  }

  if (bar) {
    bar.style.width = start ? "100%" : "0%";
  }

  if (number === 1) {
    state.vmRunning = start;
  }

  addLog(
    "VM " + number + ": " +
    (start ? "демонстрационный запуск" : "остановлена")
  );
}

/* Конфигурация будущей VM */

function getVMConfig() {
  return {
    name: NEBULA_CONFIG.vm.name,
    os: NEBULA_CONFIG.vm.os,
    memory: NEBULA_CONFIG.vm.ramMB,
    cpus: NEBULA_CONFIG.vm.cpu,
    disk: NEBULA_CONFIG.vm.diskGB
  };
}

/* Генерация команд для VirtualBox.
   Команды пока не выполняются в браузере.
*/

function generateVMCommands() {
  const vm = NEBULA_CONFIG.vm;

  return [
    `VBoxManage createvm --name "${vm.name}" --ostype Windows10_64 --register`,
    `VBoxManage modifyvm "${vm.name}" --memory ${vm.ramMB} --cpus ${vm.cpu}`,
    `VBoxManage createmedium disk --filename "${vm.diskPath}" --size ${vm.diskGB * 1024}`,
    `VBoxManage storagectl "${vm.name}" --name "SATA" --add sata --controller IntelAhci`,
    `VBoxManage storageattach "${vm.name}" --storagectl "SATA" --port 0 --device 0 --type hdd --medium "${vm.diskPath}"`
  ].join("\n");
}

function saveNote() {
  const input = $("account-note");
  if (!input || !input.value.trim()) {
    addLog("Введите текст заметки");
    return;
  }

  state.notes.push(input.value.trim());
  input.value = "";

  const output = $("notes");
  if (output) {
    output.replaceChildren();

    state.notes.forEach(note => {
      const item = document.createElement("p");
      item.textContent = "• " + note;
      output.appendChild(item);
    });
  }

  addLog("Заметка сохранена");
}

function clearLogs() {
  state.logs = [];

  const output = $("logs-list") || $("log");
  if (output) output.textContent = "";

  addLog("Журнал очищен");
}

function openWindowsDownload() {
  window.open(
    NEBULA_CONFIG.iso.source,
    "_blank",
    "noopener"
  );

  addLog("Открыта страница загрузки Windows 10 от Microsoft");
}

function initializeNebula() {
  addLog("NEBULA ROBLOX FACTORY PRO запущена");
  addLog("Конфигурация Windows 10 загружена");
  addLog("RAM: 8 GB | CPU: 4 | DISK: 80 GB");
  addLog("Ожидание подключения VirtualBox Agent");
}

initializeNebula();

window.NEBULA = {
  config: NEBULA_CONFIG,
  getVMConfig,
  generateVMCommands,
  demoVM,
  showPage,
  addLog,
  openWindowsDownload
};
