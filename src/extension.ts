
// import * as vscode from 'vscode';
// import { RouteProvider, RouteItem } from './RouteProvider';

// export function activate(context: vscode.ExtensionContext) {
  
//   const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

//   // ✅ Pass `context` to RouteProvider
//   const routeProvider = new RouteProvider(rootPath, context);

//   // Register the Tree View provider
//   vscode.window.registerTreeDataProvider('nextjsRoutes', routeProvider);

//   // Register commands
//   context.subscriptions.push(
//     vscode.commands.registerCommand('nextjsRoutes.filterRoutes', async () => {
//   const input = await vscode.window.showInputBox({
//     prompt: 'Filter routes (e.g., /dashboard or user)',
//     placeHolder: 'Type part of the route path to filter',
//   });

//   routeProvider.setFilter(input ?? '');
// }),

//     vscode.commands.registerCommand('nextjsRoutes.refresh', () => {
//       routeProvider.refresh();
//     }),
    

//     vscode.commands.registerCommand('nextjsRoutes.simulateNavigation', (item: RouteItem) => {
//       vscode.window.showInformationMessage(`Simulated navigation to: ${item.label}`);
//     }),

//     vscode.commands.registerCommand('nextjsRoutes.show', () => {
//       vscode.commands.executeCommand('workbench.view.explorer');
//       vscode.commands.executeCommand('workbench.view.extension.nextjsRoutes');
//     })
//   );
// }

// export function deactivate() {}

// -------- extension.ts --------
import * as vscode from 'vscode';
import { RouteProvider, RouteItem } from './RouteProvider';

export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  const routeProvider = new RouteProvider(rootPath, context);

  vscode.window.registerTreeDataProvider('nextjsRoutes', routeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('nextjsRoutes.refresh', () => {
      routeProvider.refresh();
    }),

    vscode.commands.registerCommand('nextjsRoutes.filterRoutes', async () => {
      const query = await vscode.window.showInputBox({
        placeHolder: 'Type route to filter (e.g., /dashboard)'
      });
      if (query !== undefined) {
        routeProvider.setFilter(query);
      }
    }),

    vscode.commands.registerCommand('nextjsRoutes.simulateNavigation', (item: RouteItem) => {
      vscode.window.showInformationMessage(`Simulated navigation to: ${item.label}`);
    }),

    vscode.commands.registerCommand('nextjsRoutes.show', () => {
      vscode.commands.executeCommand('workbench.view.explorer');
      vscode.commands.executeCommand('workbench.view.extension.nextjsRoutes');
    })
  );
}

export function deactivate() {}