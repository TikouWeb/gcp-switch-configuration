import vscode from "vscode";
import { createHtmlHead } from "../../helpers";
import { loadingSpinner } from "./loading-spinner";

type LoadingPageProps = {
  extensionContext: vscode.ExtensionContext;
  panel: vscode.WebviewPanel;
};

export const loadingPage = ({ extensionContext, panel }: LoadingPageProps) => {
  return `
          <!DOCTYPE html>
          <html lang="en">
            ${createHtmlHead(extensionContext, panel)}
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
