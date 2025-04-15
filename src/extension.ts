import * as vscode from 'vscode';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    const openIntegratedCommand = vscode.commands.registerCommand('extension.openKclientIntegrated', async () => {
        const ip = await getNetworkDeviceIP();
        if (!ip) {
            vscode.window.showErrorMessage('No valid network device IP found. Please check your network configuration.');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'remoteDesktopClient',
            'kclient Remote Desktop (Integrated)',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        const url = `https://${ip}:8445`;

        panel.webview.html = getWebViewContent(url);
    });

    const openExternalCommand = vscode.commands.registerCommand('extension.openKclientExternal', async () => {
        const ip = await getNetworkDeviceIP();
        if (!ip) {
            vscode.window.showErrorMessage('No valid network device IP found. Please check your network configuration.');
            return;
        }

        const url = `https://${ip}:8445`;
        const opened = await vscode.env.openExternal(vscode.Uri.parse(url));
        if (opened) {
            vscode.window.showInformationMessage(`Opened kclient Remote Desktop in external browser: ${url}`);
        } else {
            vscode.window.showErrorMessage('Failed to open the external browser.');
        }
    });

    context.subscriptions.push(openIntegratedCommand, openExternalCommand);
}

export function deactivate() {}

async function getNetworkDeviceIP(): Promise<string | null> {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal && iface.address) {
                ips.push(iface.address);
            }
        }
    }

    if (ips.length === 0) {
        return null;
    }

    const selectedIP = await vscode.window.showQuickPick(ips, {
        placeHolder: 'Select the IP address of the network device to use',
    });

    return selectedIP ?? null;
}

function getWebViewContent(url: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>kclient Remote Desktop</title>
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
            </style>
        </head>
        <body>
            <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
        </body>
        </html>
    `;
}