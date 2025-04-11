import * as vscode from "vscode";
import { join } from "path";
import { FiltersProvider } from "../providers/FiltersProvider";

export class FilterItem extends vscode.TreeItem {
  public isChecked: boolean;
  public isMatchCase: boolean;
  public isWord: boolean;
  public isRegex: boolean;

  constructor(
    public readonly label: string,
    public readonly children: FilterItem[] = [],
    isMatchCase: boolean = false,
    isWord: boolean = false,
    isRegex: boolean = false,
    isChecked: boolean = true
  ) {
    super(
      label,
      children.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.isChecked = isChecked;
    this.isMatchCase = isMatchCase;
    this.isWord = isWord;
    this.isRegex = isRegex;

    let str = "";
    if (isChecked) {
      str += "F";
    } else {
      str += "f";
    }
    if (isMatchCase) {
      str += "C";
    } else {
      str += "c";
    }
    if (isWord) {
      str += "W";
    } else {
      str += "w";
    }
    if (isRegex) {
      str += "R";
    } else {
      str += "r";
    }
    this.contextValue = str;

    this.setDefaultIconPath("square_blue");
  }

  toggleFilterCheckbox(): void {
    this.isChecked = !this.isChecked;
    if (this.isChecked) {
      this.contextValue = this.contextValue?.replace("f", "F");
    } else {
      this.contextValue = this.contextValue?.replace("F", "f");
    }
  }

  toggleMatchcase(): void {
    this.isMatchCase = !this.isMatchCase;
    if (this.isMatchCase) {
      this.contextValue = this.contextValue?.replace("c", "C");
    } else {
      this.contextValue = this.contextValue?.replace("C", "c");
    }
  }

  toggleWord(): void {
    this.isWord = !this.isWord;
    if (this.isWord) {
      this.contextValue = this.contextValue?.replace("w", "W");
    } else {
      this.contextValue = this.contextValue?.replace("W", "w");
    }
  }

  toggleRegex(): void {
    this.isWord = !this.isWord;
    if (this.isWord) {
      this.contextValue = this.contextValue?.replace("r", "R");
    } else {
      this.contextValue = this.contextValue?.replace("R", "r");
    }
  }

  setIconPath(name: string, filtersProvider: FiltersProvider) {
    this.iconPath = {
      light: vscode.Uri.file(
        join(__filename, "..", "..", "..", "resources", "light", name + ".svg")
      ),
      dark: vscode.Uri.file(
        join(__filename, "..", "..", "..", "resources", "dark", name + ".svg")
      ),
    };
    filtersProvider.refresh();
  }

  setDefaultIconPath(name: string) {
    this.iconPath = {
      light: vscode.Uri.file(
        join(__filename, "..", "..", "..", "resources", "light", name + ".svg")
      ),
      dark: vscode.Uri.file(
        join(__filename, "..", "..", "..", "resources", "dark", name + ".svg")
      ),
    };
  }
}
