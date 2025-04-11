import * as vscode from "vscode";
import { HighlightColors } from "./HighlightColors";
import { FilterColored } from "./models/FilterColored";

export class FilterSetManager {
  public static deleteFromFilterSet(
    set: Set<FilterColored>,
    nameToDelete: string
  ): void {
    for (let item of set) {
      if (item.name === nameToDelete) {
        set.delete(item);
        break;
      }
    }
  }

  public static addToFilterSet(
    set: Set<FilterColored>,
    nameToAdd: string,
    checked: boolean = true,
    matchCase: boolean = false,
    matchWord: boolean = false,
    matchRegex: boolean = false,
    color: vscode.TextEditorDecorationType = HighlightColors.blueBg,
    colorKey: string = "blueBg",
    colorBold: vscode.TextEditorDecorationType = HighlightColors.blueBoldBg,
    colorBoldKey: string = "blueBoldBg",
    icon: string = "square_blue"
  ): void {
    set.add(
      new FilterColored(
        nameToAdd,
        checked,
        matchCase,
        matchWord,
        matchRegex,
        color,
        colorKey,
        colorBold,
        colorBoldKey,
        icon
      )
    );
  }

  public static hasFilterSet(
    set: Set<FilterColored>,
    nameToCheck: string
  ): boolean {
    for (let item of set) {
      if (item.name === nameToCheck) {
        return true;
      }
    }
    return false;
  }

  public static getFilterNameArray(set: Set<FilterColored>): string[] {
    let array: string[] = [];
    for (let item of set) {
      array.push(item.name);
    }
    return array;
  }

  public static getFilterNameSet(set: Set<FilterColored>): Set<string> {
    let array: string[] = [];
    for (let item of set) {
      array.push(item.name);
    }
    return new Set(array);
  }

  public static getFilterByName(
    set: Set<FilterColored>,
    nameToGet: string
  ): FilterColored {
    for (let item of set) {
      if (item.name === nameToGet) {
        return item;
      }
    }
    return new FilterColored(
      "",
      false,
      false,
      false,
      false,
      HighlightColors.blueBg,
      "blueBg",
      HighlightColors.blueBoldBg,
      "blueBoldBg",
      "square_blue"
    );
  }
}
