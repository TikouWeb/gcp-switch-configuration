import * as vscode from "vscode";
import { OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND } from "./constants";
import { globalCache } from "./global-cache";

interface GcpStatusBarConfig {
  configName: string;
  command: string;
  alignment: vscode.StatusBarAlignment;
  priority: number;
}

export class GcpConfigStatusBarItemManager {
  private static instance: GcpConfigStatusBarItemManager;
  private statusBarItem: vscode.StatusBarItem | null = null;
  private config: GcpStatusBarConfig;

  private constructor(private context: vscode.ExtensionContext) {
    this.config = {
      configName: "",
      command: OPEN_DASHBOARD_WEBVIEW_PANEL_COMMAND,
      alignment: vscode.StatusBarAlignment.Left,
      priority: 0,
    };
  }

  // only one instance of GcpStatusBarManager is allowed to exist
  static getInstance(
    context: vscode.ExtensionContext
  ): GcpConfigStatusBarItemManager {
    if (!GcpConfigStatusBarItemManager.instance) {
      GcpConfigStatusBarItemManager.instance =
        new GcpConfigStatusBarItemManager(context);
    }
    return GcpConfigStatusBarItemManager.instance;
  }

  initialize(config: Partial<GcpStatusBarConfig> = {}): void {
    const activeGcpConfiguration = globalCache(
      this.context
    ).getActiveGcpConfiguration();

    this.config = {
      ...this.config,
      ...config,
      configName: activeGcpConfiguration?.name || "No gcp active config",
    };

    this.statusBarItem = vscode.window.createStatusBarItem(
      this.config.alignment,
      this.config.priority
    );
    this.statusBarItem.command = this.config.command;
    this.statusBarItem.show();

    this.updateStatusBarItem({ configName: this.config.configName });

    this.context.subscriptions.push(this.statusBarItem);
  }

  updateStatusBarItem(config: Partial<GcpStatusBarConfig>): void {
    this.ensureStatusBarItemExists();
    this.config = { ...this.config, ...config };
    this.statusBarItem!.text = this.getText();
    this.statusBarItem!.tooltip = this.getTooltip();
  }

  showStatusBarItem(): void {
    this.ensureStatusBarItemExists();
    this.statusBarItem!.show();
  }

  hideStatusBarItem(): void {
    this.ensureStatusBarItemExists();
    this.statusBarItem!.hide();
  }

  setPendingState(isPending: boolean): void {
    this.ensureStatusBarItemExists();
    this.statusBarItem!.text = isPending
      ? this.getPendingText()
      : this.getText();
  }

  dispose(): void {
    if (this.statusBarItem) {
      GcpConfigStatusBarItemManager.instance.dispose();
    }
  }

  private getText(): string {
    return `$(cloud) | $(check)${this.config.configName.slice(0, 25)}`;
  }

  private getTooltip(): string {
    return `Open dashboard \n Active config: ${this.config.configName}`;
  }

  private getPendingText(): string {
    return `$(cloud) | $(sync~spin) Switching...`;
  }

  private ensureStatusBarItemExists(): void {
    if (!this.statusBarItem) {
      throw new Error(
        "Status bar item has not been created. Call createStatusBarItem first."
      );
    }
  }
}
