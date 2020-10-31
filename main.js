const { app, Tray, Menu, dialog, shell } = require("electron");
const Store = require("electron-store");
const { join } = require("path");
const { spawnSync, exec } = require("child_process");

const store = new Store();

function AddProject() {
  const path = dialog.showOpenDialogSync({ properties: ["openDirectory"] });
  if (!path) return;

  let directory = path[0];
  let dirNameArray = directory.split("\\");
  let pos = dirNameArray.length - 1;
  let dirName = dirNameArray[pos];

  if (process.platform === "linux") {
    let splitted = dirName.split("/");
    dirName = splitted[splitted.length - 1];
  }

  store.set(dirName, directory);
  app.emit("refresh");
}

function RemoveProject({ key }) {
  store.delete(key);
  app.emit("refresh");
}

function OpenProject({ key }) {
  let projectPath = store.get(key);
  if (process.platform === "win32") {
    spawnSync("code.cmd", [projectPath]);
  } else {
    spawnSync("code", [projectPath]);
  }
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
    const menu = [
      ...projects,
      { type: "separator" },
      {
        label: "Adicionar Projeto",
        type: "normal",
        click: () => {
          AddProject();
        },
      },
    ];

    if (keys.length > 0) {
      menu.push({
        label:
          process.platform === "win32"
            ? "Abrir no Explorer"
            : "Abrir Diretório",
        submenu: [...folderProjects],
      });
      if (process.platform === "win32") {
        menu.push({
          label: "Abrir no Terminal",
          submenu: [...terminalProjects],
        });
      }
      menu.push({
        label: "Remover Projeto",
        submenu: [...removeProjects],
      });
    }

    menu.push(
      { type: "separator" },
      { label: "Sair", click: () => app.quit() }
    );

    const contextMenu = Menu.buildFromTemplate(menu);

    tray.setContextMenu(contextMenu);
  });

  app.emit("refresh");
  tray.setToolTip("VSProjects");
  tray.setTitle("VSProjects");
});
