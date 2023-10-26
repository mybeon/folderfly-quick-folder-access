import * as vscode from "vscode";

export default async function (): Promise<string | undefined> {
    return await vscode.workspace.getConfiguration("quickOpenFolder.required").get("folderPath");
}
