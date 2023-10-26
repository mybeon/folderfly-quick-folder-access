// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import quickOpenFolder from "./commands/quickOpenFolder";
import type { Items } from "./utils/folders";
import { getFolders } from "./utils/folders";
import getDefaultFolderPath from "./utils/getDefaultFolderPath";

export async function activate(context: vscode.ExtensionContext) {
    const defaultFolderPath = await getDefaultFolderPath();

    let rootFolders: Items[] = [];

    vscode.workspace.onDidChangeConfiguration(async event => {
        const affected = event.affectsConfiguration("quickOpenFolder.required.folderPath");

        if (affected) {
            const updatedDefaultFolderPath = await getDefaultFolderPath();
            rootFolders = await getFolders(updatedDefaultFolderPath);
        }
    });

    rootFolders = await getFolders(defaultFolderPath);

    let disposable = vscode.commands.registerCommand("quick-open-folder.quickOpenFolder", () => {
        quickOpenFolder(rootFolders);
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
