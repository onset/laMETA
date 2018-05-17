const electron = require("electron");
import * as Path from "path";
import * as fs from "fs-extra";

export function showInExplorer(path: string) {
  if (process.platform === "win32") {
    //https://github.com/electron/electron/issues/11617
    path = replaceall("/", "\\", path);
  }
  electron.shell.showItemInFolder(path);
}

export function replaceall(
  replaceThis: string,
  withThis: string,
  inThis: string
) {
  withThis = withThis.replace(/\$/g, "$$$$");
  return inThis.replace(
    new RegExp(
      replaceThis.replace(
        /([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g,
        "\\$&"
      ),
      "g"
    ),
    withThis
  );
}

// Find a file or directory that is part of the distribution.
// The path will vary when we're running from source vs in an asar-packaged mac app.
// See https://github.com/electron-userland/electron-builder/issues/751
export function locate(path: string): string {
  const appPath = electron.remote.app.getAppPath();
  console.log(`locate(${path})  appPath= ${appPath}`);

  // If we are run from outside of a packaged app, our working directory is the right place to be.
  // And no, we can't just set our working directory to somewhere inside the asar. The OS can't handle that.
  let adjustment = "";

  // appPath varies by platform and scenario:

  // windows from source: <somewhere>"\myapp\node_modules\electron\dist\resources\default_app.asar"
  // mac from source: <somewhere>"/myapp/node_modules/electron/dist/Electron.app/Contents/Resources/default_app.asar"

  //  windows from installed package: assets & sample data are one level up from apppath:
  //                        "C:\Users\me\AppData\Local\Programs\myapp\resources\app.asar"
  // mac from a package: <somewhere>"/my.app/Contents/Resources/app.asar"

  // windows from (uninstalled) package: assets & sample data are one level up from apppath:
  //                       <somewhere>"\myapp\release\win-unpacked\resources\app.asar"

  if (appPath.indexOf("default_app.asar") < 0) {
    adjustment = Path.normalize(appPath + "/../..");
  }
  console.log(`locate(${path})  adjustment= ${adjustment}`);
  const result = fs.realpathSync(Path.join(adjustment, path));
  console.log(`locate(${path})  result= ${result}`);

  return result;
}
