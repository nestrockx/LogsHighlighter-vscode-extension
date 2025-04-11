import * as vscode from "vscode";

export class HighlightColors {
  public static errorBgKey = "errorBg";
  public static errorBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(224, 95, 95)",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static infoBgKey = "infoBg";
  public static infoBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(172, 234, 114)",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static debugBgKey = "debugBg";
  public static debugBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(121, 120, 209)",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static warningBgKey = "warningBg";
  public static warningBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(202, 146, 83)",
    color: " #1f1f1f",
    textDecoration: " solid #1f1f1f",
    fontWeight: "bold",
  });

  public static verboseBgKey = "verboseBg";
  public static verboseBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(182, 109, 216)",
    color: " #1f1f1f",
    textDecoration: " solid #1f1f1f",
    fontWeight: "bold",
  });

  public static pinkBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #ff8ee3",
    overviewRulerColor: "rgb(253, 123, 221, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static pinkBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #fd7bdd",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static darkRedBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #ad1010",
    overviewRulerColor: "rgb(119, 0, 0, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #dddddd",
    textDecoration: "solid #dddddd",
  });

  public static darkRedBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #770000",
    color: " #dddddd",
    textDecoration: "solid #dddddd",
    fontWeight: "bold",
  });

  public static redBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #ff7d7d",
    overviewRulerColor: "rgb(245, 103, 103, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static redBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #f56767",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static blueBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #9e9dff",
    overviewRulerColor: "rgb(141, 139, 255, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static blueBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #8d8bff",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static greenBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #bcff7d",
    overviewRulerColor: "rgb(150, 223, 82, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static greenBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #96df52",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static purpleBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #c683fd",
    overviewRulerColor: "rgb(167, 97, 224, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static purpleBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #a761e0",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static yellowBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #ffdd57",
    overviewRulerColor: "rgb(226, 192, 56, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static yellowBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #e2c038",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static whiteBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #ececec",
    overviewRulerColor: "rgb(211, 211, 211, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
  });

  public static whiteBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #d3d3d3",
    color: " #1f1f1f",
    textDecoration: "solid #1f1f1f",
    fontWeight: "bold",
  });

  public static blackBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #181818",
    overviewRulerColor: "rgb(17, 17, 17, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #dddddd",
    textDecoration: " solid #dddddd",
  });

  public static blackBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #111111",
    color: " #dddddd",
    textDecoration: " solid #dddddd",
    fontWeight: "bold",
  });

  public static orangeBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #e9a85e",
    overviewRulerColor: "rgb(218, 142, 55, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    color: " #1f1f1f",
    textDecoration: " solid #1f1f1f",
  });

  public static orangeBoldBg = vscode.window.createTextEditorDecorationType({
    backgroundColor: " #da8e37",
    color: " #1f1f1f",
    textDecoration: " solid #1f1f1f",
    fontWeight: "bold",
  });
}
