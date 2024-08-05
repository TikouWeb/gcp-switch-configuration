import vscode from "vscode";

export const htmlHeadTemplate = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview
) => {
  const codiconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css"
    )
  );

  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "assets", "styles.css")
  );

  return `
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" font-src ${webview.cspSource}; style-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GCP Switch Configuration</title>
        <link href="${stylesUri}" rel="stylesheet"/>
        <link href="${codiconsUri}" rel="stylesheet" />
      </head>
    `;
};
