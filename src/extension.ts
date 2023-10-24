// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

type items = vscode.QuickPickItem & { isProject: boolean; path: string };

async function showFolders(folderPath: string): Promise<items[]> {
    const folders = await fs.readdir(path.join(folderPath));
    const folderContent = await Promise.all(
        folders.map(folderName => fs.readdir(path.join(folderPath, folderName)))
    );

    return folders.map((folder, index) => {
        const isProject = folderContent[index].includes(".git");
        return {
            label: folder,
            iconPath: isProject ? new vscode.ThemeIcon("source-control") : vscode.ThemeIcon.Folder,
            path: path.join(folderPath, folder),
            isProject,
        };
    });
}

export async function activate(context: vscode.ExtensionContext) {
    const rootFolders = await showFolders("/home/beon/dev/projects");

    let disposable = vscode.commands.registerCommand(
        "quick-open-folder.quickOpenFolder",
        async () => {
            const folder = await vscode.window.showQuickPick(rootFolders, {
                placeHolder: "choose your folder",
            });

            if (typeof folder === "undefined") return;

            // vscode.workspace.updateWorkspaceFolders(0, null, { uri: vscode.Uri.file(folder.path) });
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(folder.path), {
                forceReuseWindow: true,
            });
        }
    );

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
