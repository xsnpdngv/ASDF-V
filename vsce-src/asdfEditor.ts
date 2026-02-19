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

        // Listen for changes in the document
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                // Notify webview that the content is out of sync
                webviewPanel.webview.postMessage({
                    type: 'out-of-sync',
                    size: e.document.getText().length
                });
            }
        });

        webviewPanel.onDidDispose(() => {
            // Clean up the listener when the panel closes
            changeDocumentSubscription.dispose();

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

        // Message Handling
        webviewPanel.webview.onDidReceiveMessage(msg => {
            switch (msg.type) {
                case 'ready': // Send initial content
                    this.postUpdate('initial', webviewPanel, document);
                    break;
                case 'resync': // Handle manual resync request from the UI
                    this.postUpdate('update', webviewPanel, document);
                    break;
            }
        });
    }

    // Helper to send the update message with current text
    private postUpdate(type: string, panel: vscode.WebviewPanel, document: vscode.TextDocument) {
        panel.webview.postMessage({
            type: type,
            text: document.getText()
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
