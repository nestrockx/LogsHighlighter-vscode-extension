import { TextEditorDecorationType } from "vscode";

export class FilterColored {
    constructor(public readonly name: string, public checked: boolean = true, public matchCase: boolean = false, public matchWord: boolean = false, public color: TextEditorDecorationType, public colorKey: string, public colorBold: TextEditorDecorationType, public colorBoldKey: string, public icon: string) {
        this.name = name;
        this.checked = checked;
        this.matchCase = matchCase;
        this.matchWord = matchWord;
        this.color = color;
        this.colorKey = colorKey;
        this.colorBold = colorBold;
        this.colorBoldKey = colorBoldKey;
        this.icon = icon;
    };
}