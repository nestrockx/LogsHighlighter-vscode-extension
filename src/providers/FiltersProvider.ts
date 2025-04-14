import * as vscode from "vscode";
import { FilterColored } from "../models/FilterColored";
import { FilterItem } from "../provider_items/FilterItem";

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

  private _onDidChangeTreeData: vscode.EventEmitter<
    FilterItem | undefined | null | void
  > = new vscode.EventEmitter<FilterItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FilterItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateFiltersX(filtersColored: Set<FilterColored>): void {
    this.filterItems.clear();
    for (const filterColored of filtersColored) {
      let filterItem = new FilterItem(
        filterColored.name,
        [],
        filterColored.matchCase,
        filterColored.matchWord,
        filterColored.matchRegex,
        filterColored.checked
      );
      filterItem.setIconPath(filterColored.icon, this);
      this.filterItems.add(filterItem);
      this.refresh();
    }
    this.refresh();
  }

  addFilter(filterItem: string): FilterItem {
    let filter = new FilterItem(filterItem);
    this.filterItems.add(filter);
    this.refresh();
    return filter;
  }

  removeFilter(filterItem: string): void {
    let itemToRemove;
    this.filterItems.forEach((item) => {
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

  changeMatchRegexIcon(filterItem: FilterItem): void {
    filterItem.toggleRegex();
    this.refresh();
  }
}
