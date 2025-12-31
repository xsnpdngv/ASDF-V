import * as vscode from 'vscode';
import * as fs from 'fs';

export class AsdfEditorProvider implements vscode.CustomTextEditorProvider
{
    public static readonly viewType = 'asdf.preview';

    // Single active preview panel (always replaced, never reused)
    private static activePanel: vscode.WebviewPanel | undefined;

    constructor(private readonly context: vscode.ExtensionContext)
    {
    }

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel
    ): Promise<void>
    {
        // If VS Code restored this webview on startup, drop it.
        if (!webviewPanel.active) {
            webviewPanel.dispose();
            return;
        }

        // Always drop the previous preview
        if (AsdfEditorProvider.activePanel)
        {
            AsdfEditorProvider.activePanel.dispose();
            AsdfEditorProvider.activePanel = undefined;
        }

        // This panel becomes the active preview
        AsdfEditorProvider.activePanel = webviewPanel;

        // Configure webview
        webviewPanel.webview.options =
        {
            enableScripts: true,
            localResourceRoots:
            [
                this.context.extensionUri
            ]
        };

        // Set tab title explicitly (prevents stale names)
        webviewPanel.title =
            document.uri.path.split('/').pop() ?? 'ASDF Preview';

        // Load HTML
        webviewPanel.webview.html =
            this.getHtmlForWebview(webviewPanel.webview);

        // Push file contents into the webview
        const updateWebview = () =>
        {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText()
            });
        };

        // Update on document changes
        const changeSubscription =
            vscode.workspace.onDidChangeTextDocument(e =>
            {
                if (e.document.uri.toString() === document.uri.toString())
                {
                    updateWebview();
                }
            });

        // Cleanup
        webviewPanel.onDidDispose(() =>
        {
            if (AsdfEditorProvider.activePanel === webviewPanel)
            {
                AsdfEditorProvider.activePanel = undefined;
            }
            changeSubscription.dispose();
        });

        // Initial render
        updateWebview();
    }

    private getHtmlForWebview(webview: vscode.Webview): string
    {
        // Load webview.html from repo root
        const htmlPath = vscode.Uri.joinPath(
            this.context.extensionUri,
            'index.html'
        );

        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Rewrite relative src="" and href="" URLs
        html = html.replace(
            /(src|href)="([^"]+)"/g,
            (match, attr, value) =>
            {
                if (
                    value.startsWith('http') ||
                    value.startsWith('data:') ||
                    value.startsWith('#')
                )
                {
                    return match;
                }

                const resourceUri = webview.asWebviewUri(
                    vscode.Uri.joinPath(this.context.extensionUri, value)
                );

                return `${attr}="${resourceUri}"`;
            }
        );

        // Inject Content Security Policy
        const csp = `
            <meta http-equiv="Content-Security-Policy"
                  content="
                    default-src 'none';
                    img-src ${webview.cspSource} data:;
                    style-src ${webview.cspSource};
                    script-src ${webview.cspSource};
                  ">
        `;

        return html;
    }
}
