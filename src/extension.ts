// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

type Items = vscode.QuickPickItem & { isProject: boolean; path: string };

async function getFolders(folderPath: string): Promise<Items[]> {
    try {
        const folders = await fs.readdir(path.join(folderPath));
        const folderContent = await Promise.all(
            folders.map(folderName => fs.readdir(path.join(folderPath, folderName)))
        );

        return folders.map((folder, index) => {
            const isProject = folderContent[index].includes(".git");
            return {
                label: folder,
                iconPath: isProject
                    ? new vscode.ThemeIcon("source-control")
                    : vscode.ThemeIcon.Folder,
                path: path.join(folderPath, folder),
                isProject,
            };
        });
    } catch (e) {
        return [];
    }
}

async function showFolders(folders: Items[]) {
    if (folders.length === 0) return vscode.window.showErrorMessage("Can't go further !");

    const folder = await vscode.window.showQuickPick(folders, {
        placeHolder: "choose your folder",
    });

    if (typeof folder === "undefined") return;

    // vscode.workspace.updateWorkspaceFolders(0, null, { uri: vscode.Uri.file(folder.path) });

    if (folder.isProject) {
        vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(folder.path), {
            forceReuseWindow: true,
        });
    } else {
        const childrenFolders = await getFolders(folder.path);

        showFolders(childrenFolders);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    const rootFolders = await getFolders("/home/beon/dev");

    let disposable = vscode.commands.registerCommand(
        "quick-open-folder.quickOpenFolder",
        async () => {
            await showFolders(rootFolders);
        }
    );

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
