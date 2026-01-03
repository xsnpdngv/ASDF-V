import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class AsdfEditorProvider implements vscode.CustomTextEditorProvider {

    public static readonly viewType = 'asdf.preview';
    private static activePanel: vscode.WebviewPanel | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            AsdfEditorProvider.viewType,
            new AsdfEditorProvider(context),
            {
                supportsMultipleEditorsPerDocument: false
            }
        );
    }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void> {

        // If a preview already exists, kill it
        if (AsdfEditorProvider.activePanel) {
            AsdfEditorProvider.activePanel.dispose();
            AsdfEditorProvider.activePanel = undefined;
        }

        // Adopt the newly created panel
        AsdfEditorProvider.activePanel = webviewPanel;
        webviewPanel.reveal(webviewPanel.viewColumn, true);

        webviewPanel.onDidDispose(() => {
            if (AsdfEditorProvider.activePanel === webviewPanel) {
                AsdfEditorProvider.activePanel = undefined;
            }
        });

        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(this.context.extensionPath)
            ]
        };

        webviewPanel.webview.html = this.getHtml(webviewPanel.webview);

        const text = document.getText();

        // One-time handshake: new webview, guaranteed fresh
        webviewPanel.webview.onDidReceiveMessage(msg => {
            if (msg.type === 'ready') {
                webviewPanel.webview.postMessage({
                    type: 'update',
                    text
                });
            }
        });
    }

    private getHtml(webview: vscode.Webview): string {
        const htmlPath = path.join(this.context.extensionPath, 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        html = html.replace(
            /(src|href)="([^"]+)"/g,
            (_m, attr, rel) => {
                if (
                    rel.startsWith('http') ||
                    rel.startsWith('data:') ||
                    rel.startsWith('vscode-webview:')
                ) {
                    return `${attr}="${rel}"`;
                }

                const uri = webview.asWebviewUri(
                    vscode.Uri.file(path.join(this.context.extensionPath, rel))
                );
                return `${attr}="${uri}"`;
            }
        );

        return html;
    }
}
