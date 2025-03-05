import * as vscode from 'vscode';
import { join, basename } from 'path';
import { FilterColored } from './models/FilterColored';

export class FiltersProvider implements vscode.TreeDataProvider<FilterItem> {
    private filterItems: Set<FilterItem> = new Set();

    constructor() {}
  
    getTreeItem(element: FilterItem): vscode.TreeItem {
        return element;
    }
  
    getChildren(element?: FilterItem): Thenable<FilterItem[]> {
        if (element) {
            return Promise.resolve(element.children);
        } else {
            return Promise.resolve(Array.from(this.filterItems));
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<FilterItem | undefined | null | void> = new vscode.EventEmitter<FilterItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FilterItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateFiltersX(filtersColored: Set<FilterColored>): void {
        this.filterItems.clear();
        for (const filterColored of filtersColored) {
            let filterItem = new FilterItem(filterColored.name, [], filterColored.matchCase, filterColored.matchWord, filterColored.checked);
            filterItem.setIconPath(filterColored.icon, this);
            this.filterItems.add(filterItem);
            this.refresh();
            
        }
        this.refresh();
    }

    addFilter(filterItem: string): void {
        this.filterItems.add(new FilterItem(filterItem));
        this.refresh();
    }

    removeFilter(filterItem: string): void {
        let itemToRemove;
        this.filterItems.forEach(item => {
            if (item.label === filterItem) {
                itemToRemove = item;
            }
        });
        if (itemToRemove !== undefined) {
            this.filterItems.delete(itemToRemove);
        }
        this.refresh();
    }

    deleteFilter(filterItem: FilterItem): void {
        this.filterItems.delete(filterItem);
        this.refresh();
    }

    changeFilterCheckboxIcon(filterItem: FilterItem): void {
        filterItem.toggleFilterCheckbox();
        this.refresh();
    }

    changeMatchCaseIcon(filterItem: FilterItem): void {
        filterItem.toggleMatchcase();
        this.refresh();
    }

    changeMatchWordIcon(filterItem: FilterItem): void {
        filterItem.toggleWord();
        this.refresh();
    }

}

class FilterItem extends vscode.TreeItem {
    public isChecked: boolean;
    public isMatchCase: boolean;
    public isWord: boolean;

    constructor(
      public readonly label: string,
      public readonly children: FilterItem[] = [],
      isMatchCase: boolean = false,
      isWord: boolean = false,
      isChecked: boolean = true
    ) {
      super(
        label,
        children.length === 0 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed
      );
      this.isChecked = isChecked;
      this.isMatchCase = isMatchCase;
      this.isWord = isWord;
      
      let str = '';
      if (isChecked) {
        str += 'F';
      } else {
        str += 'f';
      }
      if (isMatchCase) {
        str += 'C';
      } else {
        str += 'c';
      }
      if (isWord) {
        str += 'W';
      } else {
        str += 'w';
      }
      this.contextValue = str;

      this.setDefaultIconPath('square_blue');
    }

    toggleFilterCheckbox(): void {
        this.isChecked = !this.isChecked;
        if (this.isChecked) {
            this.contextValue = this.contextValue?.replace('f', 'F');
        } else {
            this.contextValue = this.contextValue?.replace('F', 'f');
        }
    }

    toggleMatchcase(): void {
        this.isMatchCase = !this.isMatchCase;
        if (this.isMatchCase) {
            this.contextValue = this.contextValue?.replace('c', 'C');
        } else {
            this.contextValue = this.contextValue?.replace('C', 'c');
        }
    }

    toggleWord(): void {
        this.isWord = !this.isWord;
        if (this.isWord) {
            this.contextValue = this.contextValue?.replace('w', 'W');
        } else {
            this.contextValue = this.contextValue?.replace('W', 'w');
        }
    }

    setIconPath(name: string, filtersProvider: FiltersProvider) {
        this.iconPath = {
            light: vscode.Uri.file(join(__filename, '..', '..', 'resources', 'light', name + '.svg')),
            dark: vscode.Uri.file(join(__filename, '..', '..', 'resources', 'dark', name + '.svg'))
        };
        filtersProvider.refresh();
    }

    setDefaultIconPath(name: string) {
        this.iconPath = {
            light: vscode.Uri.file(join(__filename, '..', '..', 'resources', 'light', name + '.svg')),
            dark: vscode.Uri.file(join(__filename, '..', '..', 'resources', 'dark', name + '.svg'))
        };
    }

}

export function activate(context: vscode.ExtensionContext) {

    //////////////Highlights////////////////

    async function resetAll(): Promise<void> {
        vscode.commands.executeCommand('workbench.action.closeAllEditors');
        vscode.commands.executeCommand('setContext', 'file', '');

        const edit = new vscode.WorkspaceEdit();

        if (outputDocument) {
            edit.delete(outputDocument.uri, new vscode.Range(outputDocument.lineAt(0).range.start, outputDocument.lineAt(outputDocument.lineCount - 1).range.end));
        }

        await vscode.workspace.applyEdit(edit);

        output = [];
        originDocument = undefined;
        outputDocument = undefined;
        filtersColoredSet.clear();
        filtersProvider.updateFiltersX(filtersColoredSet);
        teleportSetup = true;

        URI = undefined;
        originFileContent = '';
        originFileContentArray = [];
    }

    async function getInput(): Promise<string> {
        // Retrieve previous prompt history from workspaceState (or use globalState if needed)
        let history: string[] = context.globalState.get('promptHistory', []);
        history = Array.from(new Set(history));


        // Create QuickPick for suggestions
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = history.map(input => ({ label: input }));
        quickPick.placeholder = "Enter the string to filter by";

        return new Promise<string>((resolve) => {
            quickPick.onDidChangeValue((value) => {
                quickPick.items = [{ label: value, description: "New entry"},
                    ...history.map(input => ({ label: input }))
                ];
            });

            quickPick.onDidAccept(() => {
                const selectedPrompt = quickPick.selectedItems[0]?.label || quickPick.value;
    
                // Close the QuickPick
                quickPick.hide();
    
                if (selectedPrompt) {
                    // Save the input to the history
                    history.push(selectedPrompt);
                    // Update the stored history
                    context.globalState.update('promptHistory', history);
                    resolve(selectedPrompt);
                }
            });

            quickPick.onDidHide(() => {
                resolve("");
            });

            // Show the QuickPick for history suggestions
            quickPick.show();
        });
    }

    const errorBgKey = "errorBg";
    const errorBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgb(224, 95, 95)',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const infoBgKey = "infoBg";
    const infoBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgb(172, 234, 114)', 
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const debugBgKey = "debugBg";
    const debugBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgb(121, 120, 209)',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const warningBgKey = "warningBg";
    const warningBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgb(202, 146, 83)',
        color: ' #1f1f1f',
        textDecoration: ' solid #1f1f1f',
        fontWeight: 'bold'
    });


    const pinkBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #ff8ee3',
        overviewRulerColor: 'rgb(253, 123, 221, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
    });

    const pinkBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #fd7bdd',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold',
    });

    const darkRedBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #ad1010',
        overviewRulerColor: 'rgb(119, 0, 0, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #dddddd',
        textDecoration: 'solid #dddddd'
    });

    const darkRedBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #770000',
        color: ' #dddddd',
        textDecoration: 'solid #dddddd',
        fontWeight: 'bold'
    });

    const redBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #ff7d7d',
        overviewRulerColor: 'rgb(245, 103, 103, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f'
    });

    const redBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #f56767',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const blueBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #9e9dff',
        overviewRulerColor: 'rgb(141, 139, 255, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
    });

    const blueBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #8d8bff',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const greenBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #bcff7d',
        overviewRulerColor: 'rgb(150, 223, 82, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f'
    });

    const greenBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #96df52', 
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const purpleBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #c683fd',
        overviewRulerColor: 'rgb(167, 97, 224, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right, 
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f'
    });

    const purpleBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #a761e0',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const yellowBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #ffdd57',
        overviewRulerColor: 'rgb(226, 192, 56, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f'
    });

    const yellowBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #e2c038',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const whiteBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #ececec',
        overviewRulerColor: 'rgb(211, 211, 211, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f'
    });

    const whiteBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #d3d3d3',
        color: ' #1f1f1f',
        textDecoration: 'solid #1f1f1f',
        fontWeight: 'bold'
    });

    const blackBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #181818',
        overviewRulerColor: 'rgb(17, 17, 17, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #dddddd',
        textDecoration: ' solid #dddddd'
    });

    const blackBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #111111',
        color: ' #dddddd',
        textDecoration: ' solid #dddddd',
        fontWeight: 'bold'
    });

    const orangeBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #e9a85e',
        overviewRulerColor: 'rgb(218, 142, 55, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        color: ' #1f1f1f',
        textDecoration: ' solid #1f1f1f'
    });

    const orangeBoldBg = vscode.window.createTextEditorDecorationType({
        backgroundColor: ' #da8e37',
        color: ' #1f1f1f',
        textDecoration: ' solid #1f1f1f',
        fontWeight: 'bold'
    });

    function deleteFromFilterSet(set: Set<FilterColored>, nameToDelete: string): void {
        for (let item of set) {
            if (item.name === nameToDelete) {
                set.delete(item);
                break;
            }
        }
    }

    function addToFilterSet(set: Set<FilterColored>, nameToAdd: string, checked: boolean = true, matchCase: boolean = false, matchWord: boolean = false, color: vscode.TextEditorDecorationType = blueBg, colorKey: string = "blueBg", colorBold: vscode.TextEditorDecorationType = blueBoldBg, colorBoldKey: string = "blueBoldBg", icon: string = "square_blue"): void {
        set.add(new FilterColored(nameToAdd, checked, matchCase, matchWord, color, colorKey, colorBold, colorBoldKey, icon));
    }

    function hasFilterSet(set: Set<FilterColored>, nameToCheck: string): boolean {
        for (let item of set) {
            if (item.name === nameToCheck) {
                return true;
            }
        }
        return false;
    }

    function getFilterNameArray(set: Set<FilterColored>): string[] {
        let array: string[] = [];
        for (let item of set) {
            array.push(item.name);
        }
        return array;
    }

    function getFilterNameSet(set: Set<FilterColored>): Set<string> {
        let array: string[] = [];
        for (let item of set) {
            array.push(item.name);
        }
        return new Set(array);
    }

    function getFilterByName(set: Set<FilterColored>, nameToGet: string): FilterColored {
        for (let item of set) {
            if (item.name === nameToGet) {
                return item;
            }
        }
        return new FilterColored("", false, false, false, blueBg, "blueBg", blueBoldBg, "blueBoldBg", "square_blue");
    }

    async function fileExists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri); // Check file metadata
            return true; // File exists
        } catch (error) {
            return false; // File does not exist
        }
    }

    async function saveSetToJsonFile(filePath: vscode.Uri, dataSet: Set<FilterColored>) {
        try {
            // Convert Set to an Array (Sets are not directly serializable)
            const dataArray = Array.from(dataSet);
    
            // Convert array to JSON format
            const jsonData = JSON.stringify(dataArray, null, 2); // Pretty format with indentation
    
            // Convert JSON string to Uint8Array (required by VS Code API)
            const encodedData = new TextEncoder().encode(jsonData);
    
            // Write to the file
            await vscode.workspace.fs.writeFile(filePath, encodedData);
    
            console.log("Filters data saved successfully");
        } catch (error) {
            vscode.window.showErrorMessage("Failed to save" + (error as Error).message);
        }
    }

    async function readJsonFile(filePath: vscode.Uri): Promise<Set<FilterColored>> {
        try {
            const fileData = await vscode.workspace.fs.readFile(filePath);
            const jsonString = new TextDecoder().decode(fileData);
            const jsonArray = JSON.parse(jsonString);
            return new Set(jsonArray); // Convert array back to Set
        } catch (error) {
            vscode.window.showErrorMessage("Failed to read JSON file: " + (error as Error).message);
            return new Set();
        }
    }

    ////////////////TreeView and menu functions///////////////////////

    const filtersProvider = new FiltersProvider();
    const colorsDictionary = new Map<string, vscode.TextEditorDecorationType>();
    colorsDictionary.set("pinkBg", pinkBg);
    colorsDictionary.set("darkRedBg", darkRedBg);
    colorsDictionary.set("redBg", redBg);
    colorsDictionary.set("blueBg", blueBg);
    colorsDictionary.set("greenBg", greenBg);
    colorsDictionary.set("yellowBg", yellowBg);
    colorsDictionary.set("whiteBg", whiteBg);
    colorsDictionary.set("blackBg", blackBg);
    colorsDictionary.set("orangeBg", orangeBg);
    colorsDictionary.set("purpleBg", purpleBg);

    colorsDictionary.set("pinkBoldBg", pinkBoldBg);
    colorsDictionary.set("darkRedBoldBg", darkRedBoldBg);
    colorsDictionary.set("redBoldBg", redBoldBg);
    colorsDictionary.set("blueBoldBg", blueBoldBg);
    colorsDictionary.set("greenBoldBg", greenBoldBg);
    colorsDictionary.set("yellowBoldBg", yellowBoldBg);
    colorsDictionary.set("whiteBoldBg", whiteBoldBg);
    colorsDictionary.set("blackBoldBg", blackBoldBg);
    colorsDictionary.set("orangeBoldBg", orangeBoldBg);
    colorsDictionary.set("purpleBoldBg", purpleBoldBg);

    colorsDictionary.set("errorBg", errorBg);
    colorsDictionary.set("infoBg", infoBg);
    colorsDictionary.set("debugBg", debugBg);
    colorsDictionary.set("warningBg", warningBg);

    var output: string[] = [];
    var filtersColoredSet: Set<FilterColored> = new Set<FilterColored>();
    var outputDocument: vscode.TextDocument | undefined;
    var originDocument: vscode.TextDocument | undefined;
    var originFileContent: string;
    var originFileContentArray: string[];

    var URI: vscode.Uri | undefined = undefined;

    var teleportSetup: boolean = true;

    vscode.window.registerTreeDataProvider('chipFilters', filtersProvider);

    vscode.commands.registerCommand('chipFilters.openFile', async () => {
            resetAll();

            const uri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Open'
            });

            if (uri && uri[0]) {
                URI = uri[0];
                
                await vscode.commands.executeCommand('vscode.open', uri[0]);

                vscode.commands.executeCommand('setContext', 'file', 'exists');
                
                let folderUri;
                let configFilePath;
                let configFileUri;
                folderUri = getDirectoryUri(URI);
                configFilePath = join(folderUri.fsPath, 'config_' + getFileName(URI));
                configFileUri = vscode.Uri.file(configFilePath);

                if (await fileExists(configFileUri)) {
                    console.log("Config file exists");
                    filtersColoredSet = await readJsonFile(configFileUri);
                    filtersProvider.updateFiltersX(filtersColoredSet);
                    updateEditor(false, true);
                }
            }
        }
    );
    vscode.commands.registerCommand('chipFilters.newFile', async () => {
            resetAll();

            const uri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                openLabel: 'Open'
            });

            if (uri && uri[0]) {
                URI = uri[0];
                
                await vscode.commands.executeCommand('vscode.open', uri[0]);

                vscode.commands.executeCommand('setContext', 'file', 'exists');
                
                let folderUri;
                let configFilePath;
                let configFileUri;
                folderUri = getDirectoryUri(URI);
                configFilePath = join(folderUri.fsPath, 'config_' + getFileName(URI));
                configFileUri = vscode.Uri.file(configFilePath);

                if (await fileExists(configFileUri)) {
                    console.log("Config file exists");
                    filtersColoredSet = await readJsonFile(configFileUri);
                    filtersProvider.updateFiltersX(filtersColoredSet);
                    updateEditor(false, true);
                }
            }
        }
    );


    vscode.commands.registerCommand('chipFilters.reset', async () => {
            resetAll();

            vscode.window.showInformationMessage('Filters has been reset');
        }
    );  
    vscode.commands.registerCommand('chipFilters.addFilter', async () => {
            if (URI) {
                await updateEditor(true);
            } else {
                vscode.window.showInformationMessage("Please load the file first");
            }
            filtersProvider.refresh();
        }
    );
    vscode.commands.registerCommand('chipFilters.refresh', async () => {
            if (URI) {
                await updateEditor(false);
            } else {
                vscode.window.showInformationMessage("Please load the file first");
            }
            filtersProvider.refresh();
        }
    );
    vscode.commands.registerCommand('chipFilters.toggleOff', async (item: FilterItem) => {
            
            getFilterByName(filtersColoredSet, item.label).checked = false;
            filtersProvider.changeFilterCheckboxIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.toggleOn', async (item: FilterItem) => {
            
            getFilterByName(filtersColoredSet, item.label).checked = true;
            filtersProvider.changeFilterCheckboxIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.matchCaseOff', async (item: FilterItem) => {
            
            getFilterByName(filtersColoredSet, item.label).matchCase = false;
            filtersProvider.changeMatchCaseIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.matchCaseOn', async (item: FilterItem) => {
            
            getFilterByName(filtersColoredSet, item.label).matchCase = true;
            filtersProvider.changeMatchCaseIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.matchWordOff', async (item: FilterItem) => {
        
            getFilterByName(filtersColoredSet, item.label).matchWord = false;
            filtersProvider.changeMatchWordIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.matchWordOn', async (item: FilterItem) => {
            
            getFilterByName(filtersColoredSet, item.label).matchWord = true;
            filtersProvider.changeMatchWordIcon(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.delete', async (item: FilterItem) => {
            
            deleteFromFilterSet(filtersColoredSet, item.label);
            filtersProvider.deleteFilter(item);
            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.yellow', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = yellowBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = yellowBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "yellowBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "yellowBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_yellow";
            }

            item.setIconPath('square_yellow', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.red', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = redBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = redBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "redBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "redBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_red";
            }

            item.setIconPath('square_red', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.darkred', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = darkRedBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = darkRedBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "darkRedBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "darkRedBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_darkred";
            }

            item.setIconPath('square_darkred', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.pink', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = pinkBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = pinkBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "pinkBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "pinkBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_pink";
            }

            item.setIconPath('square_pink', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.blue', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = blueBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = blueBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "blueBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "blueBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_blue";
            }

            item.setIconPath('square_blue', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.black', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = blackBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = blackBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "blackBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "blackBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_black";
            }

            item.setIconPath('square_black', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.orange', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = orangeBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = orangeBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "orangeBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "orangeBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_orange";
            }

            item.setIconPath('square_orange', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.white', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = whiteBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = whiteBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "whiteBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "whiteBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_white";
            }

            item.setIconPath('square_white', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.green', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = greenBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = greenBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "greenBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "greenBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_green";
            }

            item.setIconPath('square_green', filtersProvider);

            await updateEditor(false);
        }
    );
    vscode.commands.registerCommand('chipFilters.purple', async (item: FilterItem) => {
            
            if (hasFilterSet(filtersColoredSet, item.label)) {
                getFilterByName(filtersColoredSet, item.label).color = purpleBg;
                getFilterByName(filtersColoredSet, item.label).colorBold = purpleBoldBg;
                getFilterByName(filtersColoredSet, item.label).colorKey = "purpleBg";
                getFilterByName(filtersColoredSet, item.label).colorBoldKey = "purpleBoldBg";
                getFilterByName(filtersColoredSet, item.label).icon = "square_purple";
            }

            item.setIconPath('square_purple', filtersProvider);

            await updateEditor(false);
        }
    );

    function getDirectoryUri(fileUri: vscode.Uri): vscode.Uri {
        return fileUri.with({ path: fileUri.path.substring(0, fileUri.path.lastIndexOf('/')) });
    }

    function getFileName(fileUri: vscode.Uri): string {
        return basename(fileUri.fsPath);
    }

    async function saveFilterFileSilently(fileContent: string): Promise<vscode.Uri | undefined> {
        let folderUri;
        let filteredFilePath;
        let filteredFileUri;

        if (URI) {
            folderUri = getDirectoryUri(URI);
            filteredFilePath = join(folderUri.fsPath, 'filtered_' + getFileName(URI));
            filteredFileUri = vscode.Uri.file(filteredFilePath);
        } else {
            vscode.window.showErrorMessage('No URI');
            return undefined;
        }

        try {
            const content = Buffer.from(fileContent, 'utf8');
            await vscode.workspace.fs.writeFile(filteredFileUri, content);
            console.log(`File saved as ${filteredFilePath}`);

            return filteredFileUri;
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage('Failed to save the file: ' + error.message);
            } else {
                vscode.window.showErrorMessage('Failed to save the file: ' + String(error));
            }
        }
    }

    async function updateEditor(newFilter: boolean, load: boolean = false): Promise<void> {
        console.log("Update editor");
        const editor = vscode.window.activeTextEditor;

		if (!editor && URI === undefined) {
            vscode.window.showErrorMessage('No file!');
            return;
        }

        if (originDocument === undefined) {
            if (editor && editor.document.uri.toString() === URI?.toString()) {
                originDocument = editor.document;
            } else if (URI) {
                var tmp = await vscode.workspace.fs.readFile(URI);
                originFileContent = Buffer.from(tmp).toString('utf8');
                originFileContentArray = originFileContent.split('\n');
            } else if (editor) {
                URI = editor.document.uri;
                originDocument = editor.document;
            }
        }

        teleportInit();

        let filterString;
        if (newFilter) {

            filterString = await getInput();
            if (!filterString) {
                vscode.window.showErrorMessage('No filter string provided!');
                return;
            }

            if (!getFilterNameSet(filtersColoredSet).has(filterString)) {
                filtersProvider.addFilter(filterString);
            } else {
                return;
            }

            addToFilterSet(filtersColoredSet, filterString);
            
        }

        let folderUri;
        let configFilePath;
        let configFileUri;
        if (URI) {
            folderUri = getDirectoryUri(URI);
            configFilePath = join(folderUri.fsPath, 'config_' + getFileName(URI));
            configFileUri = vscode.Uri.file(configFilePath);

            await saveSetToJsonFile(configFileUri, filtersColoredSet);
        }

        const filteredLines: string[] = [];

        if (originDocument) {
            for (let i = 0; i < originDocument.lineCount; i++) {
                let line: string;
                
                for (const filterString of filtersColoredSet) {
                    if (filterString.checked) {
                        
                        line = originDocument.lineAt(i).text;
                        const includer = filterString.name;
                        let regex;
                        if (!filterString.matchWord && filterString.matchCase) {
                            regex = new RegExp(includer);
                        } else if (!filterString.matchWord && !filterString.matchCase) {
                            regex = new RegExp(includer, "i");
                        } else if (filterString.matchWord && !filterString.matchCase) {
                            regex = new RegExp("\\b" + includer + "\\b", "i");
                        } else {
                            regex = new RegExp("\\b" + includer + "\\b");
                        }
                        
                        if (regex.test(line)) {
                            filteredLines.push(originDocument.lineAt(i).text);
                            break; // Stop checking other filter strings if a match is found
                        }
                    }
                }
            }
        } else if (originFileContent) {
            for (let i = 0; i < originFileContentArray.length; i++) {
                let line: string;
                
                for (const filterString of filtersColoredSet) {
                    if (filterString.checked) {
                        line = originFileContentArray[i];
                        const includer = filterString.name;
                        let regex;
                        if (!filterString.matchWord && filterString.matchCase) {
                            regex = new RegExp(includer);
                        } else if (!filterString.matchWord && !filterString.matchCase) {
                            regex = new RegExp(includer, "i");
                        } else if (filterString.matchWord && !filterString.matchCase) {
                            regex = new RegExp("\\b" + includer + "\\b", "i");
                        } else {
                            regex = new RegExp("\\b" + includer + "\\b");
                        }
                        
                        if (regex.test(line)) {
                            filteredLines.push(originFileContentArray[i]);
                            break; // Stop checking other filter strings if a match is found
                        }

                    }
                }
            }
        }


        let exists = false;
        if (originDocument) {
            for (let i = 0; i < originDocument.lineCount; i++) {
                let line = originDocument.lineAt(i).text.toLowerCase();
                let includer = filterString?.toLowerCase();
                if (includer) {
                    if (line.includes(includer)) {
                        exists = true;
                        break;
                    }
                }
            }
        } else if (originFileContent) {
            for (let i = 0; i < originFileContentArray.length; i++) {
                let line = originFileContentArray[i].toLowerCase();
                let includer = filterString?.toLowerCase();
                if (includer) {
                    if (line.includes(includer)) {
                        exists = true;
                        break;
                    }
                }
            }
        }

        if (newFilter && !exists) {
            if (filterString !== undefined) {
                if (getFilterNameSet(filtersColoredSet).has(filterString)) {
                    filtersProvider.removeFilter(filterString);
                }
                deleteFromFilterSet(filtersColoredSet, filterString);
            }

            vscode.window.showErrorMessage('No matching lines found');
            return;
        }


        if (!newFilter) {
            output.length = 0;
        }
        output = output.concat(filteredLines);
        output = Array.from(new Set(output));
        output = output.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        if (outputDocument === undefined) {
            await vscode.commands.executeCommand('workbench.action.editorLayoutTwoRows');

            let outputFileUri = await saveFilterFileSilently(output.join('\n'));
            
            if (outputFileUri) {
                outputDocument = await vscode.workspace.openTextDocument(outputFileUri);
                await vscode.window.showTextDocument(outputFileUri, {viewColumn: vscode.ViewColumn.Beside, preview: true});            
            } else {
                vscode.window.showErrorMessage('Opening filtered file failed');
            }

            await vscode.commands.executeCommand('workbench.action.moveEditorToBelowGroup');
        } else {
            if (!outputDocument.isClosed) {
                const edit = new vscode.WorkspaceEdit();

                edit.delete(outputDocument.uri, new vscode.Range(outputDocument.lineAt(0).range.start, outputDocument.lineAt(outputDocument.lineCount - 1).range.end));

                await vscode.workspace.applyEdit(edit);

                edit.insert(outputDocument.uri, outputDocument.lineAt(0).range.start, output.join('\n'));

                await vscode.workspace.applyEdit(edit);
            } else {
                await vscode.commands.executeCommand('workbench.action.editorLayoutTwoRows');

                outputDocument = await vscode.workspace.openTextDocument({ content: output.join('\n') });

                await vscode.window.showTextDocument(outputDocument, {viewColumn: vscode.ViewColumn.Beside, preview: true});

                await vscode.commands.executeCommand('workbench.action.moveEditorToBelowGroup');
            }
        }

        const rangeColorMap = new Map<string, vscode.Range[]>();
        class RangeColor {
            constructor(public readonly filterColored: FilterColored, public readonly range: vscode.Range) {
                this.filterColored = filterColored;
                this.range = range;
            }
        }
        

        if (outputDocument) {
            
            let checkedArray = Array.from(filtersColoredSet).filter(item => item.checked);

            for (let i = 0; i < outputDocument.lineCount; i++) {
                let line = outputDocument.lineAt(i).text;
                const liner = outputDocument.lineAt(i);
                
                let value: RangeColor[] = [];
                for (const filterString of checkedArray) {
                    
                    let includer;
                    if (filterString.matchCase) {
                        line = outputDocument.lineAt(i).text;
                        includer = filterString.name;
                    } else {
                        line = outputDocument.lineAt(i).text.toLowerCase();
                        includer = filterString.name.toLowerCase();
                    }

                    if (line.includes(includer)) {
                        const startIndex = line.indexOf(includer);
                        const endIndex = startIndex + filterString.name.length;

                        const range0 = new vscode.Range(i, startIndex, i, endIndex);
                        const range1 = new vscode.Range(i, endIndex, i, liner.range.end.character);
                        
                        if (!rangeColorMap.has(filterString.colorKey)) {
                            rangeColorMap.set(filterString.colorBoldKey, [range0]);
                            rangeColorMap.set(filterString.colorKey, [range1]);
                        } else {
                            rangeColorMap.get(filterString.colorBoldKey)?.push(range0);
                            rangeColorMap.get(filterString.colorKey)?.push(range1);
                        }
                        
                        const startPos = new vscode.Position(i, startIndex);
                        const endPos = new vscode.Position(i, endIndex);
                        const xrange = new vscode.Range(startPos, endPos);
                        value.push(new RangeColor(filterString, xrange));

                        if (outputDocument.lineAt(i).text.includes(' E ')) {
                            if (!rangeColorMap.has(errorBgKey)) {
                                rangeColorMap.set(errorBgKey, [new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' E '), i, outputDocument.lineAt(i).text.indexOf(' E ') + 3)]);
                            } else {
                                rangeColorMap.get(errorBgKey)?.push(new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' E '), i, outputDocument.lineAt(i).text.indexOf(' E ') + 3));
                            }
                        }
                        if (outputDocument.lineAt(i).text.includes(' I ')) {
                            if (!rangeColorMap.has(infoBgKey)) {
                                rangeColorMap.set(infoBgKey, [new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' I '), i, outputDocument.lineAt(i).text.indexOf(' I ') + 3)]);
                            } else {
                                rangeColorMap.get(infoBgKey)?.push(new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' I '), i, outputDocument.lineAt(i).text.indexOf(' I ') + 3));
                            }
                        }
                        if (outputDocument.lineAt(i).text.includes(' D ')) {
                            if (!rangeColorMap.has(debugBgKey)) {
                                rangeColorMap.set(debugBgKey, [new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' D '), i, outputDocument.lineAt(i).text.indexOf(' D ') + 3)]);
                            } else {
                                rangeColorMap.get(debugBgKey)?.push(new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' D '), i, outputDocument.lineAt(i).text.indexOf(' D ') + 3));
                            }
                        }
                        if (outputDocument.lineAt(i).text.includes(' W ')) {
                            if (!rangeColorMap.has(warningBgKey)) {
                                rangeColorMap.set(warningBgKey, [new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' W '), i, outputDocument.lineAt(i).text.indexOf(' W ') + 3)]);
                            } else {
                                rangeColorMap.get(warningBgKey)?.push(new vscode.Range(i, outputDocument.lineAt(i).text.indexOf(' W '), i, outputDocument.lineAt(i).text.indexOf(' W ') + 3));
                            }
                        }
                        
                    }
                }

                if (value.length >= 2) {

                    value = valueSort(value);
                    for (let i = 1; i < value.length; i++) {
                        if (value[i].range.start.character > value[i - 1].range.start.character) {

                            rangeColorMap.get(value[i - 1].filterColored.colorKey)?.pop();
                            rangeColorMap.get(value[i - 1].filterColored.colorBoldKey)?.pop();

                            const lineNumber = value[i - 1].range.start.line;
                            const startIndex = line.toLowerCase().indexOf(value[i - 1].filterColored.name.toLowerCase());
                            const endIndex = value[i].range.start.character;

                            rangeColorMap.get(value[i - 1].filterColored.colorBoldKey)?.push(new vscode.Range(lineNumber, startIndex, lineNumber, startIndex + value[i - 1].filterColored.name.length));
                            rangeColorMap.get(value[i - 1].filterColored.colorKey)?.push(new vscode.Range(lineNumber, startIndex + value[i - 1].filterColored.name.length, lineNumber, endIndex));

                        } else if (value[i].filterColored.name.length > value[i - 1].filterColored.name.length) {

                            rangeColorMap.get(value[i - 1].filterColored.colorKey)?.pop();
                            rangeColorMap.get(value[i - 1].filterColored.colorBoldKey)?.pop();

                        }
                    }
                }
            }

            setTimeout(() =>  {
                const editor2 = findEditorWithUri(outputDocument!!.uri);
                if (!editor2) {
                    vscode.window.showErrorMessage('No filtered editor window found');
                    return;
                }
                const sortedMap = new Map(
                    Array.from(rangeColorMap).sort((a, b) => b[1].length - a[1].length)
                );
                
                    if (outputDocument) { 
                        // Apply decoration
                        console.log("Applying decoration");
                        sortedMap.forEach((value, key) => {
                            let decorationType  = colorsDictionary.get(key);
                            if (decorationType) {
                                editor2.setDecorations(decorationType , value);
                            }
                        });
                    }
            }, 100);
        } else {
            vscode.window.showErrorMessage('Filtered document not found');
        }

        function findEditorWithUri(targetUri: vscode.Uri) {
            const visibleEditors = vscode.window.visibleTextEditors;
            
            for (const editor of visibleEditors) {
                if (editor.document.uri.toString() === targetUri.toString()) {
                    return editor; // Found the editor with the specific URI
                }
            }
        
            return null; // No editor found with that URI
        }
        

        function valueSort(arr: RangeColor[]): RangeColor[] {
            let n = arr.length;
            let swapped: boolean;
        
            // Outer loop to go through the array
            for (let i = 0; i < n - 1; i++) {
                swapped = false;
        
                // Inner loop to compare adjacent elements
                for (let j = 0; j < n - i - 1; j++) {
                    if (arr[j].range.start.character > arr[j + 1].range.start.character || (arr[j].filterColored.name.length > arr[j + 1].filterColored.name.length && arr[j].range.start.character === arr[j + 1].range.start.character)) {
                        // Swap if elements are in the wrong order
                        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                        swapped = true;
                    }
                }
        
                // If no two elements were swapped, the array is sorted
                if (!swapped) {
                    break;
                }
            }
        
            return arr;
        }

    }

    function findLineInDocument(document: vscode.TextDocument, lineText: string): number {
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;
            if (line === lineText) {
                return i;
            }
        }
        return -1;
    }

    function teleportInit() {

        const editor = vscode.window.activeTextEditor;
        if (editor && teleportSetup) {
            vscode.window.onDidChangeTextEditorSelection((event: vscode.TextEditorSelectionChangeEvent) => {
                if (!outputDocument?.isClosed && !originDocument?.isClosed) {
                    if (event.textEditor.document === outputDocument) {
                        console.log("Output");

                        const selectedLine = event.selections[0].start.line;

                        const range = originDocument?.lineAt(findLineInDocument(originDocument, outputDocument.lineAt(selectedLine).text)).range;

                        if (range !== undefined) {
                            editor.selection = new vscode.Selection(range.start, range.start);
                            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                        }
                        
                    } else if (event.textEditor.document === originDocument) {
                        console.log("Origin");
                    }
                }
            });
            teleportSetup = false;
        }
    }
    
	const disposable = vscode.commands.registerCommand('chipFilters.filterOut', async () => {
    
		await updateEditor(true);
        
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
