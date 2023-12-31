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
    if (folders.length === 0)
        return vscode.window.showErrorMessage(
            vscode.l10n.t("Couldn't find any additional subdirectories !")
        );

    const folder = await vscode.window.showQuickPick(folders, {
        placeHolder: vscode.l10n.t("Choose a project"),
    });

    if (typeof folder === "undefined") return;

    if (folder.isProject) {
        vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(folder.path), {
            forceReuseWindow: true,
        });
    } else {
        const childrenFolders = await getFolders(folder.path);

        showFolders(childrenFolders);
    }
}

async function getDefaultFolderPath() {
    return await vscode.workspace.getConfiguration("folderfly.required").get("folderPath");
}

export async function activate(context: vscode.ExtensionContext) {
    const defaultFolderPath = await getDefaultFolderPath();

    let rootFolders: Items[] = [];

    vscode.workspace.onDidChangeConfiguration(async event => {
        const affected = event.affectsConfiguration("folderfly.required.folderPath");

        if (affected) {
            const updatedDefaultFolderPath = await getDefaultFolderPath();

            if (typeof updatedDefaultFolderPath === "string") {
                rootFolders = await getFolders(updatedDefaultFolderPath);
            }
        }
    });

    if (typeof defaultFolderPath === "string") {
        rootFolders = await getFolders(defaultFolderPath);
    }

    let disposable = vscode.commands.registerCommand("folderfly.openFolder", async () => {
        if (rootFolders.length > 0) {
            await showFolders(rootFolders);
        } else {
            vscode.window
                .showInformationMessage(
                    vscode.l10n.t("This extension requires a valid path to an existing folder."),
                    vscode.l10n.t("Choose default folder"),
                    vscode.l10n.t("go to settings")
                )
                .then(async selection => {
                    if (selection === vscode.l10n.t("Choose default folder")) {
                        const selectFolder = await vscode.window.showOpenDialog({
                            canSelectFiles: false,
                            canSelectFolders: true,
                            canSelectMany: false,
                            title: vscode.l10n.t("Select folder"),
                        });

                        if (selectFolder?.length) {
                            let path = selectFolder[0].path;

                            // checks if path starts with /C: type
                            if (/^\/[a-zA-Z]:/.test(path)) {
                                path = path.substring(1);
                            }

                            await vscode.workspace
                                .getConfiguration("folderfly.required")
                                .update("folderPath", path, vscode.ConfigurationTarget.Global);

                            vscode.window.showInformationMessage(
                                vscode.l10n.t(
                                    "The default folder path has been successfully configured."
                                )
                            );
                        }
                    }

                    if (selection === vscode.l10n.t("go to settings")) {
                        vscode.commands.executeCommand(
                            "workbench.action.openSettings",
                            "folderfly.required.folderPath"
                        );
                    }
                });
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
