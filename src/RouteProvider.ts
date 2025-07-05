import * as vscode from 'vscode';
import * as path from 'path';

export class RouteItem extends vscode.TreeItem {
  constructor(
    public readonly label: string | vscode.TreeItemLabel,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly fullPath: string,
    iconPath?: vscode.ThemeIcon | vscode.Uri | { light: vscode.Uri; dark: vscode.Uri }
  ) {
    super(label, collapsibleState);
    this.tooltip = fullPath;
    this.description = fullPath;
    this.contextValue = 'routeItem';
    this.resourceUri = vscode.Uri.file(fullPath);

    this.command = {
      command: 'vscode.open',
      title: 'Open Route File',
      arguments: [this.resourceUri]
    };

    if (iconPath) {
      this.iconPath = iconPath;
    }
  }
}

export class RouteProvider implements vscode.TreeDataProvider<RouteItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RouteItem | undefined | void> =
    new vscode.EventEmitter<RouteItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<RouteItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private watcher: vscode.FileSystemWatcher | undefined;
  private filter: string = '';

  constructor(
    private workspaceRoot: string | undefined,
    private context: vscode.ExtensionContext
  ) {
    if (workspaceRoot) {
      const pattern = new vscode.RelativePattern(
        workspaceRoot,
        '{pages,app}/**/*.{js,ts,jsx,tsx}'
      );
      this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

      this.watcher.onDidCreate(() => this.refresh());
      this.watcher.onDidDelete(() => this.refresh());
      this.watcher.onDidChange(() => this.refresh());
    }
  }

  setFilter(query: string) {
    this.filter = query.trim().toLowerCase();
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RouteItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: RouteItem): Promise<RouteItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No workspace folder open');
      return [];
    }

    const basePath = element ? element.fullPath : this.workspaceRoot;

    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(basePath, '{pages,app}/**/*.{js,ts,jsx,tsx}'),
      '**/node_modules/**'
    );

    const routeItems: RouteItem[] = [];
    const seenRoutes = new Set<string>();

    for (const file of files) {
      const relative = path.relative(this.workspaceRoot, file.fsPath);
      const routePath = relative
        .replace(/\.(jsx?|tsx?)$/, '')
        .replace(/[\\/]+index$/, '')
        .replace(/\[\.\.\.(.*?)\]/g, ':$1*')
        .replace(/\[(.*?)\]/g, ':$1');

      if (seenRoutes.has(routePath)) continue;
      seenRoutes.add(routePath);

      if (this.filter && !routePath.toLowerCase().includes(this.filter)) continue;

      const label: vscode.TreeItemLabel = {
        label: routePath,
        highlights: []
      };

      const isAppRoute = relative.startsWith('app' + path.sep);
      let iconFile = isAppRoute ? 'app-icon.svg' : 'page-icon.svg';

      if (/\[\[\.{3}.*\]\]/.test(file.fsPath)) {
        iconFile = 'optional-catchall-icon.svg';
        label.highlights = getHighlights(routePath, ':');
      } else if (/\[\.{3}.*\]/.test(file.fsPath)) {
        iconFile = 'catchall-icon.svg';
        label.highlights = getHighlights(routePath, ':');
      } else if (/\[.*\]/.test(file.fsPath)) {
        iconFile = 'dynamic-icon.svg';
        label.highlights = getHighlights(routePath, ':');
      }

      const iconPath = {
        light: vscode.Uri.file(
          this.context.asAbsolutePath(path.join('resources', iconFile))
        ),
        dark: vscode.Uri.file(
          this.context.asAbsolutePath(path.join('resources', iconFile))
        )
      };

      const item = new RouteItem(label, vscode.TreeItemCollapsibleState.None, file.fsPath, iconPath);
      routeItems.push(item);
    }

    return routeItems.sort((a, b) => {
      const aLabel = typeof a.label === 'string' ? a.label : a.label.label;
      const bLabel = typeof b.label === 'string' ? b.label : b.label.label;
      return aLabel.localeCompare(bLabel);
    });
  }

  dispose() {
    this.watcher?.dispose();
  }
}

function getHighlights(label: string, marker: string): [number, number][] {
  const highlights: [number, number][] = [];
  let index = label.indexOf(marker);
  while (index !== -1) {
    const end = label.indexOf('/', index);
    const length = (end === -1 ? label.length : end) - index;
    highlights.push([index, index + length]);
    index = label.indexOf(marker, index + 1);
  }
  return highlights;
}
