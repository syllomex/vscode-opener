const { app, Tray, Menu, dialog, shell } = require("electron");
const Store = require("electron-store");
const { join } = require("path");
const { spawnSync, exec } = require("child_process");

const store = new Store();

function AddProject() {
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((path) => {
    if (path.canceled) return;

    let directory = path.filePaths[0];
    let dirNameArray = directory.split("\\");
    let pos = dirNameArray.length - 1;
    let dirName = dirNameArray[pos];

    store.set(dirName, directory);

    app.emit("refresh");
  });
}

function RemoveProject({ key }) {
  store.delete(key);
  app.emit("refresh");
}

function OpenProject({ key }) {
  let projectPath = store.get(key);
  spawnSync("code.cmd", [projectPath]);
}

function OpenFolder({ key }) {
  let projectPath = store.get(key);
  shell.openPath(projectPath);
}

function OpenInTerminal({ key }) {
  let projectPath = store.get(key);
  let disk = projectPath.slice(0, 1);
  exec(`start cmd.exe /K cd /${disk} ${projectPath}`);
}

app.on("ready", () => {
  const tray = new Tray(join(__dirname, "assets", "icon.png"));

  app.on("refresh", () => {
    let keys = Object.keys(store.get());
    let projects = [];
    let removeProjects = [];
    let folderProjects = [];
    let terminalProjects = [];

    keys.map((key) => {
      projects.push({
        label: key,
        click: () => {
          OpenProject({ key });
        },
      });
      removeProjects.push({
        label: key,
        click: () => RemoveProject({ key }),
      });
      folderProjects.push({
        label: key,
        click: () => OpenFolder({ key }),
      });
      terminalProjects.push({
        label: key,
        click: () => OpenInTerminal({ key }),
      });
    });

    const contextMenu = Menu.buildFromTemplate([
      ...projects,
      { type: "separator" },
      {
        label: "Adicionar Projeto",
        type: "normal",
        click: () => {
          AddProject();
        },
      },
      {
        label: "Abrir no Explorer",
        submenu: [...folderProjects],
      },
      {
        label: "Abrir no Terminal",
        submenu: [...terminalProjects],
      },
      {
        label: "Remover Projeto",
        submenu: [...removeProjects],
      },
      { type: "separator" },
      { label: "Sair", click: () => app.quit() },
    ]);

    tray.setContextMenu(contextMenu);
  });

  app.emit("refresh");
  tray.setToolTip("VSCode Projects");
});
