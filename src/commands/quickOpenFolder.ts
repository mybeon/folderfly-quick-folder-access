import * as vscode from "vscode";
import type { Items } from "../utils/folders";
import { showFolders } from "../utils/folders";

export default async function (rootFolders: Items[]) {
    if (rootFolders.length > 0) {
        await showFolders(rootFolders);
    } else {
        vscode.window
            .showInformationMessage(
                "You have to configure the default path to a valid path",
                "Choose default folder",
                "go to settings"
            )
            .then(async selection => {
                if (selection === "Choose default folder") {
                    const selectFolder = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        title: "Select folder",
                    });

                    if (selectFolder?.length) {
                        await vscode.workspace
                            .getConfiguration("quickOpenFolder.required")
                            .update(
                                "folderPath",
                                selectFolder[0].path,
                                vscode.ConfigurationTarget.Global
                            );

                        vscode.window.showInformationMessage(
                            "The default folder path has been successfully configured."
                        );
                    }
                }

                if (selection === "go to settings") {
                    vscode.commands.executeCommand(
                        "workbench.action.openSettings",
                        "quickOpenFolder.required.folderPath"
                    );
                }
            });
    }
}
