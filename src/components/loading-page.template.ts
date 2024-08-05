import vscode from "vscode";
import { loadingSpinner } from "./loading-spinner.template";
import { htmlHeadTemplate } from "./html-head.template";

type LoadingPageProps = {
  context: vscode.ExtensionContext;
  webview: vscode.Webview;
};

export const loadingPage = ({ context, webview }: LoadingPageProps) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
            ${htmlHeadTemplate(context, webview)}
            <style>
                .loading-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100vh;
                }
            </style>

            <body>
                <div class="loading-container">
                    ${loadingSpinner({ size: "xlarge" })}
                </div>
            </body>
          </html>
      `;
};
