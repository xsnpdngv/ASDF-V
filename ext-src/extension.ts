import * as vscode from 'vscode';
import { AsdfEditorProvider } from './asdfEditor';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            AsdfEditorProvider.viewType,
            new AsdfEditorProvider(context)
        )
    );
}
export function deactivate() {}
