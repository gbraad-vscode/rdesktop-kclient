import * as vscode from 'vscode';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    const openRemoteDesktopCommand = vscode.commands.registerCommand('kclient.openRemoteDesktop', async () => {
        const ips = getNetworkIPs();
        if (ips.length === 0) {
            vscode.window.showErrorMessage('No active network devices found.');
            return;
        }

        const selectedIP = await vscode.window.showQuickPick(ips, {
            placeHolder: 'Select the IP address of the network device to use',
        });

        if (!selectedIP) {
            vscode.window.showWarningMessage('Operation cancelled. No IP address selected.');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'remoteDesktopClient',
            'Remote Desktop Client',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        const url = `https://${selectedIP}:8445`;

        // Embed the webpage in the WebView
        panel.webview.html = getWebViewContent(url);

        // Add convenience button to open externally
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'openExternal') {
                vscode.env.openExternal(vscode.Uri.parse(url));
            }
        });
    });

    context.subscriptions.push(openRemoteDesktopCommand);
}

export function deactivate() {}

function getNetworkIPs(): string[] {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal && iface.address) {
                ips.push(iface.address);
            }
        }
    }

    return ips;
}

function getWebViewContent(url: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Remote Desktop Client</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                iframe {
                    flex: 1;
                    border: none;
                }
                button {
                    padding: 10px;
                    margin: 5px;
                    font-size: 14px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <button id="openExternal">Open in External Browser</button>
            <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('openExternal').addEventListener('click', () => {
                    vscode.postMessage({ command: 'openExternal' });
                });
            </script>
        </body>
        </html>
    `;
}