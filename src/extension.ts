import * as vscode from "vscode";
import { join, basename } from "path";
import { FilterColored } from "./models/FilterColored";
import { FiltersProvider } from "./providers/FiltersProvider";
import { HighlightColors } from "./HighlightColors";
import { FilterItem } from "./provider_items/FilterItem";
import { FilterSetManager } from "./FilterSetManager";

export function activate(context: vscode.ExtensionContext) {
  /// async functions
  async function resetEverything(): Promise<void> {
    vscode.commands.executeCommand("workbench.action.closeAllEditors");
    vscode.commands.executeCommand("setContext", "file", "");

    output = [];
    originDocument = undefined;
    outputDocument = undefined;
    filtersColoredSet.clear();
    filtersProvider.updateFiltersX(filtersColoredSet);
    teleportSetup = true;

    URI = undefined;
    originFileContent = "";
    originFileContentArray = [];
  }

  async function getInput(): Promise<string> {
    // Retrieve previous prompt history from globalState
    let history: string[] = context.globalState.get("promptHistory", []);
    history = Array.from(new Set(history));

    // Create QuickPick
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = history.map((input) => ({ label: input }));
    quickPick.placeholder = "Enter the string to filter by";

    return new Promise<string>((resolve) => {
      quickPick.onDidChangeValue((value) => {
        quickPick.items = [
          { label: value, description: "New entry" },
          ...history.map((input) => ({ label: input })),
        ];
      });

      quickPick.onDidAccept(() => {
        const selectedPrompt =
          quickPick.selectedItems[0]?.label || quickPick.value;

        // Close the QuickPick
        quickPick.hide();

        if (selectedPrompt) {
          // Save the input to the history
          history.push(selectedPrompt);
          // Update the stored history
          context.globalState.update("promptHistory", history);
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

  async function fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri); // Check file metadata
      return true; // File exists
    } catch (error) {
      return false; // File does not exist
    }
  }

  async function saveSetToJsonFile(
    filePath: vscode.Uri,
    dataSet: Set<FilterColored>
  ) {
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
      vscode.window.showErrorMessage(
        "Failed to save" + (error as Error).message
      );
    }
  }

  async function readJsonFile(
    filePath: vscode.Uri
  ): Promise<Set<FilterColored>> {
    try {
      const fileData = await vscode.workspace.fs.readFile(filePath);
      const jsonString = new TextDecoder().decode(fileData);
      const jsonArray = JSON.parse(jsonString);
      return new Set(jsonArray); // Convert array back to Set
    } catch (error) {
      vscode.window.showErrorMessage(
        "Failed to read JSON file: " + (error as Error).message
      );
      return new Set();
    }
  }

  ////////////////All initial decalrations///////////////////////
  const filtersProvider = new FiltersProvider();
  const colorsDictionary = new Map<string, vscode.TextEditorDecorationType>();

  var output: string[] = [];
  var filtersColoredSet: Set<FilterColored> = new Set<FilterColored>();
  var outputDocument: vscode.TextDocument | undefined;
  var originDocument: vscode.TextDocument | undefined;
  var originFileContent: string;
  var originFileContentArray: string[];
  var URI: vscode.Uri | undefined = undefined;
  var teleportSetup: boolean = true;

  colorsDictionary.set("pinkBg", HighlightColors.pinkBg);
  colorsDictionary.set("darkredBg", HighlightColors.darkRedBg);
  colorsDictionary.set("redBg", HighlightColors.redBg);
  colorsDictionary.set("blueBg", HighlightColors.blueBg);
  colorsDictionary.set("greenBg", HighlightColors.greenBg);
  colorsDictionary.set("yellowBg", HighlightColors.yellowBg);
  colorsDictionary.set("whiteBg", HighlightColors.whiteBg);
  colorsDictionary.set("blackBg", HighlightColors.blackBg);
  colorsDictionary.set("orangeBg", HighlightColors.orangeBg);
  colorsDictionary.set("purpleBg", HighlightColors.purpleBg);

  colorsDictionary.set("pinkBoldBg", HighlightColors.pinkBoldBg);
  colorsDictionary.set("darkredBoldBg", HighlightColors.darkRedBoldBg);
  colorsDictionary.set("redBoldBg", HighlightColors.redBoldBg);
  colorsDictionary.set("blueBoldBg", HighlightColors.blueBoldBg);
  colorsDictionary.set("greenBoldBg", HighlightColors.greenBoldBg);
  colorsDictionary.set("yellowBoldBg", HighlightColors.yellowBoldBg);
  colorsDictionary.set("whiteBoldBg", HighlightColors.whiteBoldBg);
  colorsDictionary.set("blackBoldBg", HighlightColors.blackBoldBg);
  colorsDictionary.set("orangeBoldBg", HighlightColors.orangeBoldBg);
  colorsDictionary.set("purpleBoldBg", HighlightColors.purpleBoldBg);

  colorsDictionary.set("errorBg", HighlightColors.errorBg);
  colorsDictionary.set("infoBg", HighlightColors.infoBg);
  colorsDictionary.set("debugBg", HighlightColors.debugBg);
  colorsDictionary.set("warningBg", HighlightColors.warningBg);
  colorsDictionary.set("verboseBg", HighlightColors.verboseBg);

  ////////////////Navigation menu items///////////////////////
  vscode.window.registerTreeDataProvider("chipFilters", filtersProvider);
  vscode.commands.registerCommand("chipFilters.openFile", async () => {
    resetEverything();

    const uri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: "Open",
    });

    if (uri && uri[0]) {
      URI = uri[0];

      await vscode.commands.executeCommand("vscode.open", uri[0]);

      vscode.commands.executeCommand("setContext", "file", "exists");

      let folderUri;
      let configFilePath;
      let configFileUri;
      folderUri = getDirectoryUri(URI);
      configFilePath = join(folderUri.fsPath, "config_" + getFileName(URI));
      configFileUri = vscode.Uri.file(configFilePath);

      if (await fileExists(configFileUri)) {
        console.log("Config file exists");
        filtersColoredSet = await readJsonFile(configFileUri);
        filtersProvider.updateFiltersX(filtersColoredSet);
        updateEditor(false, true);
      }
    }
  });
  vscode.commands.registerCommand("chipFilters.newFile", async () => {
    resetEverything();

    const uri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: "Open",
    });

    if (uri && uri[0]) {
      URI = uri[0];

      await vscode.commands.executeCommand("vscode.open", uri[0]);

      vscode.commands.executeCommand("setContext", "file", "exists");

      let folderUri;
      let configFilePath;
      let configFileUri;
      folderUri = getDirectoryUri(URI);
      configFilePath = join(folderUri.fsPath, "config_" + getFileName(URI));
      configFileUri = vscode.Uri.file(configFilePath);

      if (await fileExists(configFileUri)) {
        console.log("Config file exists");
        filtersColoredSet = await readJsonFile(configFileUri);
        filtersProvider.updateFiltersX(filtersColoredSet);
        updateEditor(false, true);
      }
    }
  });
  vscode.commands.registerCommand("chipFilters.reset", async () => {
    resetEverything();
    vscode.window.showInformationMessage("Filter files has been closed");
  });
  vscode.commands.registerCommand("chipFilters.addFilter", async () => {
    if (URI) {
      await updateEditor(true);
    } else {
      vscode.window.showInformationMessage("Please load the file first");
    }
    filtersProvider.refresh();
  });
  vscode.commands.registerCommand("chipFilters.refresh", async () => {
    if (URI) {
      await updateEditor(false);
    } else {
      vscode.window.showInformationMessage("Please load the file first");
    }
    filtersProvider.refresh();
  });

  ////////////////Treeview items menu///////////////////////
  vscode.commands.registerCommand(
    "chipFilters.toggleOff",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(filtersColoredSet, item.label).checked =
        false;
      filtersProvider.changeFilterCheckboxIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.toggleOn",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(filtersColoredSet, item.label).checked =
        true;
      filtersProvider.changeFilterCheckboxIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchCaseOff",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchCase = false;
      filtersProvider.changeMatchCaseIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchCaseOn",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchCase = true;
      filtersProvider.changeMatchCaseIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchWordOff",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchWord = false;
      filtersProvider.changeMatchWordIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchWordOn",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchWord = true;
      filtersProvider.changeMatchWordIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchRegexOff",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchRegex = false;
      filtersProvider.changeMatchRegexIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.matchRegexOn",
    async (item: FilterItem) => {
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).matchRegex = true;
      filtersProvider.changeMatchRegexIcon(item);
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.delete",
    async (item: FilterItem) => {
      FilterSetManager.deleteFromFilterSet(filtersColoredSet, item.label);
      filtersProvider.deleteFilter(item);
      await updateEditor(false);
    }
  );

  ////////////////Color setting menu///////////////////////
  vscode.commands.registerCommand(
    "chipFilters.yellow",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.yellowBg,
        HighlightColors.yellowBoldBg,
        "yellow"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.red",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.redBg,
        HighlightColors.redBoldBg,
        "red"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.darkred",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.darkRedBg,
        HighlightColors.darkRedBoldBg,
        "darkred"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.pink",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.pinkBg,
        HighlightColors.pinkBoldBg,
        "pink"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.blue",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.blueBg,
        HighlightColors.blueBoldBg,
        "blue"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.black",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.blackBg,
        HighlightColors.blackBoldBg,
        "black"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.orange",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.orangeBg,
        HighlightColors.orangeBoldBg,
        "orange"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.white",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.whiteBg,
        HighlightColors.whiteBoldBg,
        "white"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.green",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.greenBg,
        HighlightColors.greenBoldBg,
        "green"
      );
      await updateEditor(false);
    }
  );
  vscode.commands.registerCommand(
    "chipFilters.purple",
    async (item: FilterItem) => {
      setFilterColor(
        filtersColoredSet,
        item,
        HighlightColors.purpleBg,
        HighlightColors.purpleBoldBg,
        "purple"
      );
      await updateEditor(false);
    }
  );
  function setFilterColor(
    filtersColoredSet: Set<FilterColored>,
    item: FilterItem,
    color: vscode.TextEditorDecorationType,
    colorBold: vscode.TextEditorDecorationType,
    colorName: string
  ) {
    if (FilterSetManager.hasFilterSet(filtersColoredSet, item.label)) {
      FilterSetManager.getFilterByName(filtersColoredSet, item.label).color =
        color;
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).colorBold = colorBold;
      FilterSetManager.getFilterByName(filtersColoredSet, item.label).colorKey =
        colorName + "Bg";
      FilterSetManager.getFilterByName(
        filtersColoredSet,
        item.label
      ).colorBoldKey = colorName + "BoldBg";
      FilterSetManager.getFilterByName(filtersColoredSet, item.label).icon =
        "square_" + colorName;
      item.setIconPath("square_" + colorName, filtersProvider);
    }
  }

  ////////////////File operations///////////////////////
  function getDirectoryUri(fileUri: vscode.Uri): vscode.Uri {
    return fileUri.with({
      path: fileUri.path.substring(0, fileUri.path.lastIndexOf("/")),
    });
  }
  function getFileName(fileUri: vscode.Uri): string {
    return basename(fileUri.fsPath);
  }
  async function saveFilterFileSilently(
    fileContent: string
  ): Promise<vscode.Uri | undefined> {
    let folderUri;
    let filteredFilePath;
    let filteredFileUri;

    if (URI) {
      folderUri = getDirectoryUri(URI);
      filteredFilePath = join(folderUri.fsPath, "filtered_" + getFileName(URI));
      filteredFileUri = vscode.Uri.file(filteredFilePath);
    } else {
      vscode.window.showErrorMessage("No URI");
      return undefined;
    }

    try {
      const content = Buffer.from(fileContent, "utf8");
      await vscode.workspace.fs.writeFile(filteredFileUri, content);
      console.log(`File saved as ${filteredFilePath}`);

      return filteredFileUri;
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(
          "Failed to save the file: " + error.message
        );
      } else {
        vscode.window.showErrorMessage(
          "Failed to save the file: " + String(error)
        );
      }
    }
  }

  function escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function logSymbol(
    symbol: string,
    bgKey: string,
    rangeColorMap: Map<string, vscode.Range[]>,
    i: number,
    outputDocument: vscode.TextDocument
  ) {
    if (!rangeColorMap.has(bgKey)) {
      rangeColorMap.set(bgKey, [
        new vscode.Range(
          i,
          outputDocument.lineAt(i).text.indexOf(symbol),
          i,
          outputDocument.lineAt(i).text.indexOf(symbol) + 3
        ),
      ]);
    } else {
      rangeColorMap
        .get(bgKey)
        ?.push(
          new vscode.Range(
            i,
            outputDocument.lineAt(i).text.indexOf(symbol),
            i,
            outputDocument.lineAt(i).text.indexOf(symbol) + 3
          )
        );
    }
  }

  function regexSetup(filterString: FilterColored, includer: string) {
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
    return regex;
  }

  type MatchResult = {
    match: string;
    start: number;
    end: number;
  } | null;

  function findFirstMatchWithIndices(line: string, regex: RegExp): MatchResult {
    const match = regex.exec(line);

    if (match) {
      return {
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }

    return null;
  }

  ////////////////Generate filter file and highlights///////////////////////
  async function updateEditor(
    newFilter: boolean,
    load: boolean = false
  ): Promise<void> {
    console.log("Update editor");
    const editor = vscode.window.activeTextEditor;

    if (!editor && URI === undefined) {
      vscode.window.showErrorMessage("No file!");
      return;
    }

    if (originDocument === undefined) {
      if (editor && editor.document.uri.toString() === URI?.toString()) {
        originDocument = editor.document;
      } else if (URI) {
        var tmp = await vscode.workspace.fs.readFile(URI);
        originFileContent = Buffer.from(tmp).toString("utf8");
        originFileContentArray = originFileContent.split("\n");
      } else if (editor) {
        URI = editor.document.uri;
        originDocument = editor.document;
      }
    }

    teleportInit();

    let newFilterItem: FilterItem | undefined = undefined;
    let filterString;
    if (newFilter) {
      filterString = await getInput();
      if (!filterString) {
        vscode.window.showErrorMessage("No filter string provided!");
        return;
      }

      if (
        !FilterSetManager.getFilterNameSet(filtersColoredSet).has(filterString)
      ) {
        newFilterItem = filtersProvider.addFilter(filterString);
      } else {
        return;
      }

      FilterSetManager.addToFilterSet(filtersColoredSet, filterString);
    }

    let folderUri;
    let configFilePath;
    let configFileUri;
    if (URI) {
      folderUri = getDirectoryUri(URI);
      configFilePath = join(folderUri.fsPath, "config_" + getFileName(URI));
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
            let includer = filterString.name;
            if (!newFilter && !filterString.matchRegex) {
              includer = escapeRegex(includer);
            }
            const regex = regexSetup(filterString, includer);

            if (regex.test(line)) {
              filteredLines.push(i + " " + originDocument.lineAt(i).text);
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
            let includer = filterString.name;
            if (!newFilter && !filterString.matchRegex) {
              includer = escapeRegex(includer);
            }
            const regex = regexSetup(filterString, includer);

            if (regex.test(line)) {
              filteredLines.push(i + " " + originFileContentArray[i]);
              break; // Stop checking other filter strings if a match is found
            }
          }
        }
      }
    }

    let nonRegexExists = false;
    if (originDocument) {
      for (let i = 0; i < originDocument.lineCount; i++) {
        let line = originDocument.lineAt(i).text.toLowerCase();
        let includer = filterString?.toLowerCase();
        if (includer) {
          if (line.includes(includer)) {
            nonRegexExists = true;
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
            nonRegexExists = true;
            break;
          }
        }
      }
    }

    let exists = false;
    if (newFilter) {
      if (originDocument) {
        for (let i = 0; i < originDocument.lineCount; i++) {
          let line = originDocument.lineAt(i).text;
          let includer = filterString;
          if (includer !== undefined) {
            const regex = new RegExp(includer, "i");
            if (regex.test(line)) {
              exists = true;
              break; // Stop checking other filter strings if a match is found
            }
          }
        }
      } else if (originFileContent) {
        for (let i = 0; i < originFileContentArray.length; i++) {
          let line = originFileContentArray[i];
          let includer = filterString;
          if (includer !== undefined) {
            const regex = new RegExp(includer, "i");
            if (regex.test(line)) {
              exists = true;
              break; // Stop checking other filter strings if a match is found
            }
          }
        }
      }
    }

    if (newFilter && !nonRegexExists && exists) {
      if (filterString !== undefined && newFilterItem !== undefined) {
        FilterSetManager.getFilterByName(
          filtersColoredSet,
          filterString
        ).matchRegex = true;
        filtersProvider.changeMatchRegexIcon(newFilterItem);
      }
    }

    if (newFilter && !exists) {
      if (filterString !== undefined) {
        if (
          FilterSetManager.getFilterNameSet(filtersColoredSet).has(filterString)
        ) {
          filtersProvider.removeFilter(filterString);
        }
        FilterSetManager.deleteFromFilterSet(filtersColoredSet, filterString);
      }

      vscode.window.showErrorMessage("No matching lines found");
      return;
    }

    if (!newFilter) {
      output.length = 0;
    }
    output = output.concat(filteredLines);
    output = Array.from(new Set(output));
    output = output.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
    output = output.map((str) => str.replace(/^\d+\s/, ""));

    if (outputDocument === undefined) {
      await vscode.commands.executeCommand(
        "workbench.action.editorLayoutTwoRows"
      );

      let outputFileUri = await saveFilterFileSilently(output.join("\n"));

      if (outputFileUri) {
        outputDocument = await vscode.workspace.openTextDocument(outputFileUri);
        await vscode.window.showTextDocument(outputFileUri, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: true,
        });
      } else {
        vscode.window.showErrorMessage("Opening filtered file failed");
      }

      await vscode.commands.executeCommand(
        "workbench.action.moveEditorToBelowGroup"
      );

      vscode.workspace.onDidCloseTextDocument((document) => {
        console.log(`Document closed: ${document.uri.toString()}`);
      });
    } else {
      if (!outputDocument.isClosed) {
        const edit = new vscode.WorkspaceEdit();

        edit.delete(
          outputDocument.uri,
          new vscode.Range(
            outputDocument.lineAt(0).range.start,
            outputDocument.lineAt(outputDocument.lineCount - 1).range.end
          )
        );

        await vscode.workspace.applyEdit(edit);

        edit.insert(
          outputDocument.uri,
          outputDocument.lineAt(0).range.start,
          output.join("\n")
        );

        await vscode.workspace.applyEdit(edit);

        outputDocument.save();
      } else {
        await vscode.commands.executeCommand(
          "workbench.action.editorLayoutTwoRows"
        );

        outputDocument = await vscode.workspace.openTextDocument(
          (await saveFilterFileSilently(output.join("\n"))) as vscode.Uri
        );

        await vscode.window.showTextDocument(outputDocument, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: true,
        });

        await vscode.commands.executeCommand(
          "workbench.action.moveEditorToBelowGroup"
        );

        outputDocument.save();
      }
    }

    const rangeColorMap = new Map<string, vscode.Range[]>();
    class RangeColor {
      constructor(
        public readonly filterColored: FilterColored,
        public readonly range: vscode.Range
      ) {
        this.filterColored = filterColored;
        this.range = range;
      }
    }

    if (outputDocument) {
      let checkedArray = Array.from(filtersColoredSet).filter(
        (item) => item.checked
      );

      for (let i = 0; i < outputDocument.lineCount; i++) {
        let line = outputDocument.lineAt(i).text;
        const liner = outputDocument.lineAt(i);

        let inlinecolors: RangeColor[] = [];
        for (const filterString of checkedArray) {
          let includer = filterString.name;
          if (!filterString.matchRegex) {
            includer = escapeRegex(includer);
          }
          const regex = regexSetup(filterString, includer);

          if (regex.test(line)) {
            let matchIndices = findFirstMatchWithIndices(line, regex);
            const startIndex = matchIndices!!.start;
            const endIndex = matchIndices!!.end;

            const rangeBold = new vscode.Range(i, startIndex, i, endIndex);
            const rangeThin = new vscode.Range(
              i,
              endIndex,
              i,
              liner.range.end.character //end of the line
            );

            if (!rangeColorMap.has(filterString.colorKey)) {
              rangeColorMap.set(filterString.colorBoldKey, [rangeBold]);
              rangeColorMap.set(filterString.colorKey, [rangeThin]);
            } else {
              rangeColorMap.get(filterString.colorBoldKey)?.push(rangeBold);
              rangeColorMap.get(filterString.colorKey)?.push(rangeThin);
            }

            const startPos = new vscode.Position(i, startIndex);
            const endPos = new vscode.Position(i, endIndex);
            const xrange = new vscode.Range(startPos, endPos);
            inlinecolors.push(new RangeColor(filterString, xrange));

            if (outputDocument.lineAt(i).text.includes(" E ")) {
              logSymbol(
                " E ",
                HighlightColors.errorBgKey,
                rangeColorMap,
                i,
                outputDocument
              );
            }
            if (outputDocument.lineAt(i).text.includes(" I ")) {
              logSymbol(
                " I ",
                HighlightColors.infoBgKey,
                rangeColorMap,
                i,
                outputDocument
              );
            }
            if (outputDocument.lineAt(i).text.includes(" D ")) {
              logSymbol(
                " D ",
                HighlightColors.debugBgKey,
                rangeColorMap,
                i,
                outputDocument
              );
            }
            if (outputDocument.lineAt(i).text.includes(" W ")) {
              logSymbol(
                " W ",
                HighlightColors.warningBgKey,
                rangeColorMap,
                i,
                outputDocument
              );
            }
            if (outputDocument.lineAt(i).text.includes(" V ")) {
              logSymbol(
                " V ",
                HighlightColors.verboseBgKey,
                rangeColorMap,
                i,
                outputDocument
              );
            }
          }
        }

        if (inlinecolors.length >= 2) {
          inlinecolors = inlineColorsSort(inlinecolors);
          for (let i = 1; i < inlinecolors.length; i++) {
            if (
              inlinecolors[i].range.start.character >
              inlinecolors[i - 1].range.start.character
            ) {
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorKey)
                ?.pop();
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorBoldKey)
                ?.pop();

              const lineNumber = inlinecolors[i - 1].range.start.line;
              const startIndex = inlinecolors[i - 1].range.start.character;
              const endIndex = inlinecolors[i].range.start.character;

              console.log("inlinecolors: " + startIndex);
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorBoldKey)
                ?.push(
                  new vscode.Range(
                    lineNumber,
                    startIndex,
                    lineNumber,
                    startIndex + inlinecolors[i - 1].filterColored.name.length
                  )
                );
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorKey)
                ?.push(
                  new vscode.Range(
                    lineNumber,
                    startIndex + inlinecolors[i - 1].filterColored.name.length,
                    lineNumber,
                    endIndex
                  )
                );
            } else if (
              inlinecolors[i].filterColored.name.length >
              inlinecolors[i - 1].filterColored.name.length
            ) {
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorKey)
                ?.pop();
              rangeColorMap
                .get(inlinecolors[i - 1].filterColored.colorBoldKey)
                ?.pop();
            }
          }
        }
      }

      setTimeout(() => {
        const editor2 = findEditorWithUri(outputDocument!!.uri);
        if (!editor2) {
          vscode.window.showErrorMessage("No filtered editor window found");
          return;
        }
        const sortedMap = new Map(
          Array.from(rangeColorMap).sort((a, b) => b[1].length - a[1].length)
        );

        if (outputDocument) {
          // Apply decoration
          console.log("Applying decoration");
          sortedMap.forEach((value, key) => {
            let decorationType = colorsDictionary.get(key);
            if (decorationType) {
              editor2.setDecorations(decorationType, value);
            }
          });
        }
      }, 100);
    } else {
      vscode.window.showErrorMessage("Filtered document not found");
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

    function inlineColorsSort(colorRanges: RangeColor[]): RangeColor[] {
      let n = colorRanges.length;
      let swapped: boolean;

      // Outer loop to go through the array
      for (let i = 0; i < n - 1; i++) {
        swapped = false;

        // Inner loop to compare adjacent elements
        for (let j = 0; j < n - i - 1; j++) {
          if (
            colorRanges[j].range.start.character >
              colorRanges[j + 1].range.start.character ||
            (colorRanges[j].filterColored.name.length >
              colorRanges[j + 1].filterColored.name.length &&
              colorRanges[j].range.start.character ===
                colorRanges[j + 1].range.start.character)
          ) {
            // Swap if elements are in the wrong order
            [colorRanges[j], colorRanges[j + 1]] = [
              colorRanges[j + 1],
              colorRanges[j],
            ];
            swapped = true;
          }
        }

        // If no two elements were swapped, the array is sorted
        if (!swapped) {
          break;
        }
      }
      return colorRanges;
    }
  }

  ////////////////Editors line bonding (teleport)///////////////////////
  function findLineInDocument(
    document: vscode.TextDocument,
    lineText: string
  ): number {
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
      vscode.window.onDidChangeTextEditorSelection(
        (event: vscode.TextEditorSelectionChangeEvent) => {
          if (!outputDocument?.isClosed && !originDocument?.isClosed) {
            if (event.textEditor.document === outputDocument) {
              console.log("Output");

              const selectedLine = event.selections[0].start.line;

              const range = originDocument?.lineAt(
                findLineInDocument(
                  originDocument,
                  outputDocument.lineAt(selectedLine).text
                )
              ).range;

              if (range !== undefined) {
                editor.selection = new vscode.Selection(
                  range.start,
                  range.start
                );
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
              }
            } else if (event.textEditor.document === originDocument) {
              console.log("Origin");
            }
          }
        }
      );
      teleportSetup = false;
    }
  }

  const disposable = vscode.commands.registerCommand(
    "chipFilters.filterOut",
    async () => {
      await updateEditor(true);
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
